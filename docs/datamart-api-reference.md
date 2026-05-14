# DataMartGH API — Complete Reference & Integration Report

Reverse-engineered and integrated DataMartGH API from `https://api.datamartgh.shop/api/developer`. API server is currently offline; all endpoint schemas inferred from codebase, website scraping, and prior live testing.

---

## PHASE 1: DISCOVERY

### API Server Status (Live Test — 2026-04-25)

| Test | Result |
|------|--------|
| DNS: `api.datamartgh.shop` | Resolves to `31.97.57.143` |
| HTTPS `api.datamartgh.shop:443` | **Connection timeout** (10s) |
| HTTP `api.datamartgh.shop:80` | **Connection refused** |
| Website `www.datamartgh.shop` | **Live** (HTTP 200) |
| `/api/developer/*` on `www` | **404** (API only on `api.` subdomain) |

**Conclusion**: API server is offline. Residential IP (likely developer's home server). Website is hosted separately and is operational.

### Website Scraping — Live Plan Data

Extracted 16 active plans from `https://www.datamartgh.shop/buy` (Next.js SSR RSC payload):

#### MTN (YELLO) — 13 plans

| Capacity | MB | Base Price (GH₵) | Sell Price (GH₵) | Profit | Margin |
|----------|-----|-------------------|-------------------|--------|--------|
| 1GB | 1024 | 4.20 | 4.20 | 0.00 | 0.0% |
| 2GB | 2048 | 8.80 | 9.00 | 0.20 | 2.3% |
| 3GB | 3072 | 13.00 | 13.50 | 0.50 | 3.8% |
| 4GB | 4096 | 18.00 | 19.00 | 1.00 | 5.6% |
| 5GB | 5120 | 22.00 | 23.00 | 1.00 | 4.5% |
| 6GB | 6144 | 26.00 | 27.00 | 1.00 | 3.8% |
| 8GB | 8192 | 34.50 | 36.00 | 1.50 | 4.3% |
| 10GB | 10240 | 42.50 | 43.00 | 0.50 | 1.2% |
| 15GB | 15360 | 60.50 | 62.00 | 1.50 | 2.5% |
| 20GB | 20480 | 80.00 | 82.00 | 2.00 | 2.5% |
| 25GB | 25600 | 100.00 | 103.00 | 3.00 | 3.0% |
| 30GB | 30720 | 122.00 | 125.00 | 3.00 | 2.5% |
| 50GB | 51200 | 200.00 | 201.00 | 1.00 | 0.5% |

#### AirtelTigo (AT_PREMIUM) — 2 plans

| Capacity | MB | Base Price (GH₵) | Sell Price (GH₵) | Profit | Margin |
|----------|-----|-------------------|-------------------|--------|--------|
| 1GB | 1024 | 3.95 | 4.00 | 0.05 | 1.3% |
| 2GB | 2048 | 8.35 | 9.00 | 0.65 | 7.8% |

#### Telecel — 1 plan

| Capacity | MB | Base Price (GH₵) | Sell Price (GH₵) | Profit | Margin |
|----------|-----|-------------------|-------------------|--------|--------|
| 10GB | 10240 | 37.50 | 38.00 | 0.50 | 1.3% |

### Website Structure (from robots.txt & sitemap.xml)

**Disallowed paths**: `/api/`, `/dashboard/`, `/admin/`, `/account/`, `/checkout/`, `/order-status/`, `/payment/`, `/callback/`, `/private/`

**Key pages**:
- `/buy` — Main purchase page (has SSR plan data)
- `/mtnup2u` — MTN UP2U specific
- `/mtn` — MTN plans
- `/TELECEL` — Telecel plans
- `/at-ishare` — AirtelTigo iShare
- `/at-ishare-f` — AirtelTigo iShare Flex
- `/topup` — Wallet top-up
- `/deposite` — Deposit (typo in sitemap)
- `/store` — Store management
- `/api-doc` — API documentation (client-rendered, empty without JS)
- `/SignIn`, `/SignUp` — Auth pages

**Store ID**: `68b72ed67b6b8cd13d258a72` (all plans share this storeId)

---

## PHASE 2: ENDPOINT MAP

All endpoints use base URL `https://api.datamartgh.shop` with prefix `/api/developer`.

### Core Endpoints

#### 1. Get Balance

```
GET /api/developer/balance
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "balance": 150.50,
    "currency": "GHS",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "timestamp": "2026-04-25T17:00:00.000Z"
  },
  "rateLimit": {
    "limit": 100,
    "remaining": 95,
    "resetInSeconds": 3600
  }
}
```

**cURL**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.datamartgh.shop/api/developer/balance
```

---

#### 2. Get Data Packages

```
GET /api/developer/data-packages
GET /api/developer/data-packages?network={YELLO|TELECEL|AT_PREMIUM|at}
Headers: X-API-Key: {api_key}
```

**Query params**:
| Param | Required | Values | Description |
|-------|----------|--------|-------------|
| network | No | YELLO, TELECEL, AT_PREMIUM, at | Filter by network |

**Response schema**:
```json
{
  "status": "success",
  "pricingTier": "string",
  "data": [
    {
      "capacity": "1",
      "mb": "1024",
      "price": "4.2",
      "network": "YELLO",
      "inStock": true
    }
  ],
  "rateLimit": { "limit": 100, "remaining": 94, "resetInSeconds": 3600 }
}
```

**cURL**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.datamartgh.shop/api/developer/data-packages?network=YELLO"
```

---

#### 3. Purchase Data Bundle

```
POST /api/developer/purchase
Headers: X-API-Key: {api_key}, Content-Type: application/json
```

**Request body**:
```json
{
  "phoneNumber": "0241234567",
  "network": "YELLO",
  "capacity": "1",
  "gateway": "wallet"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | string | Yes | Ghana phone number (0XXXXXXXXX) |
| network | string | Yes | YELLO, TELECEL, AT_PREMIUM, at |
| capacity | string | Yes | GB capacity (e.g. "1", "2", "10") |
| gateway | string | No | Payment method (default: "wallet") |

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "purchaseId": "string",
    "orderReference": "string",
    "transactionReference": "string",
    "network": "YELLO",
    "capacity": 1,
    "price": 4.2,
    "balanceBefore": 150.50,
    "balanceAfter": 146.30,
    "orderStatus": "pending",
    "processingMethod": "string"
  }
}
```

**cURL**:
```bash
curl -X POST \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0241234567","network":"YELLO","capacity":"1","gateway":"wallet"}' \
  https://api.datamartgh.shop/api/developer/purchase
```

---

#### 4. Bulk Purchase

```
POST /api/developer/bulk-purchase
Headers: X-API-Key: {api_key}, Content-Type: application/json
```

**Request body**:
```json
{
  "orders": [
    {
      "phoneNumber": "0241234567",
      "network": "YELLO",
      "capacity": "1",
      "ref": "optional-client-ref"
    }
  ]
}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "invalid": 0,
      "totalCharged": 13.2,
      "remainingBalance": 137.30
    },
    "results": [
      {
        "index": 0,
        "ref": "optional-client-ref",
        "phoneNumber": "0241234567",
        "network": "YELLO",
        "capacity": "1",
        "price": 4.2,
        "status": "pending",
        "purchaseId": "string",
        "orderReference": "string",
        "transactionReference": "string",
        "balanceBefore": 150.50,
        "balanceAfter": 146.30
      }
    ]
  }
}
```

---

#### 5. Get Order Status

```
GET /api/developer/order-status/{orderReference}
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "orderId": "string",
    "reference": "string",
    "phoneNumber": "0241234567",
    "network": "YELLO",
    "capacity": 1,
    "price": 4.2,
    "orderStatus": "completed",
    "processingMethod": "string",
    "createdAt": "2026-04-25T17:00:00.000Z",
    "updatedAt": "2026-04-25T17:01:00.000Z"
  }
}
```

**Order statuses**: `pending` → `waiting` → `processing` → `completed` | `failed` | `refunded`

---

#### 6. Get Transactions

```
GET /api/developer/transactions?page={page}&limit={limit}
Headers: X-API-Key: {api_key}
```

| Param | Default | Description |
|-------|---------|-------------|
| page | 1 | Page number |
| limit | 20 | Items per page |

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "_id": "string",
        "type": "purchase|topup|refund",
        "amount": 4.2,
        "balanceBefore": 150.50,
        "balanceAfter": 146.30,
        "balanceChange": -4.2,
        "isCredit": false,
        "status": "completed",
        "reference": "string",
        "gateway": "wallet",
        "description": "1GB YELLO data purchase",
        "relatedPurchase": {
          "_id": "string",
          "phoneNumber": "0241234567",
          "network": "YELLO",
          "capacity": 1
        },
        "createdAt": "2026-04-25T17:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

---

#### 7. Get Usage Stats

```
GET /api/developer/usage/stats
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "today": { "orders": 5, "spent": 42.0 },
    "thisMonth": { "orders": 120, "spent": 1250.0 },
    "allTime": { "orders": 5000, "spent": 52000.0 },
    "statusBreakdown": { "completed": 4800, "failed": 150, "pending": 50 },
    "networkBreakdown": [
      { "network": "YELLO", "count": 3000, "spent": 31000.0 }
    ],
    "apiKey": {
      "name": "Production Key",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastUsed": "2026-04-25T17:00:00.000Z",
      "expiresAt": null
    }
  }
}
```

---

#### 8. Get Delivery Tracker

```
GET /api/developer/delivery-tracker
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "message": "Scanner active",
    "scanner": { "active": true, "waiting": false, "waitSeconds": 300 },
    "stats": { "checked": 150, "delivered": 140, "partial": 5, "pending": 5, "failed": 0 },
    "lastDelivered": {
      "trackingId": 123,
      "batchNumber": 45,
      "placedAt": "2026-04-25T16:50:00.000Z",
      "deliveredAt": "2026-04-25T16:55:00.000Z",
      "summary": "5/5 delivered"
    },
    "checkingNow": null,
    "yourOrders": {
      "inCurrentBatch": null,
      "inLastDeliveredBatch": null
    },
    "startedAt": "2026-04-25T16:00:00.000Z"
  }
}
```

---

#### 9. Get Webhook Status

```
GET /api/developer/webhook/status
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "configured": true,
    "message": "Webhook is configured",
    "url": "https://yourapp.com/api/webhooks/datamart",
    "events": ["order.completed", "order.failed"]
  }
}
```

---

#### 10. Configure Webhook

```
POST /api/developer/webhook/configure
Headers: X-API-Key: {api_key}, Content-Type: application/json
```

**Request body**:
```json
{
  "url": "https://yourapp.com/api/webhooks/datamart",
  "events": ["order.completed", "order.failed"]
}
```

---

#### 11. Test Webhook

```
POST /api/developer/webhook/test
Headers: X-API-Key: {api_key}
```

---

#### 12. Delete Webhook

```
DELETE /api/developer/webhook
Headers: X-API-Key: {api_key}
```

---

#### 13. Get Withdrawal Limits

```
GET /api/developer/v1/withdrawals/meta/limits
Headers: X-API-Key: {api_key}
```

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "walletBalance": 150.50,
    "feePercent": 1.5,
    "singleTxnLimit": 5000,
    "dailyLimit": 10000,
    "todayWithdrawn": 0,
    "todayRemaining": 10000,
    "totalWithdrawn": 50000,
    "hmacRequired": true
  }
}
```

---

#### 14. Create Withdrawal

```
POST /api/developer/v1/withdrawals
Headers: X-API-Key: {api_key}, Content-Type: application/json
        X-Idempotency-Key: {unique_key}
        X-Signature: {hmac_sha256}  (if DATAMART_SIGNING_SECRET set)
        X-Timestamp: {unix_ms}      (if DATAMART_SIGNING_SECRET set)
