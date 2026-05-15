# Critical OAuth and Netlify URL Fix - Immediate Action Required

## Current Issues
1. Google OAuth fails with `login?error=Failed%20to%20authenticate%20with%20Google`
2. App routes show Netlify preview URL instead of production domain

## Root Cause
The application is being accessed via Netlify preview URL (https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app) instead of production domain (https://topchart.store), causing OAuth redirect URI mismatches.

## Immediate Fixes Required

### 1. Set Netlify Environment Variables (CRITICAL)
Go to Netlify Dashboard → Site Settings → Environment Variables and set:

```
NEXT_PUBLIC_APP_URL=https://topchart.store
NEXTAUTH_URL=https://topchart.store
NEXT_PUBLIC_SITE_URL=https://topchart.store
```

**Important:** After setting these variables, trigger a new deployment.

### 2. Add Netlify Preview URL to Google Cloud Console (Temporary Fix)
Add these redirect URIs to your OAuth 2.0 Client ID:

```
https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app/api/auth/callback/google
https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app/api/auth/google/callback
https://topchart.store/api/auth/callback/google
https://topchart.store/api/auth/google/callback
https://www.topchart.store/api/auth/callback/google
https://www.topchart.store/api/auth/google/callback
```

Add these authorized JavaScript origins:

```
https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app
https://topchart.store
https://www.topchart.store
```

### 3. Code Fixes Applied
- Fixed all `window.location.origin` usages to use `getAppOrigin()`
- Fixed `getAppUrl()` to properly handle server-side rendering
- Fixed `getAppOrigin()` in google-oauth.ts to prioritize environment variables
- Fixed OAuth callback to use proper URL construction

### 4. Access the Correct URL
**IMPORTANT:** Access the application via the production domain:
```
https://topchart.store
```

NOT via the Netlify preview URL:
```
https://6a077c9dd4c6b984776c61ca--topchart-233.netlify.app
```

## Why This Happens
When you access the app via the Netlify preview URL:
1. The OAuth redirect URI uses the preview URL
2. Google Cloud Console doesn't recognize this URL
3. OAuth fails with redirect_uri_mismatch
4. All subsequent routes use the preview URL

## Testing After Fixes
1. Access https://topchart.store/login
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify redirect to /dashboard on topchart.store
5. Check that all links use topchart.store

## Production Deployment
Once ready for production:
1. Remove Netlify preview URLs from Google Cloud Console
2. Ensure only topchart.store URLs remain
3. Set custom domain in Netlify
4. Deploy to production
