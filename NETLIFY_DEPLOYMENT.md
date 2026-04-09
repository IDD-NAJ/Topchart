# Netlify Deployment Setup

## 1) Connect repository
- In Netlify, create a new site from your Git provider and select this repository.
- Netlify will detect `netlify.toml` automatically.

## 2) Build settings
- Build command: `npm run build`
- Node version: `20` (already set in `netlify.toml`)
- Next.js runtime: `@netlify/plugin-nextjs` (already configured)

## 3) Required environment variables
Set these in Netlify Site Settings -> Environment variables:

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (Neon, Supabase, or other)
- `NEON_DATABASE_URL` - Alternative Neon database URL
- `NETLIFY_DATABASE_URL` - Netlify database integration URL
- `NEXT_PUBLIC_DATABASE_URL` - Public database URL (if needed)

### Payment Processing
- `PAYSTACK_SECRET_KEY` - Paystack secret key (use test key for development, live key for production)

### Application Configuration
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-site.netlify.app`)
- `NEXT_PUBLIC_USD_TO_GHS_RATE` - Exchange rate for USD to GHS conversion (default: 15.5)

### Session Security
- `SESSION_SECRET` - Random secret key for session encryption (generate a secure random string)

### Chat Integration
- `NEXT_PUBLIC_TAWK_PROPERTY_ID` - Tawk.to property ID for live chat
- `NEXT_PUBLIC_TAWK_WIDGET_ID` - Tawk.to widget ID

### Verification Services
- `PVADEALS_API_KEY` - PVADeals API key for phone verification services
- `TEXTVERIFIED_API_KEY` - Textverified API key
- `TEXTVERIFIED_API_URL` - Textverified API URL (default: https://api.textverified.com)
- `TEXTVERIFIED_WEBHOOK_SECRET` - Webhook secret for signature verification

### Optional Analytics
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Vercel analytics ID (if using Vercel Analytics)

## 4) First deploy checklist
- Trigger deploy from Netlify.
- Confirm server routes respond:
  - `/api/auth/me`
  - `/api/reseller/dashboard`
  - `/api/payments/verify`
  - `/api/wallet`
- Confirm callback-sensitive flows use production URL:
  - Paystack callback should return to your Netlify domain
  - Verify payment webhooks are configured in Paystack dashboard

## 5) Important notes
- Do not commit `.env.local` to version control
- Keep `NEXT_PUBLIC_APP_URL` in Netlify aligned with your active production domain
- If you switch to a custom domain, update `NEXT_PUBLIC_APP_URL` and redeploy
- Use `--legacy-peer-deps` flag for npm install (already configured in netlify.toml)
- The `@netlify/plugin-nextjs` plugin handles Next.js-specific optimizations automatically

## 6) Database setup
- Create a PostgreSQL database on Neon or Supabase
- Run database migrations if needed (see migration scripts in `src/scripts/`)
- Ensure database connection string is set in environment variables
- Test database connection before deploying to production