```

**Request body**:
```json
{
  "amount": 50.0,
  "phoneNumber": "0241234567",
  "network": "MTN",
  "recipientName": "First Name Last Name",
  "clientRef": "optional-ref"
}
```

**HMAC signature**: `sha256("{timestamp}.{method}.{path}.{rawBody}")` using `DATAMART_SIGNING_SECRET`

**Response schema**:
```json
{
  "status": "success",
  "data": {
    "reference": "string",
    "clientRef": "optional-ref",
    "status": "pending",
    "amount": 50.0,
    "fee": 0.75,
    "feePercent": 1.5,
    "totalCharged": 50.75,
    "recipient": { "phone": "0241234567", "network": "MTN", "name": "First Name Last Name" },
    "provider": "string",
    "balanceBefore": 150.50,
    "balanceAfter": 99.75,
    "createdAt": "2026-04-25T17:00:00.000Z"
  }
}
```

---

#### 15. Get Withdrawal Status

```
GET /api/developer/v1/withdrawals/{reference}
Headers: X-API-Key: {api_key}
```

---

#### 16. List Withdrawals

```
GET /api/developer/v1/withdrawals?page={page}&limit={limit}&status={status}
Headers: X-API-Key: {api_key}
```

---

#### 17. Get Purchase History

```
GET /api/developer/purchase-history/{userId}?page={page}&limit={limit}
Headers: X-API-Key: {api_key}
```

---

#### 18. Get Networks (derived)

```
GET /api/developer/data-packages → extract unique networks
```

This is not a dedicated endpoint — networks are derived from the data packages response.

---

### Bills Endpoints (separate module)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/developer/bill/providers` | GET | List bill providers |
| `/api/developer/bill/providers/{id}/variations` | GET | Get provider variations |
| `/api/developer/bill/validate` | POST | Validate account number |
| `/api/developer/bill/pay` | POST | Pay a bill |
| `/api/developer/bill/status/{ref}` | GET | Check bill payment status |

