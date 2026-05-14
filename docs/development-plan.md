# Topchart Development Plan

## Overview

This plan details five major feature areas requiring implementation and refinement. Each section includes specifications, error handling, security considerations, and step-by-step instructions grounded in the existing codebase.

---

## Phase 1: DataMart Data Fetch & Price Synchronization

### Current State

- `src/lib/datamart-sync.ts` — `syncDatamartPlans()` iterates over `NETWORK_CODES` (`YELLO`, `TELECEL`, `AT_PREMIUM`), fetches packages via `getDataPackages()`, and upserts into `data_bundles`.
- `src/lib/datamart.ts` — Low-level API client with retry logic (3 retries, 1s delay) and 30s timeout via `providerRequest()`.
- API routes exist at `src/app/api/admin/sync-datamart-plans/` and `src/app/api/admin/sync-datamart-plans-scheduled/`.
- Sync results are stored in `system_config` under key `datamart_last_sync`.

### Gaps & Issues

1. **No idempotency** — If a sync is interrupted mid-way, partial data may be committed with no rollback.
2. **No concurrency guard** — Multiple syncs can run simultaneously, causing race conditions on price updates.
3. **Error truncation** — `errors.slice(0, 20)` silently drops errors beyond 20.
4. **No price-change threshold** — Every price difference is logged, even negligible ones (e.g., 0.001 GHS).
5. **No stale-data detection** — If sync hasn't run in >24h, no alert is raised.
6. **`force` mode deletes then re-inserts** — Risky; can lose data if re-insert fails.

### Step-by-Step Implementation

#### Step 1.1: Add Concurrency Lock

- Add a `datamart_sync_lock` key to `system_config`.
- At sync start, check if a lock exists and is younger than 10 minutes. If so, reject the sync request with `409 Conflict`.
- On sync completion (success or failure), release the lock.
- Add a timeout fallback: if lock is older than 10 minutes, force-release it (stale lock detection).

```
File: src/lib/datamart-sync.ts
- Before the NETWORK_CODES loop, INSERT into system_config a lock row with current timestamp.
- After the loop (in a finally block), DELETE the lock row.
- If lock already exists and is <10 min old, throw SyncLockError.
```

#### Step 1.2: Transactional Sync with Rollback

- Wrap each network's sync in a database transaction.
- Collect all INSERT/UPDATE operations for a network into a batch.
- On failure for a single network, roll back that network's changes but continue with others.
- Record which networks succeeded vs failed in the sync result.

```
File: src/lib/datamart-sync.ts
- Use sql`BEGIN` / sql`COMMIT` / sql`ROLLBACK` around each network's loop.
- Track per-network success/failure in a Map<DatamartNetworkCode, 'success' | 'failed' | 'skipped'>.
```

#### Step 1.2a: Remove `force` Delete-Then-Insert Pattern

- Replace the `DELETE + INSERT` force mode with `ON CONFLICT DO UPDATE` (upsert) only.
- The current upsert already handles conflicts correctly; the DELETE step is unnecessary and dangerous.
- Keep the `force` flag but repurpose it to mean "overwrite all fields including `isActive` even if unchanged."

```
File: src/lib/datamart-sync.ts
- Remove lines 88-90 (DELETE FROM data_bundles WHERE id = bundleId).
- In the ON CONFLICT clause, conditionally include isActive update only when force=true.
```

#### Step 1.3: Price Change Threshold & Alerting

- Add a configurable threshold (default: 0.5 GHS or 5%) below which price changes are not flagged as significant.
- Categorize price changes as `minor` (below threshold) and `major` (above threshold).
- Store major price changes in a `datamart_price_alerts` table for admin review.
- Add an admin API endpoint to fetch and dismiss price alerts.

```
New table: datamart_price_alerts
  id UUID PRIMARY KEY
  bundle_id TEXT NOT NULL
  old_price NUMERIC NOT NULL
  new_price NUMERIC NOT NULL
  change_percent NUMERIC NOT NULL
  severity TEXT NOT NULL ('minor' | 'major')
  dismissed BOOLEAN DEFAULT FALSE
  created_at TIMESTAMPTZ DEFAULT NOW()

New file: src/app/api/admin/datamart-price-alerts/route.ts
  GET  — list alerts (filter by severity, dismissed)
  PATCH — dismiss an alert
```

#### Step 1.4: Stale Sync Detection

