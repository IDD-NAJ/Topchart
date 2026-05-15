# Google OAuth Setup Guide

## Error: redirect_uri_mismatch

If you encounter this error on your production domain, follow these steps to fix it.

## Step 1: Get Your Production Domain

Determine your actual production domain:
- If using Netlify: Check your Netlify site URL (e.g., `https://your-site.netlify.app`)
- If using Vercel: Check your Vercel project URL (e.g., `https://your-project.vercel.app`)
- If using custom domain: Your custom domain (e.g., `https://topchart.store`)

## Step 2: Configure Environment Variable

Add or update `NEXT_PUBLIC_APP_URL` in your hosting platform:

### Netlify
1. Go to Site Settings → Environment Variables
2. Add variable: `NEXT_PUBLIC_APP_URL`
3. Value: Your production domain (e.g., `https://topchart.store`)
4. Save and redeploy

### Vercel
1. Go to Project Settings → Environment Variables
2. Add variable: `NEXT_PUBLIC_APP_URL`
3. Value: Your production domain (e.g., `https://topchart.store`)
4. Save and redeploy

### Other Hosting
Add to your production environment variables:
```
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Step 3: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: APIs & Services → Credentials
4. Find your OAuth 2.0 Client ID (the one matching `AUTH_GOOGLE_ID`)
5. Click the edit (pencil) icon
6. Scroll to "Authorized redirect URIs"
7. Add your production redirect URI: `https://your-production-domain.com/api/auth/google/callback`
8. Save changes

**Important Notes:**
- Use https, not http for production
- No trailing slash at the end
- Must match exactly: `{NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
- Keep localhost URI for local development

## Step 4: Verify Configuration

After making changes:
1. Redeploy your application
2. Test Google OAuth login on production
3. Check browser console for redirect URI logs (if in development mode)
4. Ensure no redirect_uri_mismatch error occurs

## Common Issues

### Issue: Still getting redirect_uri_mismatch
**Solution:**
- Clear browser cache and cookies
- Wait 5-10 minutes for Google Cloud Console changes to propagate
- Double-check for typos in the redirect URI
- Ensure protocol matches (https vs http)

### Issue: Redirect URI has wrong domain
**Solution:**
- Check if CDN/proxy is modifying the domain
- Verify `x-forwarded-host` header is correct
- Check if `NEXT_PUBLIC_APP_URL` is actually being used in production

### Issue: Works on localhost but not production
**Solution:**
- Ensure production redirect URI is added to Google Cloud Console
- Verify `NEXT_PUBLIC_APP_URL` is set in production environment
- Check that the domain matches exactly (www vs non-www)

## Expected Configuration

**Local Development:**
- Environment: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Google Console URI: `http://localhost:3000/api/auth/google/callback`

**Production (example):**
- Environment: `NEXT_PUBLIC_APP_URL=https://topchart.store`
- Google Console URI: `https://topchart.store/api/auth/google/callback`