---

## PHASE 3: AUTHENTICATION

### Primary Auth: API Key Header

```
X-API-Key: 4c81615f9b90bd4e2884fa4a03dbcbc5109ed33e4d42b7378ef462f5ad5c3aa1
```

- **Format**: 64-character hex string
- **Placement**: `X-API-Key` header on all requests
- **NOT** `Authorization: Bearer` or `Authorization: Token` (those were incorrect assumptions, now fixed)
- **Environment variable**: `DATAMART_API_KEY` (server-side only)

### Secondary Auth: HMAC Signing (Withdrawals)

For withdrawal endpoints under `/v1/`, HMAC-SHA256 signature is required when `DATAMART_SIGNING_SECRET` is configured:

```
Payload: "{timestamp}.{method}.{path}.{rawBody}"
Signature: HMAC-SHA256(payload, DATAMART_SIGNING_SECRET)
Headers: X-Signature: {hex_signature}, X-Timestamp: {timestamp}
```

### Idempotency

Withdrawal endpoints require `X-Idempotency-Key` header for safe retries.

---

## PHASE 4: DATA STRUCTURE STANDARDIZATION

### Internal Response Wrapper

All API calls go through `datamartRequest<T>()` which normalizes responses:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  errorCode?: ProviderErrorCode;
  attempts?: number;
  rateLimit?: DatamartRateLimit;
}
```

### Network Code Mapping

| User Input | API Code | Display Name | DB Network |
|------------|----------|--------------|------------|
| mtn, yello | `YELLO` | MTN | `MTN` |
| vodafone, telecel | `TELECEL` | Telecel | `TELECEL` |
| airteltigo, at, tigo | `AT_PREMIUM` | AirtelTigo | `AIRTELTIGO` |

### Plan Normalization

Website-scraped plans are normalized from:

```json
{ "_id": "hex", "storeId": "hex", "network": "YELLO", "capacity": 1, "mb": 1024, "basePrice": 4.2, "sellingPrice": 4.2, "profit": 0, "profitMargin": 0, "isActive": true, "inStock": true }
```

To internal `DatamartDataPackage`:

```json
{ "capacity": "1", "mb": "1024", "price": "4.2", "network": "YELLO", "inStock": true }
```

---

## PHASE 5: PURCHASE FLOW

### Complete Purchase Pipeline

```
1. User selects plan → POST /api/purchases
2. Authenticate user (session cookie)
3. Rate limit check (5 req/min per user)
4. Reachability check → isDatamartReachable()
   ├─ FAIL → 503 "Service temporarily unavailable" + auto-refund
   └─ PASS → continue
