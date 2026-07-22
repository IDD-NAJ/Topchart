# Admin Dashboard Pages - Complete Index

## Quick Navigation

### 📊 Analytics & Business Intelligence
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| Dashboard | `/admin` | Multiple | ✅ Active |
| Analytics | `/admin/analytics` | transactions, orders, users | ✅ Active |
| Billing & Revenue | `/admin/billing` | bill_transactions, transactions | ✅ Active |

---

### 👥 User Management
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| Users | `/admin/users` | users, user_profiles | ✅ Active |
| User Profiles | `/admin/admin/users` | user_profiles, kyc_profiles | ✅ Active |
| Referrals | `/admin/referrals` | referrals, referral_rewards | ✅ Active |
| Resellers | `/admin/resellers` | reseller_profiles, reseller_tiers | ✅ Active |
| Result Checkers | `/admin/result-checkers` | result_checker_cards | ✅ Active |
| **Permissions** | `/admin/permissions` | permissions | 🆕 NEW |
| **Roles** | `/admin/roles` | roles | 🆕 NEW |
| **User Favorites** | `/admin/favorites` | favorites | 🆕 NEW |

---

### 🛍️ Commerce & Products
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| Transactions | `/admin/transactions` | transactions, payment_intents | ✅ Active |
| Orders | `/admin/orders` | datamart_orders, transactions | ✅ Active |
| Guest Orders | `/admin/guest-orders` | guest_orders, transactions | ✅ Active |
| Data Bundles | `/admin/data-bundles` | data_bundles, networks | ✅ Active |
| Networks | `/admin/networks` | networks, data_bundle_categories | ✅ Active |
| Datamart Setup | `/admin/datamart-setup` | datamart_orders, datamart_data_packages | ✅ Active |
| Verification Pricing | `/admin/verification-pricing` | verification_services, data_bundles | ✅ Active |
| **eSIM Products** | `/admin/esim-products` | esim_products | 🆕 NEW |
| **eSIM Orders** | `/admin/esim-orders` | esim_orders | 🆕 NEW |
| **Gift Cards** | `/admin/gift-cards` | giftcard_orders | 🆕 NEW |
| **Promo Codes** | `/admin/promo-codes` | promo_codes, promo_redemptions | 🆕 NEW |
| **Proxy Services** | `/admin/proxy-services` | proxy_orders, proxy_pricing | 🆕 NEW |
| **Bulk Orders** | `/admin/bulk-orders` | datamart_bulk_batches, datamart_bulk_order_items | 🆕 NEW |

---

### 🔒 Trust & Safety
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| Disputes | `/admin/disputes` | disputes | ✅ Active |
| Fraud Detection | `/admin/fraud` | fraud_alerts, suspicious_transactions | ✅ Active |
| Verification | `/admin/verification` | verification_numbers, verification_services | ✅ Active |
| Audit Logs | `/admin/audit` | action_logs, admin_users | ✅ Active |
| **KYC Reviews** | `/admin/kyc-reviews` | kyc_reviews, kyc_profiles | 🆕 NEW |
| **Payment Events** | `/admin/payment-events` | payment_events, payment_intents | 🆕 NEW |
| **SMSPVA Management** | `/admin/smspva-management` | smspva_services, smspva_availability | 🆕 NEW |

---

### 📝 Content & Marketing
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| CMS / Pages | `/admin/cms` | cms_content, homepage_faqs | ✅ Active |
| Media Library | `/admin/media` | media_assets, media_slots | ✅ Active |
| Navigation Config | `/admin/navigation-config` | navigation_links, popup_banners | ✅ Active |
| Notifications | `/admin/notifications` | notifications, user_banner_dismissals | ✅ Active |
| **Marketing Assets** | `/admin/marketing-assets` | marketing_assets | 🆕 NEW |

---

### ⚙️ Platform & Configuration
| Page | Route | Tables | Status |
|------|-------|--------|--------|
| Service Status | `/admin/service-status` | service_status | ✅ Active |
| Configuration | `/admin/config` | system_config, permissions, roles | ✅ Active |
| Settings | `/admin/settings` | app_settings, system_config | ✅ Active |