- After each sync, compare `datamart_last_sync.updatedAt` against current time.
- If >24 hours stale, write a warning to `system_config` under `datamart_sync_stale_warning`.
- Expose this in the admin dashboard health check endpoint (`/api/admin/health`).
- Add a visual indicator on the admin DataMart settings page.

#### Step 1.5: Comprehensive Error Reporting

- Remove the `errors.slice(0, 20)` truncation or increase to 100.
- Add error categorization: `network_fetch_failed`, `plan_sync_failed`, `db_write_failed`, `config_error`.
- Include error counts per category in the sync result.
- Add a `sync_error_log` table for persistent error storage.

```
New table: datamart_sync_errors
  id UUID PRIMARY KEY
  sync_request_id TEXT NOT NULL
  network_code TEXT
  bundle_id TEXT
  error_category TEXT NOT NULL
  error_message TEXT NOT NULL
  created_at TIMESTAMPTZ DEFAULT NOW()
```

#### Step 1.6: Scheduled Sync Hardening

- Verify the scheduled sync route (`/api/admin/sync-datamart-plans-scheduled`) uses a cron secret or HMAC verification.
- Add rate limiting: max 1 scheduled sync per 15 minutes.
- Add a retry mechanism: if sync fails, auto-retry once after 5 minutes.
- Log all scheduled sync attempts to an audit table.

#### Step 1.7: Data Validation Before Write

- Before upserting a bundle, validate:
  - `price > 0` and `price < 10000`
  - `sizeMb > 0` and `sizeMb < 1000000`
  - `planName` is non-empty and < 200 chars
  - `bundleId` matches expected pattern `dm_{CODE}_{capacity}gb`
- Skip invalid entries and log them as errors rather than failing the entire sync.

### Security Considerations

- API key is read from env vars via `getDatamartEnv()` — never expose in client-side code.
- Scheduled sync endpoint must verify a shared secret (e.g., `DATAMART_CRON_SECRET`) before executing.
- Admin sync endpoints must require admin auth via `requireAdmin()`.
- Rate-limit the manual sync endpoint to prevent abuse (max 1 per minute).

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/lib/datamart-sync.ts` | Modify — add lock, transactions, threshold, validation |
| `src/app/api/admin/sync-datamart-plans/route.ts` | Modify — add rate limit, better error responses |
| `src/app/api/admin/sync-datamart-plans-scheduled/route.ts` | Modify — add cron secret verification |
| `src/app/api/admin/datamart-price-alerts/route.ts` | Create — price alert CRUD |
| `migrations/xxx_datamart_price_alerts.sql` | Create — new tables |
| `migrations/xxx_datamart_sync_errors.sql` | Create — error log table |

---

## Phase 2: Verification Page — API Key Fetch & Secure Sync

### Current State

- `src/app/admin/verification/page.tsx` — Admin page with stats, PVADeals balance display, pricing panel, and a "Sync Services" button.
- `src/app/api/admin/verification/sync/route.ts` — Triggers PVADeals sync.
- `src/app/api/admin/verification/services/route.ts` — Fetches verification services.
- `src/app/api/admin/verification/settings/route.ts` — Global markup and exchange rate settings.
- `src/lib/pvadeals.ts` — PVADeals API client with API key auth.

### Gaps & Issues

1. **No API key visibility/management** — Admins cannot see or rotate the PVADeals API key from the UI.
2. **Sync has no progress feedback** — The sync button shows a spinner but no granular progress.
3. **No sync history** — No log of past syncs, their results, or failures.
4. **No API key validation** — Before syncing, there's no check that the API key is valid and the account is active.
5. **Exchange rate is manual** — No auto-fetch from a reliable source.

### Step-by-Step Implementation

#### Step 2.1: API Key Status Widget

- Add a card to the verification admin page showing:
  - API key status (valid/invalid/unknown)
  - Last validated timestamp
  - Account balance (already shown, but add auto-refresh)
  - Rate limit info (if available from PVADeals API)
- Add a "Validate API Key" button that makes a lightweight API call (e.g., balance check) to verify connectivity.
- Store validation result in `system_config` under `pvadeals_key_status`.

```
File: src/app/admin/verification/page.tsx
- Add a new Card component "API Connection Status" above the PVADeals status bar.
- Add state: keyStatus, keyValidating, lastValidated.
- Add handleValidateKey() that calls GET /api/admin/verification/validate-key.

New file: src/app/api/admin/verification/validate-key/route.ts
  GET — calls pvadeals getBalance(), returns { valid, balance, error? }
