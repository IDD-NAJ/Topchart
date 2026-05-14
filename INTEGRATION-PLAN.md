# Integration Plan: Google Auth, Tawk.to Chat & WhatsApp Channel

## Current State Assessment

| Component | Status | Gaps |
|-----------|--------|------|
| Google Auth | **Fully implemented** with PKCE, ID token validation, encrypted token storage, rate limiting | Needs CSP update for Google OAuth domains |
| Tawk.to Chat | **Partially implemented** — component exists, CSP configured, renders in layout | Console error suppression is hacky; no lazy loading; user attributes use wrong field names; no admin visibility toggle |
| WhatsApp | **Share links only** — `wa.me` used for referral sharing | No persistent WhatsApp channel link in footer/header; no floating WhatsApp FAB; no env-configured number |

---

## 1. Google Authentication

### 1.1 What's Already Implemented
- PKCE code challenge (S256) on `/api/auth/google` init route
- Cookie-based CSRF state verification on `/api/auth/google/callback`
- ID token validation: signature (Google JWKs), audience, issuer, expiry, nonce
- AES-256-GCM encryption for `access_token`, `refresh_token`, `id_token` in DB
- Rate limiting: 5 requests/minute on OAuth endpoints
- 15-second timeout on token exchange requests
- `allowDangerousEmailAccountLinking` removed from NextAuth config
- Single `GoogleAuthButton` component on login and register pages
- Unified env vars: `GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_ID`, `GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_SECRET`

### 1.2 Remaining Steps

**CSP Update** — Add Google OAuth domains to `connect-src` in `middleware.ts`:
- `https://accounts.google.com`
- `https://oauth2.googleapis.com`
- `https://www.googleapis.com`

**Google Cloud Console Configuration**:
1. Create OAuth 2.0 Client ID in Google Cloud Console
2. Add authorized redirect URI: `https://topchart.store/api/auth/google/callback`
3. Add authorized JavaScript origins: `https://topchart.store`
4. Enable Google+ API for the project
5. Set consent screen to "Production" (not "Testing") for live use

**Environment Variables** (production):
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `AUTH_SECRET` — random 32+ char string for token encryption

**DB Migration** — Ensure `accounts` table exists with columns:
- `id`, `user_id`, `type`, `provider`, `provider_account_id`
- `access_token`, `refresh_token`, `id_token` (will store encrypted values)
- `expires_at`, `token_type`, `scope`, `session_state`

**Security Monitoring**:
- Log all Google auth attempts (success/failure) with IP and user agent
- Alert on unusual patterns: multiple account creations from same IP, rapid OAuth init requests
- Monitor `google_oauth_state` cookie mismatches as potential CSRF attempts

---

## 2. Tawk.to Live Chat Widget

### 2.1 What's Already Implemented
- `TawkChat` component at `src/components/tawk-chat.tsx`
- Uses `@tawk.to/tawk-messenger-react` npm package
- Config via `NEXT_PUBLIC_TAWK_PROPERTY_ID` and `NEXT_PUBLIC_TAWK_WIDGET_ID`
- Hidden on admin routes
- Sets user name/email via `Tawk_API.setAttributes`
- CSP headers in `middleware.ts` already allow `*.tawk.to` domains
- Rendered in `src/app/layout.tsx` root layout

### 2.2 Issues to Fix

**Console Error Suppression** — Current approach overrides `console.error` and `window.onerror` globally. This is fragile and hides legitimate errors. Replace with:
- Use the `onLoad` callback to detect when Tawk is ready
- Wrap `setAttributes` in a proper retry with max attempts (not infinite)
- Remove global error handler overrides entirely

**User Attribute Field Names** — Current code references `user.firstName` and `user.lastName` but the `User` type uses `first_name` and `last_name` (snake_case). Fix the attribute mapping to use correct field names.

**Lazy Loading** — The Tawk component loads immediately on mount. Switch to `next/dynamic` with `ssr: false` and `lazy` loading so it Last Namesn't block initial page render or affect Lighthouse scores.

**Widget Visibility Toggle** — Add a `NEXT_PUBLIC_TAWK_ENABLED` env var (default `"true"`) so chat can be disabled without code changes. Useful during maintenance or if Tawk has outages.

**Mobile Responsiveness** — Verify the Tawk widget Last Namesn't overlap the mobile bottom navigation (`MobileBottomNav`). If it Last Names, adjust Tawk's bottom offset via `Tawk_API.customStyle` or position offset.

### 2.3 Integration Steps

1. **Environment Setup**:
   - Set `NEXT_PUBLIC_TAWK_PROPERTY_ID` to the Tawk.to Property ID from the dashboard
   - Set `NEXT_PUBLIC_TAWK_WIDGET_ID` to the Widget ID from the dashboard
   - Add `NEXT_PUBLIC_TAWK_ENABLED=true` as a feature toggle

2. **Component Refactor**:
   - Replace `@tawk.to/tawk-messenger-react` with `next/dynamic` import (`ssr: false`)
   - Remove global `console.error` / `window.onerror` overrides
   - Fix user attribute field names (`first_name` / `last_name`)
   - Add max retry count (3 attempts) for `setAttributes` instead of infinite loop
   - Add visibility check: only render when `NEXT_PUBLIC_TAWK_ENABLED !== "false"`

3. **CSP Headers** — Already configured in `middleware.ts`. No changes needed for:
   - `connect-src`: `https://*.tawk.to`
   - `script-src`: `https://*.tawk.to`
   - `frame-src`: `https://*.tawk.to`
   - `img-src`: `https://*.tawk.to`

4. **Layout Integration** — Already in `src/app/layout.tsx` inside `<AuthProvider>`. This is correct because it needs access to `user` context for attribute setting.

