# Fix CSP Violation Error

## Error: "Found 127.0.0.1 in client bundle"

This error occurs when `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` in your Netlify environment variables, which gets bundled into the client-side JavaScript and causes CSP violations.

## Solution

### Step 1: Check Netlify Environment Variables

1. Go to your Netlify dashboard
2. Navigate to: Site Settings → Environment variables
3. Find `NEXT_PUBLIC_APP_URL`
4. If it's set to `http://localhost:3000`, change it to `https://topchart.store`

### Step 2: If variable doesn't exist

1. Go to: Site Settings → Environment variables → Add variable
2. Key: `NEXT_PUBLIC_APP_URL`
3. Value: `https://topchart.store`
4. Save changes

### Step 3: Redeploy

1. Trigger a new deployment in Netlify
2. The build should now pass without the CSP violation error

## Why This Happens

`NEXT_PUBLIC_` prefixed environment variables are bundled into the client-side JavaScript. If `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`, the literal string "localhost:3000" gets included in the client bundle, which Netlify's build process detects as a security issue.

## Verification

After deployment, check that:
- Build completes successfully
- No CSP violation errors appear
- Google OAuth works correctly on production domain