```

#### Step 2.2: Sync Progress & History

- Replace the single `syncStatus` state with a richer object:
  ```
  {
    status: 'idle' | 'running' | 'success' | 'error'
    progress: { current: number, total: number, phase: string }
    result: { synced: number, failed: number, message: string }
    startedAt: string | null
    completedAt: string | null
  }
  ```
- Use Server-Sent Events (SSE) or polling to report progress during sync.
- Add a `verification_sync_log` table to persist sync history.

```
New table: verification_sync_log
  id UUID PRIMARY KEY
  status TEXT NOT NULL ('running' | 'success' | 'partial' | 'failed')
  services_synced INTEGER DEFAULT 0
  services_failed INTEGER DEFAULT 0
  error_message TEXT
  triggered_by TEXT ('admin' | 'scheduled' | 'api')
  duration_ms INTEGER
  created_at TIMESTAMPTZ DEFAULT NOW()
  completed_at TIMESTAMPTZ
```

- Add a "Sync History" section to the verification admin page showing the last 10 syncs.

#### Step 2.3: Secure API Key Storage

- Move PVADeals API key storage from `.env.local` only to a hybrid approach:
  - Primary: environment variable (as current)
  - Secondary: encrypted value in `system_config` table (for rotation without redeployment)
- Add an admin API endpoint to update the encrypted API key:
  ```
  POST /api/admin/verification/api-key
  Body: { apiKey: string }
  - Encrypt with AES-256-GCM using a server-side encryption key from env
  - Store in system_config under 'pvadeals_api_key_encrypted'
  - Never return the decrypted key in any API response
  ```
- Add audit logging for key rotation events.

#### Step 2.4: Auto Exchange Rate Fetch

- Add a scheduled job or on-demand endpoint to fetch USD→GHS rate from a reliable API (e.g., exchangerate.host, frankfurter.app).
- Store the fetched rate in `system_config` under `exchange_rate_usd_ghs` with a timestamp.
- Allow admins to override the auto-fetched rate manually (current behavior).
- Show the source of the rate (auto vs manual) and last-updated time in the UI.

```
New file: src/app/api/admin/verification/fetch-exchange-rate/route.ts
  POST — fetches rate from external API, stores in system_config, returns { rate, source, fetchedAt }
```

#### Step 2.5: Sync Error Recovery

- If a sync partially fails, allow admins to retry only the failed services.
- Track which services failed in the sync log.
- Add a "Retry Failed" button that re-syncs only the previously failed services.

### Security Considerations

- API key must never appear in client-side code or API responses.
- The validate-key endpoint must be admin-only (`requireAdmin()`).
- Encrypted key storage must use a dedicated encryption key (not the DB connection string).
- Rate-limit the sync endpoint to prevent DoS against PVADeals API.
- Log all sync and key-management actions for audit.

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/app/admin/verification/page.tsx` | Modify — add key status widget, sync progress, history |
| `src/app/api/admin/verification/sync/route.ts` | Modify — add progress tracking, error recovery |
| `src/app/api/admin/verification/validate-key/route.ts` | Create — key validation |
| `src/app/api/admin/verification/api-key/route.ts` | Create — secure key management |
| `src/app/api/admin/verification/fetch-exchange-rate/route.ts` | Create — auto rate fetch |
| `src/app/api/admin/verification/sync-history/route.ts` | Create — sync log retrieval |
| `migrations/xxx_verification_sync_log.sql` | Create — sync log table |

---

## Phase 3: Admin "Coming Soon" & "Under Maintenance" Banners

### Current State

- `src/app/admin/service-status/page.tsx` — Full admin page with toggle switches for:
  - **Enabled/Disabled** — `Switch` component, calls `handleToggleEnabled()`
  - **Coming Soon** — `Switch` component with confirmation dialog, calls `handleToggleComingSoon()`
  - **Under Maintenance** — `Switch` component, calls `handleToggleMaintenance()`
  - Message editing for both Coming Soon and Maintenance
- `src/components/service-guard.tsx` — Client component that wraps service pages, showing overlays for disabled/maintenance/coming-soon states.
- `src/components/coming-soon-badge.tsx` — `ComingSoonBadge` and `ComingSoonOverlay` components.
- `src/hooks/use-service-status.ts` — SWR hook fetching from `/api/service-status`.
- `src/app/api/admin/service-status/route.ts` — Admin CRUD with audit logging.
- `src/app/api/service-status/route.ts` — Public cached endpoint.
- `src/components/header.tsx` — Filters visible service links by `isEnabled()` and shows `ComingSoonBadge` on coming-soon items.

