# Google OAuth Login Fix Guide

## Issue
Google OAuth login is failing on mobile with error: `Failed to authenticate with Google`

## Root Cause
The Google OAuth redirect URIs are not configured correctly in Google Cloud Console.

## Solution

### Step 1: Configure Environment Variables

Add these to your `.env.local` file:

```env
AUTH_GOOGLE_ID=134593970079-t68868p7lq6vdn66tf9ok5hi0364fc03.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_SECRET=your-random-secret-key
NEXT_PUBLIC_APP_URL=https://topchart.store
```

**Get your Google Client Secret:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Find your OAuth 2.0 Client ID
5. Click to view details and copy the Client Secret

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
# Or use any random string of at least 32 characters
```

### Step 2: Configure Redirect URIs in Google Cloud Console

Add these Authorized Redirect URIs in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:

```
https://topchart.store/api/auth/callback/google
https://topchart.store/api/auth/google/callback
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/google/callback
```

6. Save the configuration

### Step 3: Verify NEXT_PUBLIC_APP_URL

Ensure `NEXT_PUBLIC_APP_URL` is set correctly:
- **Production:** `https://topchart.store`
- **Development:** `http://localhost:3000`

### Step 4: Restart Development Server

After updating environment variables, restart your dev server:

```bash
npm run dev
```

### Step 5: Test Google Login

1. Clear browser cookies for topchart.store
2. Try logging in with Google
3. Check that the redirect works correctly

## Mobile-Specific Issues

If the issue persists on mobile:

1. **Check Mobile Browser Compatibility:**
   - The OAuth flow should work on all modern mobile browsers
   - Ensure cookies are enabled in mobile browser

2. **Verify HTTPS:**
   - Google OAuth requires HTTPS in production
   - Ensure your site has valid SSL certificate

3. **Test on Different Mobile Browsers:**
   - Chrome Mobile
   - Safari Mobile (iOS)
   - Firefox Mobile

## Troubleshooting

### Error: "redirect_uri_mismatch"
- The redirect URI in Google Cloud Console doesn't match
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check that the callback URL matches exactly (no trailing slashes)

### Error: "unauthorized_client"
- The Client ID is incorrect or revoked
- Verify AUTH_GOOGLE_ID matches Google Cloud Console

### Error: "access_denied"
- User denied permission
- Check Google Cloud Console consent screen configuration

### Error: "Failed to authenticate with Google"
- AUTH_GOOGLE_SECRET is missing or incorrect
- AUTH_SECRET is missing
- Redirect URI is not configured

## Current OAuth Implementation

The application uses two OAuth implementations:
1. **NextAuth** (`src/lib/auth.config.ts`) - Main authentication
2. **Custom Google OAuth** (`src/lib/google-oauth.ts`) - Fallback/custom implementation

Both require the same environment variables and redirect URIs.