5. Validate phone number format (Ghana: 0XXXXXXXXX)
6. Check idempotency key
7. Validate wallet balance ≥ price
8. Debit wallet (withTransaction)
9. Call purchaseDataBundle() → POST /api/developer/purchase
   ├─ SUCCESS → capture orderReference
   └─ FAIL → refund wallet, return error
10. Poll order status (3 attempts, 5s intervals)
    ├─ completed → mark transaction SUCCESS
    ├─ failed/refunded → refund wallet, mark FAILED
    └─ still pending → mark PENDING (cron reconciles later)
11. Return result to user
```

### Polling Logic

```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  await sleep(5000);
  const status = await getOrderStatus(orderReference);
  if (status === 'completed' || status === 'failed' || status === 'refunded') break;
}
```

---

## PHASE 6: ERROR HANDLING

### Error Codes

| Code | HTTP | Description | Retryable |
|------|------|-------------|-----------|
| `PROVIDER_TIMEOUT` | 504 | API request timed out (15s) | Yes |
| `PROVIDER_RATE_LIMIT` | 429 | API rate limit hit | Yes (after reset) |
| `PROVIDER_5XX` | 502 | API server error | Yes |
| `PROVIDER_4XX` | 400 | Bad request | No |
| `PROVIDER_AUTH_FAILED` | 401/403 | Invalid API key | No |
| `PROVIDER_NETWORK` | - | DNS/connection failure | Yes |
| `PROVIDER_BAD_RESPONSE` | - | Invalid JSON response | No |
| `PROVIDER_UNSUPPORTED_OPERATION` | - | Operation not supported | No |

### Retry Strategy

- **Default**: 1 retry, 1s delay
- **Purchases**: 0 retries (idempotency concern)
- **Reachability**: 2 endpoints probed, 5s timeout each, 5min cache

### Fallback: Website Scraping

When API is unreachable, `fetchPlansFromWebsite()` scrapes `https://www.datamartgh.shop/buy`:
- Parses Next.js RSC payload for plan JSON
- Extracts `_id`, `network`, `capacity`, `mb`, `basePrice`, `sellingPrice`, `inStock`
- Returns plans grouped by network code
- Sync result includes `source: "website"` to track origin