### Gaps & Issues

1. **Toggle state inconsistency** — When `is_enabled = false`, the Coming Soon and Maintenance toggles are disabled in the UI but the backend Last Namesn't enforce this constraint. A direct API call could set `is_coming_soon = true` on a disabled service.
2. **No banner preview** — Admins cannot preview how the banner will look to users before saving.
3. **Mutual exclusivity not enforced** — A service can be both `is_coming_soon = true` and `is_maintenance = true` simultaneously, which creates ambiguous UI.
4. **No scheduled transitions** — Admins cannot schedule a "Coming Soon" to automatically change to active at a future date.
5. **ServiceGuard Last Namesn't handle all edge cases** — If a service is disabled AND coming-soon, the disabled state takes precedence but the coming-soon message is lost.
6. **Toggle switch lacks visual feedback** — No loading spinner on the switch itself during save.

### Step-by-Step Implementation

#### Step 3.1: Enforce Mutual Exclusivity on Backend

- In the PATCH handler of `/api/admin/service-status`, add business rules:
  - If `is_coming_soon` is being set to `true`, automatically set `is_maintenance = false`.
  - If `is_maintenance` is being set to `true`, automatically set `is_coming_soon = false`.
  - If `is_enabled` is being set to `false`, automatically set `is_coming_soon = false` and `is_maintenance = false`.
  - Return the full updated object so the frontend stays in sync.

```
File: src/app/api/admin/service-status/route.ts
- After building the updates object, apply mutual exclusivity rules.
- Add these rules BEFORE the SQL UPDATE so they're applied atomically.
- Include the auto-changed fields in the audit log.
```

#### Step 3.2: Add Toggle Loading State to Switch Components

- Each `Switch` already has `disabled={saving === service.service_key}`.
- Enhance: show a small spinner overlay on the switch thumb while saving.
- Use a custom Switch wrapper component that accepts a `loading` prop.

```
New file: src/components/ui/switch-with-loading.tsx
- Wraps the base Switch component.
- When loading=true, shows a tiny spinner on the thumb and disables interaction.
- Maintains the same API as Switch for drop-in replacement.

File: src/app/admin/service-status/page.tsx
- Replace all <Switch> instances with <SwitchWithLoading>.
- Pass loading={saving === service.service_key} prop.
```

#### Step 3.3: Banner Preview Modal

- Add a "Preview" button next to each service card.
- On click, open a Dialog showing a mockup of how the service page will appear to users:
  - For Coming Soon: shows the `ComingSoonOverlay` with the configured message and date.
  - For Maintenance: shows the maintenance overlay with the configured message.
  - For Disabled: shows the "Service Unavailable" screen.
- Use the actual `ServiceGuard`, `ComingSoonOverlay`, and maintenance UI components for accurate preview.

```
File: src/app/admin/service-status/page.tsx
- Add preview state: previewService: ServiceStatus | null.
- Add a "Preview" button (Eye icon) on each card.
- Add a Dialog that renders the appropriate overlay based on service state.
```

#### Step 3.4: Scheduled Status Transitions

- Add fields to `service_status` table:
  ```
  scheduled_action TEXT NULL  -- 'enable', 'disable', 'end_coming_soon', 'end_maintenance'
  scheduled_at TIMESTAMPTZ NULL  -- when to execute the action
  ```
- Add a cron endpoint that checks for due scheduled actions and executes them.
- Add UI for scheduling in the admin page:
  - When toggling Coming Soon ON, offer an optional "Auto-activate on" date picker.
  - When toggling Maintenance ON, offer an optional "Auto-resume on" date picker.

```
Migration: ALTER TABLE service_status ADD COLUMN scheduled_action TEXT, ADD COLUMN scheduled_at TIMESTAMPTZ;

New file: src/app/api/admin/service-status/scheduled/route.ts
  GET  — list pending scheduled actions
  POST — schedule a new action
  DELETE — cancel a scheduled action

New file: src/app/api/admin/service-status/execute-scheduled/route.ts
  POST — cron endpoint, executes due scheduled actions (requires cron secret)
```

#### Step 3.5: Fix ServiceGuard Edge Cases

- Update `ServiceGuard` to handle combined states with clear priority:
  1. **Disabled** (highest priority) — show "Service Unavailable" with the disabled message.
  2. **Maintenance** — show maintenance overlay.
  3. **Coming Soon** — show coming soon overlay.
  4. **Active** — render children normally.
- If a service is disabled but has a coming_soon_message, show the message in the disabled view (e.g., "This service is currently unavailable but is coming soon!").

