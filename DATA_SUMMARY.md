# Topchart Guest Checkout - Data Summary

## Database Overview
All data is stored in PostgreSQL (Neon) with real-time access via multiple APIs.

**Database Connection:** `postgresql://authenticator:npg_y9jdOAHcW6BP@ep-divine-frog-ahe05se1-pooler.c-3.us-east-1.aws.neon.tech/neondb`

---

## Current Data Status

### Guest Orders
- **Total Orders:** 1
- **Total Revenue:** GH₵2.99
- **Pending Orders:** 1
- **Completed Orders:** 0
- **Payment Success Rate:** 0%

### Order Breakdown
| Product Type | Count | Revenue | Avg Value |
|---|---|---|---|
| Data Bundle | 1 | GH₵2.99 | GH₵2.99 |
| Bill Payment | 0 | - | - |
| Foreign Number | 0 | - | - |

### Payment Status
| Status | Count | Revenue |
|---|---|---|
| Pending | 1 | GH₵2.99 |
| Paid | 0 | - |
| Failed | 0 | - |

### Fulfillment Status
| Status | Count |
|---|---|
| Pending | 1 |
| Processing | 0 |
| Completed | 0 |
| Failed | 0 |

### Customer Data
| Email | Name | Orders | Total Spent |
|---|---|---|---|
| john@example.com | John Doe | 1 | GH₵2.99 |

---

## Recent Orders

### Order #1: TCG-20260720-EQHM
- **Customer:** John Doe (john@example.com)
- **Product:** Data Bundle - 1 GB
- **Network:** MTN
- **Phone:** 0241234567
- **Amount:** GH₵2.99
- **Payment Status:** Pending
- **Fulfillment:** Pending
- **Created:** 2026-07-20 14:41:46 UTC

---

## Database Tables (28 total)

### Core Transactional Tables
1. **guest_orders** - Guest checkout orders (1 record)
2. **data_bundle_purchases** - Data bundle transactions (0 records)
3. **bill_transactions** - Bill payment transactions (0 records)
4. **esim_orders** - eSIM orders (0 records)
5. **giftcard_orders** - Gift card orders (0 records)
6. **proxy_orders** - Proxy service orders (0 records)

### User & Account Tables
7. **user_profiles** - User account information (0 records)
8. **admin_users** - Administrator accounts
9. **auth_sessions** - Session management

### Payment & Financial Tables
10. **payment_intents** - Payment initialization records
11. **payment_events** - Payment webhooks and events
12. **ledger_accounts** - User ledger/wallet accounts
13. **ledger_entries** - Financial transactions

### Data Reference Tables
14. **networks** - Network providers (MTN, Telecel, AirtelTigo) - Empty
15. **esim_phone_plans** - eSIM plan catalog

### Customer & Referral Tables
16. **kyc_documents** - KYC document uploads
17. **kyc_profiles** - KYC verification profiles
18. **kyc_reviews** - KYC review records
19. **referrals** - Referral program users
20. **referral_visits** - Referral tracking
21. **referral_rewards** - Referral rewards issued

### Marketing Tables
22. **promo_codes** - Promotional codes
23. **promo_redemptions** - Promo code redemptions

### Support & Logging Tables
24. **tickets** (implied) - Customer support tickets
25. **ticket_messages** - Ticket messages
26. **action_logs** - System action audit logs
27. **disputes** - Customer disputes

### Admin/Config Tables
28. **permissions** - Role permissions
29. **roles** - User roles

---

## API Endpoints for Data Access

### Analytics API
**GET** `/api/analytics/guest-orders`
```json
Response includes:
- summary: Overall metrics (total orders, revenue, pending count, etc.)
- breakdown: Payment/fulfillment/product type breakdowns
- topCustomers: Top 10 customers by order count
- recentOrders: Last 10 orders
```