### Purchase Rate Limiting

- In-memory per-user: **5 purchases per 60 seconds**
- Returns `429 RATE_LIMITED` when exceeded
- Garbage collected every 2 minutes

---

## PHASE 7: BACKEND INTEGRATION

### File Map

| File | Purpose |
|------|---------|
| `src/lib/datamart.ts` | Core API client — all endpoint wrappers, types, reachability |
| `src/lib/datamart-sync.ts` | Plan sync service — API + website fallback, DB upsert |
| `src/lib/providers/http-client.ts` | Generic HTTP client with retry, timeout, error codes |
| `src/lib/bills/providers/datamart.ts` | Bills provider — separate module for bill payments |
| `src/app/api/purchases/route.ts` | Purchase endpoint — wallet debit, API call, polling, refund |
| `src/app/api/purchases/plans/route.ts` | Plans endpoint — DB query with price overrides |
| `src/app/api/admin/datamart/route.ts` | Admin DataMart — balance, usage, delivery tracker, webhooks |
| `src/app/api/admin/datamart/sync-health/route.ts` | Sync health — last sync status, staleness detection |
| `src/app/api/admin/datamart/connectivity-test/route.ts` | Connectivity test — config, reachability, balance check |
| `src/app/api/admin/data-bundles-pricing/route.ts` | Pricing management — list, update, bulk operations |
| `src/scripts/validate-datamart-api.ts` | Validation script — tests all endpoints |
| `src/scripts/diagnose-connections.ts` | Diagnostic script — connection testing |

### Transaction Flow

Every purchase creates a database record:
1. `wallet_transactions` — debit entry with `correlation_id`
2. `purchases` table — order details, status tracking
3. Idempotency via `idempotency_key` column (unique constraint)

---

## PHASE 8: ADMIN CONTROL LAYER

### Pricing Override System

Plans are stored in `data_bundles` with override fields:

| Column | Type | Purpose |
|--------|------|---------|
| `price` | NUMERIC | Provider price (from API/website) |
| `priceOverride` | NUMERIC | Admin-set override (takes precedence) |
| `markupPercent` | NUMERIC | Percentage markup on provider price |
| `isPopular` | BOOLEAN | Admin flag for UI highlighting |
| `isFeatured` | BOOLEAN | Admin flag for featured placement |
| `isActive` | BOOLEAN | Admin can disable individual plans |

**Price resolution**: `COALESCE(priceOverride, price * (1 + markupPercent / 100), price)`

### Sync Health Monitoring

`GET /api/admin/datamart/sync-health` returns:
- **Status**: `healthy` (<2h), `degraded` (<24h), `stale` (<48h), `critical` (>48h)
- **Source**: `api` or `website` (tracks which source was used)
- **Plan counts**: active plans, categories
- **Last sync details**: count, errors, duration, price changes

### Connectivity Test