```
File: src/components/service-guard.tsx
- Refactor the conditional chain to be explicit about priority.
- Add the coming_soon_message to the disabled view when is_coming_soon is also true.
```

#### Step 3.6: Consistent Toggle Behavior Across Site

- Audit all pages that use `useServiceStatus` to ensure they respect all three states.
- Key pages to verify:
  - `src/components/header.tsx` — already filters by `isEnabled`, shows `ComingSoonBadge` ✓
  - `src/app/(dashboard)/` pages — should use `ServiceGuard` wrapper
  - Homepage service cards — should show badges for coming-soon/maintenance services
- Add a utility function `getServiceDisplayState(serviceKey)` that returns a single canonical state: `'active' | 'coming_soon' | 'maintenance' | 'disabled'`.

```
File: src/hooks/use-service-status.ts
- Add getServiceDisplayState(serviceKey) function.
- Returns the canonical state based on priority rules.

File: src/components/header.tsx
- Use getServiceDisplayState for cleaner conditional logic.
- Show maintenance badge in addition to coming-soon badge in dropdown.
```

### Security Considerations

- All admin endpoints already use `requireAdmin()` — maintain this.
- Scheduled action endpoint must verify a cron secret.
- Audit logging already exists — extend it to cover scheduled actions and mutual exclusivity auto-changes.
- Validate scheduled_at is in the future on the backend.

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/app/api/admin/service-status/route.ts` | Modify — mutual exclusivity rules |
| `src/app/admin/service-status/page.tsx` | Modify — preview, loading switches, scheduling UI |
| `src/components/service-guard.tsx` | Modify — edge case handling |
| `src/hooks/use-service-status.ts` | Modify — add getServiceDisplayState |
| `src/components/header.tsx` | Modify — use canonical state, add maintenance badge |
| `src/components/ui/switch-with-loading.tsx` | Create — loading switch component |
| `src/app/api/admin/service-status/scheduled/route.ts` | Create — scheduled actions CRUD |
| `src/app/api/admin/service-status/execute-scheduled/route.ts` | Create — cron executor |
| `migrations/xxx_service_status_scheduling.sql` | Create — add scheduled columns |

---

## Phase 4: Admin Service Enable/Disable Toggle

### Current State

- The enable/disable toggle already exists in `src/app/admin/service-status/page.tsx` (line 444-460).
- `handleToggleEnabled()` calls `PATCH /api/admin/service-status` with `{ service_key, is_enabled }`.
- The backend updates `is_enabled` and logs to `service_status_audit`.
- `src/components/header.tsx` filters service links by `isEnabled(key)`.
- `src/components/service-guard.tsx` shows "Service Unavailable" when `!isEnabled(serviceKey)`.

### Gaps & Issues

1. **No confirmation dialog for disable** — Unlike Coming Soon (which has a confirmation dialog), disabling a service takes effect immediately with no confirmation.
2. **No cascade effect documentation** — Disabling "data" Last Namesn't explicitly warn that data bundle purchases will fail.
3. **Active sessions not handled** — Users mid-transaction on a service that gets disabled have no graceful fallback.
4. **No bulk enable/disable** — Admins must toggle each service individually.
5. **Disabled services still appear in some navigation** — The footer and other static links may still reference disabled services.

### Step-by-Step Implementation

#### Step 4.1: Confirmation Dialog for Disable

- Add a confirmation dialog (similar to the Coming Soon one) for the enable/disable toggle.
- When disabling, the dialog should show:
  - Service name
  - Warning: "Users will not be able to access this service"
  - Impact summary: number of active users on this service (from dashboard stats)
  - Confirm/Cancel buttons

```
File: src/app/admin/service-status/page.tsx
- Add confirmDisableDialog state similar to confirmDialog.
- Modify handleToggleEnabled to show dialog when newValue=false.
- Add impact data fetch: GET /api/admin/service-status/{key}/impact
```

#### Step 4.2: Active Session Grace Period

- When a service is disabled, don't immediately block access.
- Instead, set a `grace_period_until` timestamp (default: 5 minutes from now).
- During the grace period, show a banner to users: "This service is being decommissioned. Please complete your transaction."
- After the grace period, fully disable the service.

```
Migration: ALTER TABLE service_status ADD COLUMN disabled_at TIMESTAMPTZ, ADD COLUMN grace_period_until TIMESTAMPTZ;

