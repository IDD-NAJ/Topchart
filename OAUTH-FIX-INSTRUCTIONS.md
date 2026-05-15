# Google OAuth Fix Instructions

## Issue
The site is showing Netlify preview URL (https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app) instead of production domain (https://topchart.store), causing Google OAuth to fail with "Failed to authenticate with Google" error.

## Root Cause
The `getAppOrigin()` function was prioritizing the `x-forwarded-host` header (which contains the Netlify preview URL) over the `NEXT_PUBLIC_APP_URL` environment variable.

## Fix Applied
Modified `src/lib/google-oauth.ts` to prioritize `NEXT_PUBLIC_APP_URL` environment variable over request headers. This ensures the production domain is always used for OAuth redirect URIs.

## Required Actions

### 1. Set Netlify Environment Variable
Go to Netlify Dashboard → Site Settings → Environment Variables and ensure:
```
NEXT_PUBLIC_APP_URL = https://topchart.store
```

### 2. Add Redirect URIs to Google Cloud Console
Add both URLs to your OAuth 2.0 Client ID authorized redirect URIs:

```
https://topchart.store/api/auth/google/callback
https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app/api/auth/google/callback
```

### 3. Redeploy
After setting the environment variable, trigger a new Netlify deployment.

### 4. Test
- Clear browser cache and cookies
- Test Google login on production domain
- Verify redirect URI matches https://topchart.store/api/auth/google/callback

## Verification
The fix ensures that even when accessed via Netlify preview URLs, the OAuth flow will use the production domain from `NEXT_PUBLIC_APP_URL`, preventing redirect URI mismatches.