`GET /api/admin/datamart/connectivity-test` returns:
- Config validation (API key and base URL set)
- Reachability result with reason and cache age
- Balance check (if reachable)

---

## PHASE 9: SECURITY HARDENING

### Completed Measures

| Measure | Status | Details |
|---------|--------|---------|
| API key removed from client bundle | ✅ | `NEXT_PUBLIC_DATAMART_API_KEY` deleted from `.env`, `env.ts`, layout |
| Server-side only API calls | ✅ | All DataMart calls via Route Handlers, never client |
| HMAC signing for withdrawals | ✅ | SHA256 with `DATAMART_SIGNING_SECRET` |
| Purchase rate limiting | ✅ | 5 req/min per user, in-memory |
| Reachability check before purchase | ✅ | Fail-fast with auto-refund |
| Idempotency on purchases | ✅ | Required `idempotency_key` prevents double-charges |
| Base URL normalization | ✅ | Prevents `www` → `api` misrouting |
| Auth failure detection | ✅ | `PROVIDER_AUTH_FAILED` code on 401/403 |

### Environment Variables

| Variable | Required | Server-only | Description |
|----------|----------|-------------|-------------|
| `DATAMART_API_KEY` | Yes | Yes | 64-char hex API key |
| `DATAMART_BASE_URL` | No | Yes | Defaults to `https://api.datamartgh.shop` |
| `DATAMART_WEBHOOK_SECRET` | No | Yes | For verifying webhook payloads |
| `DATAMART_SIGNING_SECRET` | No | Yes | For HMAC signing on withdrawal endpoints |

---

## PHASE 10: TESTING

### Validation Script

Run `npx tsx src/scripts/validate-datamart-api.ts` to test all endpoints:
- Tests 11 endpoints with 10s timeout
- Reports pass/fail per endpoint with latency
- Detects auth format issues
- Indicates when website fallback should be used

### Manual Test Commands

```bash
# Balance
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/balance

# Data packages (all)
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/data-packages

# Data packages (MTN only)
curl -H "X-API-Key: $KEY" "https://api.datamartgh.shop/api/developer/data-packages?network=YELLO"

# Purchase
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0241234567","network":"YELLO","capacity":"1","gateway":"wallet"}' \
  https://api.datamartgh.shop/api/developer/purchase

# Order status
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/order-status/REF_HERE

# Usage stats
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/usage/stats

# Withdrawal limits
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/v1/withdrawals/meta/limits

# Webhook status
curl -H "X-API-Key: $KEY" https://api.datamartgh.shop/api/developer/webhook/status

# Connectivity test (admin)
curl -H "Cookie: session_token=$ADMIN_SESSION" \
  https://yourapp.com/api/admin/datamart/connectivity-test

# Sync health (admin)
curl -H "Cookie: session_token=$ADMIN_SESSION" \
  https://yourapp.com/api/admin/datamart/sync-health
```

### Pending Live Tests

When the API comes back online, validate:
- [ ] Balance endpoint response schema
- [ ] Data packages response format (flat array vs grouped by network)
- [ ] Purchase flow end-to-end with real phone number
- [ ] Order status polling transitions
- [ ] Webhook delivery and payload format
- [ ] Withdrawal HMAC signature acceptance
- [ ] Rate limit headers and actual limits
- [ ] Error response format for invalid phone/balance

---

## Appendix: Database Schema

### data_bundles

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR | Bundle ID (not UUID) |
| networkId | UUID FK → networks | Network reference |
| categoryId | UUID FK → data_bundle_categories | Category reference |
| name | TEXT | Display name |
| sizeMb | INT | Size in megabytes |
| validityHours | INT | Validity period |
| price | NUMERIC | Provider price |
| priceOverride | NUMERIC | Admin override |
| markupPercent | NUMERIC | Percentage markup |
| isPopular | BOOLEAN | Admin flag |
| isActive | BOOLEAN | Admin toggle |
| isFeatured | BOOLEAN | Admin flag |
| datamartPlanId | TEXT | Maps to API `capacity` field |
| datamartPlanType | TEXT | "capacity" for website plans |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### Networks

| Network | UUID |
|---------|------|
| MTN | `a1b2c3d4-0001-0000-0000-000000000001` |
| Telecel | `a1b2c3d4-0002-0000-0000-000000000002` |
| AirtelTigo | `a1b2c3d4-0003-0000-0000-000000000003` |