File: src/app/api/admin/service-status/route.ts
- When is_enabled is set to false, set disabled_at=NOW() and grace_period_until=NOW()+5min.
- When is_enabled is set to true, clear both fields.

File: src/components/service-guard.tsx
- Check grace_period_until. If current time < grace_period_until, show warning banner instead of blocking.
- If current time >= grace_period_until, show full disabled view.

File: src/hooks/use-service-status.ts
- Expose isGracePeriod(serviceKey) and getGracePeriodEnd(serviceKey).
```

#### Step 4.3: Bulk Enable/Disable

- Add a toolbar to the service status page with:
  - "Select All" checkbox
  - "Enable Selected" button
  - "Disable Selected" button
- Use the existing `POST /api/admin/service-status` bulk endpoint (already supports arrays).
- Add confirmation dialog for bulk disable.

```
File: src/app/admin/service-status/page.tsx
- Add selectedServices state (Set<string>).
- Add checkbox to each service card.
- Add toolbar with bulk actions.
- Extend the bulk POST to also handle is_enabled (currently only handles is_coming_soon).
```

#### Step 4.4: Comprehensive Navigation Audit

- Ensure disabled services are hidden from:
  - Header dropdown (already done ✓)
  - Mobile navigation menu
  - Footer service links
  - Homepage service cards
  - Sitemap (`src/app/sitemap.ts`)
  - Any hardcoded links in marketing pages
- Add a centralized `getEnabledServices()` utility that all navigation components use.

```
File: src/hooks/use-service-status.ts
- Add getEnabledServices() returning only enabled service keys.

File: src/components/footer.tsx
- Use useServiceStatus to filter footer links.

File: src/app/sitemap.ts
- Filter sitemap entries based on service status (may need server-side fetch).
```

#### Step 4.5: Real-Time Status Propagation

- Currently, `useServiceStatus` polls every 5 minutes (`refreshInterval: 300000`).
- For disable actions that need faster propagation, reduce the refresh interval to 60 seconds when any service is in a non-active state.
- Alternatively, use a push-based approach: after an admin toggles a service, invalidate the SWR cache on the client via a lightweight polling mechanism.

```
File: src/hooks/use-service-status.ts
- Add dynamic refreshInterval: 60000 when any service is disabled/maintenance, 300000 otherwise.
- Add a "last checked" indicator in the UI.
```

### Security Considerations

- Disable confirmation prevents accidental service shutdown.
- Grace period prevents active-transaction disruption.
- Bulk actions must be admin-only with audit logging.
- Rate-limit bulk operations to prevent rapid toggling.

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/app/admin/service-status/page.tsx` | Modify — confirmation, bulk actions, selection |
| `src/app/api/admin/service-status/route.ts` | Modify — grace period, bulk is_enabled |
| `src/components/service-guard.tsx` | Modify — grace period banner |
| `src/hooks/use-service-status.ts` | Modify — grace period helpers, dynamic refresh |
| `src/components/footer.tsx` | Modify — filter disabled services |
| `src/app/sitemap.ts` | Modify — exclude disabled services |
| `migrations/xxx_service_status_grace_period.sql` | Create — grace period columns |

---

## Phase 5: Header Icon & Media Content Management

### Current State

- `src/app/admin/homepage-media/page.tsx` — Admin page with upload, select-from-library, toggle active/inactive, delete, and priority management.
- `src/lib/homepage-media.ts` — Section/slot definitions, type utilities, legacy mapping.
- `src/components/dynamic-header-logo.tsx` — Fetches header logo from media API.
- `src/components/logo-video.tsx` — Video logo component.
- `src/components/responsive-media.tsx` — Responsive media renderer.
- `src/components/video-background.tsx` — Video background component.
- API routes: `/api/admin/media/`, `/api/admin/media/upload/`, `/api/admin/media/files/`, `/api/admin/media/select/`, `/api/admin/media/[id]/`.

### Gaps & Issues

1. **Header icon slot is limited** — Only `header_logo` slot exists. No slots for service icons, favicons, or nav icons.
2. **No video support in header** — The header logo component only handles images, not videos.
3. **No media preview on upload** — Admins can't preview a file before committing it to a slot.
4. **No multi-file upload** — Each upload is single-file only.
5. **No crop/resize** — Images are uploaded as-is; no client-side cropping or server-side resizing.
6. **Footer section has no slots** — `SLOT_OPTIONS.footer` is an empty array.
7. **No media usage tracking** — No way to see which media items are actually being rendered on the site.
8. **No version history** — Replacing a slot's media overwrites the previous entry with no history.

### Step-by-Step Implementation