5. **Performance Considerations**:
   - Load Tawk widget with `strategy="lazyOnload"` equivalent (dynamic import with no SSR)
   - Do not block page hydration on Tawk initialization
   - Ensure Tawk script Last Namesn't add to First Input Delay (FID)

---

## 3. WhatsApp Channel Integration

### 3.1 Current State
- WhatsApp is only used for referral sharing via `wa.me` deep links
- No persistent WhatsApp contact channel on the website
- No floating action button (FAB) for WhatsApp support
- No WhatsApp link in footer or header

### 3.2 Integration Strategy

**Three-Point WhatsApp Presence**:

1. **Floating WhatsApp FAB** (bottom-left corner, desktop and mobile)
   - Fixed position floating button with WhatsApp icon
   - Opens WhatsApp chat with pre-filled greeting message
   - URL format: `https://wa.me/{PHONE_NUMBER}?text={ENCODED_GREETING}`
   - Hide on admin routes (same pattern as Tawk chat)
   - Position: bottom-left to avoid conflict with Tawk (bottom-right)
   - Show only when Tawk is offline or as an alternative contact method
   - Responsive: smaller on mobile, with tooltip on desktop hover

2. **Footer WhatsApp Link**
   - Add WhatsApp to the social links section in `Footer` component
   - Use `MessageCircle` icon from Lucide (already imported)
   - Link to `https://wa.me/{PHONE_NUMBER}`
   - Include in the social icons row alongside Twitter and LinkedIn

3. **Contact Section in Footer**
   - Add WhatsApp number to the `contactInfo` array
   - Display as a clickable link: `https://wa.me/{PHONE_NUMBER}`
   - Label: "WhatsApp Support"

**Environment Configuration**:
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — Business WhatsApp number in international format (e.g., `233201234567`, no `+` prefix)
- `NEXT_PUBLIC_WHATSAPP_ENABLED` — Feature toggle (default `"true"`)

**WhatsApp FAB Component** — New component `src/components/whatsapp-fab.tsx`:
- Client component with `"use client"` directive
- Renders a fixed-position green circular button with WhatsApp SVG icon
- On click: opens `https://wa.me/{PHONE}?text={GREETING}` in new tab
- Greeting message: "Hi Topchart! I need help with..." (URL-encoded)
- Uses `usePathname()` to hide on admin routes
- Uses `useAuth()` to optionally customize greeting with user name
- Smooth entrance animation (fade-in after 2s delay to avoid layout shift)
- Accessible: `aria-label="Chat on WhatsApp"`, keyboard focusable

**Security & Privacy**:
- WhatsApp number is public-facing (no sensitive data exposed)
- The `wa.me` link opens in a new tab with `rel="noopener noreferrer"`
- No WhatsApp API credentials stored server-side (uses deep links only)
- No user data sent to WhatsApp without explicit user action (click)

**Responsive Design**:
- Desktop: 56px FAB with tooltip on hover, bottom-left 24px from edges
- Mobile: 48px FAB, positioned above `MobileBottomNav` to avoid overlap
- Z-index: below modals (z-50), above content (z-40), below Tawk widget
- Hide on small screens when Tawk chat is open (check `Tawk_API.isChatMaximized()`)

### 3.3 Implementation Steps

1. Add `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_WHATSAPP_ENABLED` to env schema in `src/lib/env.ts`
2. Create `src/components/whatsapp-fab.tsx` component
3. Add WhatsApp FAB to `src/app/layout.tsx` (inside `<AuthProvider>`)
4. Add WhatsApp social link to `src/components/footer.tsx` social icons array
5. Add WhatsApp to footer contact info
6. Verify no overlap with Tawk widget and mobile bottom nav
7. Test on mobile: ensure FAB Last Namesn't interfere with scrolling or bottom nav

---

## 4. Cross-Cutting Concerns

### 4.1 CSP Header Updates (middleware.ts)

Add to `connect-src`:
- `https://accounts.google.com`
- `https://oauth2.googleapis.com`
- `https://www.googleapis.com`

Add to `script-src`:
- `https://accounts.google.com` (for Google One Tap, if added later)

No changes needed for WhatsApp (uses `wa.me` deep links, no scripts).

### 4.2 Feature Flags

All three integrations should be toggleable via environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `GOOGLE_CLIENT_ID` | (empty) | Google Auth enabled when set |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | (empty) | Tawk chat enabled when set |
| `NEXT_PUBLIC_TAWK_ENABLED` | `true` | Tawk feature toggle |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | (empty) | WhatsApp FAB enabled when set |
| `NEXT_PUBLIC_WHATSAPP_ENABLED` | `true` | WhatsApp feature toggle |

### 4.3 Performance Budget

| Component | Impact | Mitigation |
|-----------|--------|------------|
| Google Auth | Zero (server-side only, no client JS) | N/A |
| Tawk.to | ~200KB JS, ~100ms FID | Dynamic import, lazy load, no SSR |
| WhatsApp FAB | ~2KB (SVG icon only) | Negligible |

### 4.4 Mobile Responsiveness

- Tawk widget: bottom-right (default Tawk position)
- WhatsApp FAB: bottom-left, above mobile bottom nav
- Google Auth button: full-width in auth forms (already implemented)
- All three components must not overlap each other or the `MobileBottomNav`

### 4.5 Security Summary

| Threat | Mitigation |
|--------|------------|
| OAuth CSRF | PKCE + cookie-verified state parameter |
| Token theft | AES-256-GCM encryption at rest |
| Account takeover | Removed auto-linking; explicit account verification |
| OAuth abuse | 5 req/min rate limit per IP |
| Token interception | HTTPS only, `secure` cookies in production |
| XSS via Tawk | CSP restricts Tawk script sources |
| WhatsApp spam | Deep link only, no API integration, user-initiated |
