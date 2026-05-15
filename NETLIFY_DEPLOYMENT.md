# Netlify Deployment Setup

## Required Environment Variables

Configure these environment variables in Netlify Dashboard → Site Settings → Environment Variables.

### Database Configuration
- **DATABASE_URL** - PostgreSQL connection string (required)
  - Get from Neon dashboard at https://console.neon.tech
  - Or use Netlify's database integration
  - Format: `postgresql://username:password@hostname/database?sslmode=require`
- Alternative variables (fallbacks): `NEON_DATABASE_URL`, `NETLIFY_DATABASE_URL`

### API Keys
- **DATAMART_API_KEY** - DataMart API key for airtime/data purchases
- **NEXT_PUBLIC_DATAMART_API_KEY** - Public DataMart API key for delivery tracker widget
- **PVADEALS_API_KEY** - PVADeals API key for verification services
- **PVADEALS_BASE_URL** - PVADeals API base URL (default: https://prod-v3.pvadeals.com)
- **PAYSTACK_SECRET_KEY** - Paystack secret key for payment processing
- **TEXTVERIFIED_API_KEY** - Textverified API key for phone number verification
- **TEXTVERIFIED_API_URL** - Textverified API URL
- **TEXTVERIFIED_WEBHOOK_SECRET** - Webhook secret for signature verification

### Application Configuration
- **NEXT_PUBLIC_APP_URL** - Production URL (e.g., https://topchart-233.netlify.app)
- **NEXT_PUBLIC_USD_TO_GHS_RATE** - Exchange rate for pricing (default: 15.5)
- **SESSION_SECRET** - Random secret key for session security
- **CRON_SECRET** - Secret key for scheduled sync jobs authentication

### Optional Services
- **NEXT_PUBLIC_TAWK_PROPERTY_ID** - Tawk.to property ID for chat widget
- **NEXT_PUBLIC_TAWK_WIDGET_ID** - Tawk.to widget ID for chat widget
- **NEXT_PUBLIC_VERCEL_ANALYTICS_ID** - Vercel Analytics ID (optional)

### Pricing Configuration
- **PVADEALS_MARKUP_PERCENT** - Markup percentage on PVADeals prices (default: 40)
- **USD_TO_GHS_RATE** - USD to GHS exchange rate (default: 15.5)

## Build Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `.next`
- Node.js version: 20
- NPM flags: `--legacy-peer-deps`
- Next.js plugin: `@netlify/plugin-nextjs`

## Deployment Steps

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Select the master branch

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 20

3. **Set Environment Variables**
   - Add all required environment variables listed above
   - Ensure DATAMART_API_KEY is set to: `4c81615f9b90bd4e2884fa4a03dbcbc5109ed33e4d42b7378ef462f5ad5c3aa1`

4. **Deploy**
   - Trigger a new deployment
   - Monitor build logs for any errors

## Database Setup

### Option 1: Neon Database
1. Create a free account at https://console.neon.tech
2. Create a new PostgreSQL database
3. Copy the connection string
4. Set DATABASE_URL in Netlify environment variables

### Option 2: Netlify Database
1. Use Netlify's database integration
2. Connect to Neon or another provider
3. The connection string will be available as NETLIFY_DATABASE_URL

## Post-Deployment Steps

1. **Run Database Migrations**
   - Navigate to `/admin/data-bundles` in your deployed site
   - Click "Sync from DataMart" to run the migration
   - Or call `POST /api/admin/migrate-data-bundles` (admin only)

2. **Test Functionality**
   - Verify homepage loads correctly
   - Test user registration and login
   - Test airtime/data purchase flow
   - Verify admin panel works

## Troubleshooting

### Build Errors
- Check build logs in Netlify dashboard
- Ensure all environment variables are set
- Verify Node.js version compatibility (Node 20)

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if SSL is enabled in connection string
- Ensure database allows connections from Netlify's IP ranges

### Runtime Errors
- Check browser console for JavaScript errors
- Verify API keys are correct
- Check Netlify function logs
