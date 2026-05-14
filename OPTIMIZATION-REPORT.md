# Technical Optimization Report — Topchart Platform

## 1. Transaction & Paystack Payment Fixes

### Issues Identified
- **Race condition / double-credit**: Webhook and verify route both process the same payment independently, risking double wallet credits
- **Missing amount verification**: No check that Paystack payment amount matches expected DB amount
- **Duplicated referral logic**: `checkAndCreditReferrer()` and `getReferralSettings()` were copy-pasted across webhook and verify routes (~100 lines duplicated)
- **Missing `crypto` import**: Verify route used `crypto.randomUUID()` without importing `crypto`
- **Webhook returns 500 on error**: Paystack retries on 500s indefinitely, causing duplicate processing attempts

### Fixes Applied
- **Shared referral utils** (`src/lib/referral-utils.ts`): Extracted `checkAndCreditReferrer()` and `getReferralSettings()` into a single module, imported by both webhook and verify routes
- **Amount verification**: Added `AMOUNT_TOLERANCE_PCT` (2%) check in webhook — if Paystack amount Last Namesn't match DB amount, the transaction is flagged with `amount_mismatch: true` in metadata and wallet is NOT credited
- **Atomic DB update with EXISTS guard**: Added `AND EXISTS (SELECT 1 FROM updated_tx)` to the wallet credit CTE, preventing credit when no rows were updated
- **Webhook returns 200 on all processing errors**: Changed from 500 to 200 with `received: true` to prevent Paystack infinite retries. Errors are logged server-side for manual reconciliation
- **Missing transaction handling**: If webhook references a transaction not in DB, returns 200 with warning instead of silently ignoring
- **Reseller payment try/catch**: Wrapped `finalizeResellerApplicationPayment` in try/catch so a failure Last Namesn't block the 200 response

### Files Modified
- `src/app/api/payments/webhook/route.ts` — Full rewrite
- `src/app/api/payments/verify/route.ts` — Removed duplicated referral code, imported shared utils
- `src/lib/referral-utils.ts` — New shared module

---

## 2. Paystack API Reliability

### Issues Identified
- **No request timeouts**: Paystack API calls could hang indefinitely, blocking the request thread
- **No abort handling**: Network failures returned generic "Failed to initialize/verify" errors

### Fixes Applied
- **AbortController timeouts**: Added 30-second timeout to `initializePaystackTransaction()` and `verifyPaystackTransaction()` using `AbortController`
- **Timeout-specific error messages**: `AbortError` now returns "Payment initialization/verification timed out. Please try again."

### Files Modified
- `src/lib/paystack.ts` — Added `PAYSTACK_TIMEOUT_MS`, `AbortController`, timeout-specific error handling

---

## 3. Media Upload & Retrieval Optimization

### Issues Identified
- **GET query selects legacy/non-existent columns**: Query selected `section`, `slot_key`, `media_type`, `file_url`, `priority` which may not exist in the current schema
- **Upload Last Namesn't store image dimensions**: `uploadMedia()` extracts width/height but they weren't saved to DB
- **`uploadMedia()` API mismatch**: Route passed `storageSource` string instead of `UploadOptions` object

### Fixes Applied
- **Fixed GET query**: Now selects only valid columns: `section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, storage_source, file_name, mime_type, file_size, width, height, duration_seconds`
- **Stores dimensions**: INSERT now includes `width` and `height` columns from upload result
- **Fixed uploadMedia call**: Changed from `uploadMedia(file, section, storageSource)` to `uploadMedia(file, section, { source: storageSource })`
- **Removed legacy column references**: INSERT no longer writes to `section`, `slot_key`, `media_type`, `file_url`, `priority`

### Files Modified
- `src/app/api/admin/homepage-media/route.ts` — Fixed GET query, INSERT columns, uploadMedia call

---

## 4. Security Assessment & Fixes

### Issues Identified
- **Timing attack on webhook signatures**: All webhook signature validations used `===` comparison, which is vulnerable to timing attacks
- **Password logged to console**: Register API route and auth-context both logged full request bodies (including passwords) via `console.log(JSON.stringify(body))`
- **`require()` instead of `import`**: DataMart and Airalo webhooks used `require("crypto")` instead of proper ESM imports

### Fixes Applied
- **Timing-safe signature comparison**: 
  - `paystack-utils.ts`: Custom `timingSafeEqual()` wrapper using `crypto.timingSafeEqual` with hex-encoded buffers
  - `datamart/route.ts`: Replaced `===` with `crypto.timingSafeEqual` + proper `import crypto`
  - `airalo.ts`: Fixed `require("crypto")` → `import crypto`, added hex encoding, added length check
- **Removed password logging**:
  - `src/app/api/auth/register/route.ts`: Changed from logging full body to logging only email
  - `src/lib/auth-context.tsx`: Removed `JSON.stringify(requestBody)` and `JSON.stringify(result)` logging
- **Added crypto import to airalo.ts**: Proper ESM import at top of file

### Files Modified
- `src/lib/paystack-utils.ts` — Timing-safe comparison
- `src/app/api/webhooks/datamart/route.ts` — Timing-safe comparison + proper import
- `src/lib/airalo.ts` — Timing-safe comparison + proper import
- `src/app/api/auth/register/route.ts` — Removed password logging
- `src/lib/auth-context.tsx` — Removed password logging

---

## 5. Performance Optimization

### Database
- **Pool sizing**: Increased production max connections from 10 to 20; added `keepAlive: true` with 10s initial delay to prevent connection drops
- **Transaction query optimization**: Combined data + count queries into single query using `COUNT(*) OVER()` window function, eliminating a separate DB round-trip
- **Query limit capping**: Added `Math.min(limit, 200)` to prevent excessively large queries

### Next.js Configuration
- **Extended `optimizePackageImports`**: Added 11 more packages (all @radix-ui components, sonner, date-fns, uuid, @supabase/supabase-js) for better tree-shaking and faster cold starts
- **Static asset caching headers**: Added `Cache-Control` headers for:
  - `/uploads/*` — 1 year immutable cache
  - `/icon.png`, `/logo.svg` — 24-hour cache
  - `/api/service-status` — 60s CDN cache with 120s stale-while-revalidate
  - `/api/content/*` — 5min CDN cache with 10min stale-while-revalidate

### Files Modified
- `src/lib/db.ts` — Pool optimization
- `src/app/api/payments/transactions/route.ts` — Combined queries, limit capping
- `next.config.ts` — Package imports, caching headers

---

## Priority Summary

| Priority | Area | Impact |
|----------|------|--------|
| **Critical** | Webhook returns 200 (was 500) | Prevents infinite Paystack retries |
| **Critical** | Amount verification | Prevents wallet over-credit fraud |
| **Critical** | Password logging removed | Prevents credential exposure in logs |
| **High** | Timing-safe signatures | Prevents webhook forgery via timing attacks |
| **High** | Paystack API timeouts | Prevents thread-blocking hangs |
| **High** | Shared referral utils | Eliminates code duplication bugs |
| **Medium** | DB pool optimization | Better connection reuse under load |
| **Medium** | Transaction query optimization | Fewer DB round-trips |
| **Medium** | Static asset caching | Faster repeat page loads |
| **Medium** | Package import optimization | Smaller bundles, faster cold starts |
| **Low** | Media dimension storage | Enables responsive image rendering |
