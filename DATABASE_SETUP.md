# Database Setup Instructions

## Quick Setup Guide

### 1. Get Neon Database Connection
1. Visit [Neon Dashboard](https://console.neon.tech)
2. Create a new project or select existing one
3. Copy the connection string from the dashboard
4. Format should be: `postgresql://username:password@hostname/database?sslmode=require`

### 2. Configure Environment Variables

#### Option A: Copy Example File
```bash
cp .env.example .env.local
```

#### Option B: Create New File
Create `.env.local` file in project root with your credentials:

```bash
# Database Connection
DATABASE_URL=your-neon-connection-string-here

# Session Security
SESSION_SECRET=generate-random-secret-here

# Payment Processing
PAYSTACK_SECRET_KEY=your-paystack-secret-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Generate Session Secret
```bash
# Generate secure random secret
openssl rand -base64 32
```

### 4. Paystack API Keys
- **Test Mode**: `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Live Mode**: `sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Get keys from [Paystack Dashboard](https://dashboard.paystack.co/)

### 5. Start Development
```bash
npm run dev
```

### 6. Verify Setup
- [ ] Development server starts without database errors
- [ ] Login page loads at http://localhost:3000/login
- [ ] Registration works
- [ ] Dashboard accessible after login
- [ ] Admin panel loads at http://localhost:3000/admin

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Session encryption key | ✅ |
| `PAYSTACK_SECRET_KEY` | Paystack API secret | ✅ |
| `NEXT_PUBLIC_APP_URL` | Application URL | ✅ |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel analytics | ❌ |

### Troubleshooting

#### Database Connection Errors
```
Error: Database not configured
```
**Solution**: Check `DATABASE_URL` format and Neon dashboard

#### Paystack Errors
```
Error: PAYSTACK_SECRET_KEY environment variable is not set
```
**Solution**: Add Paystack secret key to `.env.local`

#### Session Errors
```
Error: Invalid session token
```
**Solution**: Clear browser cookies and restart server

### Security Notes
- **Never commit** `.env.local` to version control
- **Use different keys** for development and production
- **Rotate secrets** regularly in production
- **Use HTTPS** in production environment

### Production Deployment
For production deployment:
1. Use **live** Paystack API key
2. Set **HTTPS** URL in `NEXT_PUBLIC_APP_URL`
3. Use **strong** session secret
4. Configure **environment variables** in hosting platform