### Guest Order Lookup
**GET** `/api/track/search?tracking=TCG-20260720-EQHM`
```json
Returns:
- Order tracking details
- Customer info (email masked)
- Product details
- Payment and fulfillment status
```

### Guest Orders Admin API (Auth Required)
**GET** `/api/admin/guest-orders?stats=1`
```json
Returns:
- Total orders
- Pending/successful/failed counts
- Revenue metrics
- Today's performance
```

**GET** `/api/admin/guest-orders?page=1&limit=20`
```json
Returns paginated list with filtering:
- payment_status filter
- fulfillment_status filter
- product_type filter
- search by email/name/tracking number
```

---

## Database Schema

### guest_orders Table
```sql
CREATE TABLE guest_orders (
  id UUID PRIMARY KEY,
  tracking_number VARCHAR(50) UNIQUE NOT NULL,
  paystack_reference VARCHAR(100),
  paystack_webhook_data JSONB,
  
  -- Customer Info
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Product Info
  product_type VARCHAR(50) NOT NULL, -- data_bundle, bill_payment, foreign_number
  product_details JSONB NOT NULL,
  amount_ghs NUMERIC(10,2) NOT NULL,
  
  -- Status
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
  fulfillment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  
  -- DataMart Integration
  datamart_order_reference VARCHAR(100),
  datamart_purchase_id VARCHAR(100),
  datamart_order_status VARCHAR(50),
  
  -- Admin
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Product Details Structure
```json
{
  "data_bundle": {
    "network": "MTN",
    "network_name": "MTN",
    "phone_number": "0241234567",
    "capacity": "1",
    "size": "1 GB",
    "validity": "30 Days"
  },
  "bill_payment": {
    "bill_type": "ECG",
    "account_number": "123456",
    "amount": 100.00
  },
  "foreign_number": {
    "country": "US",
    "plan": "SMS + Voice"
  }
}
```

---

## Real Data Integration

### Data Query Functions
Located in `src/lib/db-queries.ts`:
- `getGuestOrdersStats()` - Summary statistics
- `getGuestOrders(limit, offset, filters)` - Paginated list with filtering
- `getGuestOrderByTracking(trackingNumber)` - Individual order lookup
- `getRevenueMetrics()` - 30-day revenue breakdown
- `getProductTypeBreakdown()` - Sales by product type

### Sample Data for Demo
The checkout page uses sample data when DataMart API is unavailable:
```typescript
const samplePlans = {
  MTN: [
    { id: "mtn-1gb", datamartPlanId: "1", name: "1 GB", price: 2.99, validityDays: 30 },
    { id: "mtn-2gb", datamartPlanId: "2", name: "2 GB", price: 5.49, validityDays: 30 },
    // ...
  ]
}
```

---

## How to Query the Database

### Using Neon Tools
```bash
npx neon sql "SELECT * FROM guest_orders LIMIT 10"
```

### Using the Analytics API
```bash
curl https://app.topchart.com/api/analytics/guest-orders
```

### Direct Connection (Development)
```typescript
import { sql } from "@/lib/db";
const orders = await sql`SELECT * FROM guest_orders LIMIT 10`;
```

---

## Revenue Analytics

### Current Metrics
- **All-Time Revenue:** GH₵2.99
- **Average Order Value:** GH₵2.99
- **Today's Revenue:** GH₵2.99
- **Today's Orders:** 1

### Product Revenue
- Data Bundle: 100% of revenue (GH₵2.99)

### Payment Conversion
- Pending: 100% (1 order)
- Success: 0%
- Failed: 0%

---

## Next Steps

1. **Increase Traffic:** More orders will populate the database
2. **Monitor Conversion:** Track payment success rate via analytics API
3. **Analyze Performance:** Use breakdown by product/customer to optimize offerings
4. **Scale Infrastructure:** Database can handle millions of records

---

Generated: 2026-07-20 15:02:41 UTC
Database Status: Connected ✓
Real-Time Data: Enabled ✓