#### Step 5.1: Expand Header Icon Slots

- Add new slots to the header section:
  ```
  header_favicon         — Favicon (32x32, ico/png)
  header_apple_touch     — Apple touch icon (180x180, png)
  header_service_icon    — Generic service nav icon (svg/png)
  header_mobile_logo     — Mobile-specific logo (smaller)
  header_dark_logo       — Dark mode logo variant
  ```
- Update `SLOT_OPTIONS` in both `src/lib/homepage-media.ts` and `src/app/admin/homepage-media/page.tsx`.

```
File: src/lib/homepage-media.ts
- Add new slot entries to SLOT_OPTIONS.header.
- Add validation rules per slot (e.g., favicon must be ico/png, max 32x32).

File: src/app/admin/homepage-media/page.tsx
- Update local SLOT_OPTIONS to match.
```

#### Step 5.2: Video Support in Header Logo

- Update `DynamicHeaderLogo` to detect if the active media for `header_logo` is a video.
- If video, render a muted autoplay loop video element instead of an `<img>`.
- Add a `header_logo_video` slot specifically for video logos (separate from static image).

```
File: src/components/dynamic-header-logo.tsx
- Fetch media type alongside URL.
- If media_type === 'video', render <video> with autoplay, loop, muted, playsInline.
- If media_type === 'image', render <img> as current.
- Add fallback: if video fails to load, show a static image placeholder.
```

#### Step 5.3: Upload Preview & Client-Side Crop

- Before upload, show a preview of the selected file in the upload form.
- For images, add a client-side crop tool:
  - Use a lightweight library (e.g., `react-image-crop` or `react-easy-crop`).
  - Define recommended dimensions per slot (e.g., header_logo: 200x48, hero_background: 1920x1080).
  - Show the recommended size and allow crop within those bounds.
- For videos, show a thumbnail preview and duration.

```
File: src/app/admin/homepage-media/page.tsx
- Add preview state: previewUrl: string | null.
- On file select, create an object URL for preview.
- Add ImageCropDialog component for image slots.
- Add dimension recommendations per slot.

New file: src/components/ui/image-crop-dialog.tsx
- Modal with crop area.
- Returns cropped File/Blob on confirm.
```

#### Step 5.4: Multi-File Upload

- Allow uploading multiple files at once to different slots.
- Show a queue of pending uploads with progress per file.
- Use `Promise.allSettled()` for parallel uploads with individual error handling.

```
File: src/app/admin/homepage-media/page.tsx
- Change file input to accept multiple files.
- Add upload queue state: Array<{ file: File, slotKey: string, status: 'pending' | 'uploading' | 'done' | 'error' }>.
- Add a "Batch Upload" mode that assigns files to slots sequentially.
```

#### Step 5.5: Footer Media Slots

- Add footer media slots:
  ```
  footer_logo            — Footer logo
  footer_payment_icons   — Payment method icons (allowsMultiple)
  footer_social_icons    — Social media icons (allowsMultiple)
  footer_background      — Footer background image/pattern
  ```
- Update `SLOT_OPTIONS.footer` in both config files.
- Update `src/components/footer.tsx` to use `DynamicHeaderLogo`-style fetching for footer media.

```
File: src/lib/homepage-media.ts
- Add footer slots to SLOT_OPTIONS.

File: src/app/admin/homepage-media/page.tsx
- Update local SLOT_OPTIONS.

File: src/components/footer.tsx
- Fetch footer media from /api/content/media or /api/admin/media (public route).
- Render footer logo, payment icons, social icons from media items.
```

#### Step 5.6: Media Version History

- When a media item is replaced (same slot, new upload), don't delete the old one.
- Instead, set the old item's status to `archived` and increment the new item's `version`.
- Add a "Version History" expandable section on each media card showing previous versions.
- Allow admins to rollback to a previous version (set archived item to active, current to inactive).

```
File: src/app/api/admin/media/upload/route.ts
- Before inserting new media, set existing active media for the same slot to 'archived'.
- Set new media version = max_version + 1.

File: src/app/admin/homepage-media/page.tsx
- Add version history display per media card.
- Add rollback button per archived version.
```

#### Step 5.7: Media Usage Tracking

- Add a `last_served_at` column to `homepage_media` table.
- In the public media-serving endpoints, update `last_served_at` on read (with debouncing — max once per hour per item).
- Show a "Last served" timestamp in the admin UI.
- Flag items that haven't been served in 30+ days as "potentially unused."

