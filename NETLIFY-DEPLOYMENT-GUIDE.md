# Topchart.store Netlify Deployment Guide
**Date:** January 2025  
**Framework:** Next.js 16 (App Router)  
**Platform:** Netlify

---

## Current Netlify Configuration

The project already has a complete `netlify.toml` configuration file with:
- Next.js build settings
- Environment variables
- Security headers
- Caching headers
- Plugin configuration

---

## Pre-Deployment Checklist

### 1. Environment Variables Required

Set these in Netlify Site Settings > Environment Variables:

**Required:**
- `NEXT_PUBLIC_APP_URL` - Set to `https://topchart.store` (production URL)
- `DATABASE_URL` - PostgreSQL/Neon database connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Set to `https://topchart.store`

**Optional (if applicable):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `NEXT_PUBLIC_WHATSAPP_NUMBER` - WhatsApp contact number

### 2. Build Configuration

The current `netlify.toml` configuration:
```toml
[build]
  command = "rm -rf .next && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
  NEXT_TELEMETRY_DISABLED = "1"
  NETLIFY_NEXT_PLUGIN_SKIP = "false"
  NEXT_PUBLIC_APP_URL = "https://topchart.store"
```

### 3. Security Headers

Already configured in `netlify.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=()
- X-XSS-Protection: 1; mode=block

### 4. Caching Headers

Already configured for:
- Static assets: 1 year cache
- Images: 1 year cache
- Videos: 1 year cache

---

## Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Select GitHub repository
   - Configure build settings (already in netlify.toml)
   - Deploy

### Method 2: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize project**
   ```bash
   netlify init
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

---

## Post-Deployment Configuration

### 1. Domain Configuration

**Custom Domain:**
- Go to Site Settings > Domain management
- Add custom domain: `topchart.store`
- Configure DNS records (A or CNAME)

**DNS Records:**
```
Type: A
Name: @
Value: 75.2.70.75 (or your Netlify assigned IP)

Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

### 2. SSL/HTTPS

Netlify automatically provides SSL certificates for:
- All Netlify subdomains
- Custom domains (via Let's Encrypt)

### 3. Environment Variables Setup

Go to Site Settings > Environment Variables:

**Production Variables:**
```
NEXT_PUBLIC_APP_URL = https://topchart.store
DATABASE_URL = your-database-url
NEXTAUTH_SECRET = generate-with-openssl-rand-base64-32
NEXTAUTH_URL = https://topchart.store
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

### 4. Database Connection

If using Neon/Supabase:
- Ensure database allows connections from Netlify
- Check connection pool settings
- Verify connection string format

### 5. Payment Integration

If using Paystack:
- Add Paystack keys to environment variables
- Set webhook URL in Paystack dashboard
- Configure allowed domains in Paystack

---

## SEO Verification After Deployment

### Google Search Console

1. **Submit sitemap**
   - Go to https://search.google.com/search-console
   - Add property: https://topchart.store
   - Verify ownership (google860c28ee3c4b1e50.html already in public/)
   - Submit sitemap: https://topchart.store/sitemap.xml

2. **Request indexing**
   - Request indexing for high-priority pages:
     - Homepage
     - /cheap-mtn-data-ghana
     - /dstv-subscription-ghana
     - /buy-verification-numbers-ghana
     - /data-reseller-ghana
     - /cheap-data-accra
     - /cheap-data-kumasi

### Bing Webmaster Tools

1. **Add site**
   - Go to https://www.bing.com/webmasters
   - Add site: https://topchart.store
   - Verify with meta tag (already in layout.tsx)
   - Submit sitemap

---

## Performance Optimization

### Netlify Optimizations Already Configured

1. **Next.js Plugin**
   - Automatic optimization of Next.js app
   - Edge functions support
   - Image optimization

2. **Caching**
   - Static assets cached for 1 year
   - Images cached for 1 year
   - Next.js static chunks cached

3. **Build Optimization**
   - Production build only
   - Source maps disabled in production
   - Compression enabled

### Additional Optimizations

1. **Enable Netlify Edge Functions** (if needed)
   ```toml
   [[edge_functions]]
     function = "function-name"
     path = "/api/*"
   ```

2. **Configure Netlify Forms** (if needed)
   ```html
   <form name="contact" method="POST" data-netlify="true">
     <!-- form fields -->
   </form>
   ```

3. **Enable Netlify Functions** (if needed)
   Create functions in `netlify/functions/` directory

---

## Monitoring & Debugging

### Netlify Dashboard

1. **Deploy Logs**
   - Site Settings > Builds > Deploy logs
   - Check for build errors
   - Review build duration

2. **Functions Logs**
   - Functions > Functions logs
   - Monitor edge function performance

3. **Analytics**
   - Site Analytics
   - Bandwidth usage
   - Visitor analytics

### Error Handling

1. **Build Failures**
   - Check build logs
   - Verify environment variables
   - Review dependencies

2. **Runtime Errors**
   - Check Netlify Functions logs
   - Review browser console
   - Check Network tab

3. **Database Issues**
   - Verify connection string
   - Check database logs
   - Test connection from Netlify

---

## Rollback Plan

### If Deployment Fails

1. **Rollback to Previous Deploy**
   - Go to Deploys in Netlify dashboard
   - Click on previous successful deploy
   - Click "Publish deploy"

2. **Local Testing**
   ```bash
   npm run build
   npm run start
   ```
   Test locally before deploying

3. **Fix Issues**
   - Update code
   - Test locally
   - Deploy again

---

## Deployment Checklist

### Before Deploy
- [ ] All environment variables documented
- [ ] Database connection tested
- [ ] Build runs successfully locally
- [ ] No console errors in production build
- [ ] SEO verification files in place
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt

### After Deploy
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Forms working (if any)
- [ ] Database connections working
- [ ] Payment integration working (if applicable)
- [ ] SSL certificate active
- [ ] Custom domain pointing correctly
- [ ] Sitemap submitted to GSC
- [ ] Site verified in Bing Webmaster

### SEO Verification
- [ ] Google verification file accessible
- [ ] Sitemap submitted to Google Search Console
- [ ] Site verified in Bing Webmaster Tools
- [ ] Robots.txt accessible
- [ ] Canonical URLs working
- [ ] Schema markup valid (test with Rich Results Test)

---

## Troubleshooting

### Common Issues

**Build Fails:**
- Check Node version (should be 20)
- Verify dependencies installed
- Check build logs for specific errors

**Environment Variables Not Working:**
- Ensure variables set in Netlify dashboard
- Redeploy after adding variables
- Check variable names match exactly

**Database Connection Issues:**
- Verify connection string format
- Check database allows Netlify IP
- Test connection string locally

**SEO Verification Fails:**
- Ensure verification file in public/ directory
- Check file is accessible at URL
- Wait a few minutes for DNS propagation

---

## Support Resources

- Netlify Docs: https://docs.netlify.com
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters

---

**Guide Created:** January 2025  
**Configuration Status:** Complete  
**Ready for Deployment:** ✓