---

## Statistics

### Pages by Type
- ✅ **Existing Pages**: 26
- 🆕 **New Pages**: 12
- **Total**: 38 admin pages

### Database Tables
- **Total Tables**: 93
- **Direct Page Access**: 38+
- **API Access**: 15+
- **Legacy/System**: 40

### Features Per Page
- ✅ Search & Filter
- ✅ Add New Record
- ✅ Edit Records
- ✅ Delete Records
- ✅ CSV Export
- ✅ Pagination
- ✅ Error Handling

---

## API Endpoints

### Dedicated APIs
```
GET    /api/admin/esim-products              - List eSIM products
POST   /api/admin/esim-products              - Create eSIM product
PATCH  /api/admin/esim-products              - Update eSIM product
DELETE /api/admin/esim-products              - Delete eSIM product
```

### Comprehensive Table API (15+ tables)
```
GET    /api/admin/comprehensive-tables?table=X   - List records from table X
POST   /api/admin/comprehensive-tables           - Create record
PATCH  /api/admin/comprehensive-tables           - Update record
DELETE /api/admin/comprehensive-tables           - Delete record
```

**Supported Tables** in comprehensive endpoint:
- giftcard_orders
- promo_codes, promo_redemptions
- proxy_orders, proxy_pricing
- payment_events
- marketing_assets
- kyc_reviews
- favorites
- permissions, roles
- datamart_bulk_batches, datamart_bulk_order_items
- smspva_availability
- custom_form_fields
- datamart_webhook_logs
- rate_limit_violations

---

## Access Control

All pages require:
- ✅ Admin authentication (via `requireAdmin`)
- ✅ Valid session
- ✅ Admin role in database

---

## Usage Examples

### View eSIM Products
```bash
curl https://app.com/api/admin/esim-products
```

### Create Gift Card Order
```bash
curl -X POST https://app.com/api/admin/comprehensive-tables \
  -H "Content-Type: application/json" \
  -d '{
    "table": "giftcard_orders",
    "data": {
      "user_id": "123",
      "amount": 50,
      "code": "GC-ABC123"
    }
  }'
```

### Search Promo Codes
```bash
curl "https://app.com/api/admin/comprehensive-tables?table=promo_codes&search=summer"
```

---

## Navigation Menu Structure

```
Admin Dashboard
├── Core Management
│   ├── Dashboard
│   ├── Users
│   ├── Transactions
│   └── Analytics
│
├── Commerce & Products
│   ├── Data Bundles
│   ├── Networks
│   ├── eSIM Products ⭐ NEW
│   ├── Gift Cards ⭐ NEW
│   ├── Promo Codes ⭐ NEW
│   ├── Proxy Services ⭐ NEW
│   ├── Bulk Orders ⭐ NEW
│   ├── Datamart Setup
│   ├── Verification Pricing
│   ├── Resellers
│   ├── Referrals
│   └── Billing
│
├── Trust & Safety
│   ├── Disputes
│   ├── Fraud Alerts
│   ├── KYC Reviews ⭐ NEW
│   ├── Payment Events ⭐ NEW
│   ├── Audit Logs
│   ├── Verification
│   └── SMSPVA Management ⭐ NEW
│
├── Content & Marketing
│   ├── CMS / Pages
│   ├── Media Library
│   ├── Marketing Assets ⭐ NEW
│   ├── Navigation
│   └── Notifications
│
├── Users & Permissions
│   ├── Permissions ⭐ NEW
│   ├── Roles ⭐ NEW
│   └── User Favorites ⭐ NEW
│
└── Platform
    ├── Result Checkers
    ├── Service Status
    ├── Configuration
    └── Settings
```

---

## Quick Links

- 📖 [DATABASE_MAPPING.md](./DATABASE_MAPPING.md) - Complete table mapping
- 📋 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- 🏗️ [generic-table-page-template.tsx](./src/app/admin/generic-table-page-template.tsx) - Page template

---

**Last Updated**: 2024
**Status**: All 93 tables accessible
**Deploy**: Main branch