```
Migration: ALTER TABLE homepage_media ADD COLUMN last_served_at TIMESTAMPTZ;

File: src/app/api/content/media/route.ts (or equivalent public media endpoint)
- On successful read, UPDATE last_served_at WHERE id = ? (rate-limited to once/hour).

File: src/app/admin/homepage-media/page.tsx
- Show last_served_at on each media card.
- Add filter: "Show unused media" (last_served_at NULL or >30 days ago).
```

#### Step 5.8: Server-Side Image Optimization

- For uploaded images, generate optimized variants on the server:
  - Thumbnail (150x150, webp)
  - Medium (600x400, webp)
  - Full (original dimensions, webp)
- Store variants alongside the original in Supabase Storage.
- Serve appropriate variant based on client context (use `src/components/responsive-media.tsx`).
- Use `sharp` for server-side processing (already common in Next.js ecosystem).

```
New file: src/lib/image-optimizer.ts
- Function: optimizeImage(buffer, options) => Promise<{ variants: Array<{ size, width, height, buffer, format }> }>

File: src/app/api/admin/media/upload/route.ts
- After uploading original, queue image optimization.
- Store variants in Supabase under media/{slotKey}/variants/{size}.{ext}.

File: src/components/responsive-media.tsx
- Use <picture> with srcset pointing to optimized variants.
- Fallback to original if variants not available.
```

### Security Considerations

- File upload must validate MIME type and file size (max 10MB for images, 50MB for videos).
- Sanitize filenames to prevent path traversal.
- Only allow whitelisted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `image/x-icon`, `video/mp4`, `video/webm`.
- Virus scan uploaded files (or use Supabase's built-in scanning).
- Admin-only access for all upload/delete/modify operations.
- Rate-limit uploads to prevent storage abuse.

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/lib/homepage-media.ts` | Modify — new slots, validation rules |
| `src/app/admin/homepage-media/page.tsx` | Modify — preview, crop, multi-upload, versions |
| `src/components/dynamic-header-logo.tsx` | Modify — video support |
| `src/components/footer.tsx` | Modify — dynamic media rendering |
| `src/components/responsive-media.tsx` | Modify — srcset with variants |
| `src/app/api/admin/media/upload/route.ts` | Modify — versioning, optimization |
| `src/components/ui/image-crop-dialog.tsx` | Create — crop tool |
| `src/lib/image-optimizer.ts` | Create — server-side image processing |
| `migrations/xxx_homepage_media_versions.sql` | Create — version tracking, last_served_at |

---

## Implementation Priority & Timeline

| Priority | Phase | Estimated Effort | Dependencies |
|----------|-------|-----------------|--------------|
| **P0** | Phase 1 (DataMart Sync) | 3-4 days | None |
| **P0** | Phase 3 (Banners - mutual exclusivity fix) | 1-2 days | None |
| **P1** | Phase 4 (Service Toggle - confirmation + grace period) | 2-3 days | Phase 3 |
| **P1** | Phase 2 (Verification API Key) | 2-3 days | None |
| **P2** | Phase 3 (Banners - scheduling + preview) | 2-3 days | Phase 3 P0 |
| **P2** | Phase 5 (Header Icons + Media) | 4-5 days | None |
| **P3** | Phase 1 (Price alerts, stale detection) | 1-2 days | Phase 1 P0 |
| **P3** | Phase 5 (Image optimization, versioning) | 2-3 days | Phase 5 P2 |

## Cross-Cutting Concerns

### Error Handling Pattern

All new API endpoints should follow this pattern:
1. Validate input with Zod schemas (add to `src/lib/validation/`).
2. Check authentication/authorization first.
3. Use try/catch with specific error types from `src/lib/errors.ts`.
4. Return structured error responses: `{ success: false, error: string, code?: string }`.
5. Log errors with context using `src/lib/logger.ts`.

### Database Migration Pattern

- All new tables and columns require SQL migration files in `migrations/`.
- Include both UP and DOWN (rollback) SQL.
- Add a corresponding `run-xxx-migration.js` script for execution.
- Test migrations on a staging database before production.

### Testing Requirements

- Add integration tests for each new API endpoint in `__tests__/` or `src/app/api/.../test.ts`.
- Test error paths: missing auth, invalid input, concurrent operations.
- Test toggle state transitions: all combinations of enabled/disabled/coming-soon/maintenance.
- Test sync reliability: network failure mid-sync, concurrent sync attempts.
- Verify no regressions in existing `ServiceGuard`, `useServiceStatus`, and header filtering.
