# Netlify Deployment Guide

## Prerequisites

- Node.js 20+ (specified in `netlify.toml`)
- Netlify account
- Neon PostgreSQL database
- Paystack account for payments

## Environment Variables

Configure these in your Netlify dashboard under Site settings > Environment variables:

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Random secret for sessions | `your-random-secret-key` |
| `PAYSTACK_SECRET_KEY` | Paystack API key | `sk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Your deployed site URL | `https://topchart.netlify.app` |

### Optional
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID |

## Deployment Steps

1. **Connect to Netlify**
   - Push code to GitHub
   - Connect repo in Netlify dashboard
   - Build command: `npm run build`
   - Publish directory: `dist` (or `.next` if using SSR)

2. **Configure Environment Variables**
   - Add all required variables in Netlify dashboard
   - Ensure `NODE_VERSION` is set to `20`

3. **Database Setup**
   - Create Neon PostgreSQL database
   - Run migration scripts in `src/scripts/`
   - Update `DATABASE_URL` with connection string

4. **Paystack Configuration**
   - Get test/live keys from Paystack dashboard
   - Add webhook URL: `https://your-site.netlify.app/api/payments/webhook`

## Build Configuration

The `netlify.toml` includes:
- Node.js 20 runtime
- `@netlify/plugin-nextjs` for Next.js 16 support
- SPA redirect rules
- Security headers
- Static asset caching

## Troubleshooting

**Build fails?**
- Check `NODE_VERSION` is set to 20
- Verify all env vars are configured
- Check database is accessible from Netlify

**Images not loading?**
- `images.unoptimized: true` is set in `next.config.ts`
- Ensure images are in `/public` folder

**API routes 404?**
- API routes require SSR (remove `output: 'export'` for full SSR)
- Or use Netlify Functions with `@netlify/plugin-nextjs`
