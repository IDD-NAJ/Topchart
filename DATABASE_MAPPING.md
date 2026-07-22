# Database Tables to Pages & Admin Sections Mapping

## Total: 93 Tables | 30 Dashboard Pages | 26 Admin Pages

---

## DASHBOARD PAGES (User-Facing)

### 1. Dashboard Home (`/dashboard`)
- **Data Sources**: users, wallets, transactions, datamart_orders, verification_numbers
- **Content**: Welcome, quick stats, recent activity

### 2. Data (`/dashboard/data`)
- **Table**: data_bundle_purchases, data_bundles, data_bundle_categories, networks
- **Status**: ✅ Exists

### 3. Bills (`/dashboard/bills`)
- **Table**: bill_transactions, transactions
- **Status**: ✅ Exists

### 4. Verification (`/dashboard/verification`)
- **Table**: verification_numbers, verification_services, verification_sms, smspva_services
- **Status**: ✅ Exists

### 5. Verification History (`/dashboard/verification/history`)
- **Status**: ✅ Exists

### 6. Wallet (`/dashboard/wallet`)
- **Table**: wallets, transactions, ledger_entries, ledger_accounts
- **Status**: ✅ Exists

### 7. Purchase History (`/dashboard/history`)
- **Table**: transactions, datamart_orders, data_bundle_purchases, guest_orders
- **Status**: ✅ Exists

### 8. Disputes (`/dashboard/disputes`)
- **Table**: disputes
- **Status**: ✅ Exists

### 9. Support Tickets (`/dashboard/tickets`)
- **Table**: tickets, ticket_messages
- **Status**: ✅ Exists

### 10. FAQ (`/dashboard/faq`)
- **Table**: homepage_faqs
- **Status**: ✅ Exists

### 11. Profile (`/dashboard/profile`)
- **Table**: users, user_profiles, kyc_profiles, kyc_documents
- **Status**: ✅ Exists

### 12. Result Checkers (`/dashboard/result-checkers`)
- **Table**: result_checker_cards, result_checker_purchases
- **Status**: ✅ Exists

### 13-21. Reseller Pages (`/dashboard/reseller/*`)
- **Table**: reseller_profiles, reseller_applications, reseller_inventory, reseller_commissions, reseller_sales, reseller_tiers, reseller_referral_links, reseller_daily_stats, reseller_geographic_stats
- **Status**: ✅ Exists (11 pages)

---

## ADMIN PAGES

### Core Management
| Page | Table(s) | Status |
|------|----------|--------|
| Dashboard | All | ✅ Exists |
| Users | users, user_profiles, kyc_profiles | ✅ Exists |
| Transactions | transactions, payment_intents, payment_events | ✅ Exists |
| Orders | datamart_orders, guest_orders, transactions | ✅ Exists |
| Guest Orders | guest_orders, transactions, users | ✅ Exists |

### Commerce & Data
| Page | Table(s) | Status |
|------|----------|--------|
| Data Bundles | data_bundles, data_bundle_categories, networks | ✅ Exists |
| Networks | networks, data_bundle_categories | ✅ Exists |
| Datamart Setup | datamart_orders, datamart_data_packages, datamart_webhook_logs | ✅ Exists |
| Verification Pricing | verification_services, data_bundles | ✅ Exists |

### Settings & Configuration
| Page | Table(s) | Status |
|------|----------|--------|
| Settings | system_config, app_settings | ✅ Exists |
| Config | system_config, permissions, roles | ✅ Exists |
| CMS | cms_content, homepage_faqs, homepage_media, homepage_services, homepage_testimonials | ✅ Exists |
| Media Library | media_asset, media_slot | ✅ Exists |
| Navigation Config | navigation_links, popup_banners | ✅ Exists |
| Service Status | service_status | ✅ Exists |

### Business Intelligence & Moderation
| Page | Table(s) | Status |
|------|----------|--------|
| Analytics | transactions, datamart_orders, users, reseller_profiles | ✅ Exists |
| Billing | bill_transactions, transactions, payment_intents | ✅ Exists |
| Disputes | disputes | ✅ Exists |
| Fraud Detection | fraud_alerts, suspicious_transactions, rate_limit_violations | ✅ Exists |
| Notifications | notifications, user_banner_dismissals | ✅ Exists |
| Audit Logs | action_logs, admin_users | ✅ Exists |

### User Management
| Page | Table(s) | Status |
|------|----------|--------|
| Referrals | referrals, referral_rewards, referral_visits | ✅ Exists |
| Resellers | reseller_profiles, reseller_applications, reseller_tiers | ✅ Exists |
| Result Checkers | result_checker_cards, result_checker_purchases | ✅ Exists |

---

## TABLES NOT YET IN A PAGE/SECTION (Unused)

| # | Table | Type | Purpose |
|----|-------|------|---------|
| 1 | AppSetting | PascalCase (Legacy) | App settings (legacy) |
| 2 | Order | PascalCase (Legacy) | Orders (legacy) |
| 3 | Product | PascalCase (Legacy) | Products (legacy) |
| 4 | User | PascalCase (Legacy) | Users (legacy) |
| 5 | VerificationNumber | PascalCase (Legacy) | Verification (legacy) |
| 6 | VerificationService | PascalCase (Legacy) | Services (legacy) |
| 7 | VerificationSms | PascalCase (Legacy) | SMS (legacy) |
| 8 | _migrations | System | Migration tracker |
| 9 | _prisma_migrations | System | Prisma migration tracker |
| 10 | custom_form_fields | CMS | Dynamic form fields |
| 11 | datamart_bulk_batches | Datamart | Bulk order batches |
| 12 | datamart_bulk_order_items | Datamart | Items in bulk orders |
| 13 | esim_data_packages | eSIM | eSIM packages |
| 14 | esim_orders | eSIM | eSIM orders |
| 15 | esim_phone_plans | eSIM | eSIM plans |
| 16 | esim_products | eSIM | eSIM products |
| 17 | favorites | User Content | User favorites |
| 18 | giftcard_orders | Payments | Gift card orders |
| 19 | kyc_reviews | KYC | KYC review records |
| 20 | marketing_assets | Marketing | Marketing materials |
| 21 | payment_events | Payments | Payment event history |
| 22 | permissions | RBAC | Role permissions |
| 23 | promo_codes | Marketing | Promo code management |
| 24 | promo_redemptions | Marketing | Promo redemption history |
| 25 | proxy_orders | Services | Proxy service orders |
| 26 | proxy_pricing | Services | Proxy pricing |
| 27 | roles | RBAC | User roles |
| 28 | sessions | Auth | User sessions |
| 29 | smspva_availability | Services | SMSPVA availability |
| 30 | smspva_services | Services | SMSPVA services |

---

## TABLES TO CREATE NEW PAGES/SECTIONS FOR

### High Priority (Active Tables with Data)
1. **eSIM Management** - esim_products, esim_orders, esim_phone_plans, esim_data_packages
2. **Gift Cards** - giftcard_orders
3. **Promo Codes** - promo_codes, promo_redemptions
4. **Proxy Services** - proxy_orders, proxy_pricing
5. **Payment Events** - payment_events (detailed payment tracking)
6. **Marketing Assets** - marketing_assets
7. **Permissions & Roles** - permissions, roles (admin RBAC management)
8. **KYC Reviews** - kyc_reviews (for KYC approval workflows)
9. **Favorites** - favorites (user favorites management)
10. **Datamart Bulk Orders** - datamart_bulk_batches, datamart_bulk_order_items

### Medium Priority (System/Utility Tables)
11. **Custom Form Fields** - custom_form_fields (dynamic form builder)
12. **SMSPVA Availability** - smspva_availability, smspva_services (SMS service monitoring)

---

## ACTION ITEMS

### Admin Dashboard New Sections Needed:
- [ ] eSIM Management (admin/esim-products, admin/esim-orders)
- [ ] Gift Cards (admin/gift-cards)
- [ ] Promo Codes (admin/promo-codes)
- [ ] Proxy Services (admin/proxy-services)
- [ ] Payment Events (admin/payment-events)
- [ ] Marketing Assets (admin/marketing-assets)
- [ ] RBAC Management (admin/permissions, admin/roles)
- [ ] KYC Reviews (admin/kyc-reviews)
- [ ] User Favorites (admin/user-favorites)
- [ ] Datamart Bulk Orders (admin/bulk-orders)

### Dashboard User Sections Needed:
- [ ] eSIM (dashboard/esim)
- [ ] Gift Cards (dashboard/gift-cards)
- [ ] Proxy Services (dashboard/proxy-services)

---

## DATA FLOW ARCHITECTURE

```
Users
├── user_profiles
├── kyc_profiles
├── kyc_documents
├── kyc_reviews
└── admin_users

Commerce
├── transactions
├── payment_intents
├── payment_events
├── bill_transactions
├── guest_orders
├── datamart_orders
│   ├── datamart_data_packages
│   ├── datamart_bulk_batches
│   └── datamart_bulk_order_items
├── giftcard_orders
├── data_bundle_purchases
├── esim_orders
├── proxy_orders
└── result_checker_purchases

Products & Pricing
├── data_bundles
│   └── data_bundle_categories
├── networks
├── data_providers
├── esim_products
│   ├── esim_phone_plans
│   └── esim_data_packages
├── proxy_pricing
├── result_checker_cards
├── promo_codes
│   └── promo_redemptions
├── verification_services
├── smspva_services
│   └── smspva_availability
└── datamart_data_packages

Marketing & Referrals
├── referrals
├── referral_rewards
├── referral_visits
├── marketing_assets
└── promo_codes

Verification & SMS
├── verification_numbers
├── verification_sms
└── smspva_services

Inventory & Reseller
├── reseller_profiles
├── reseller_applications
├── reseller_inventory
├── reseller_tiers
├── reseller_commissions
├── reseller_sales
├── reseller_daily_stats
├── reseller_geographic_stats
└── reseller_audit_logs

Finance & Accounting
├── wallets
├── ledger_accounts
├── ledger_entries
├── transactions
└── bill_transactions

Security & Moderation
├── fraud_alerts
├── suspicious_transactions
├── rate_limit_violations
├── action_logs
└── auth_sessions

Content & UI
├── cms_content
├── homepage_faqs
├── homepage_media
├── homepage_services
├── homepage_testimonials
├── navigation_links
├── popup_banners
├── custom_form_fields
├── media_assets
└── media_slots

Notifications & Support
├── notifications
├── user_banner_dismissals
├── tickets
├── ticket_messages
└── disputes

System
├── system_config
├── app_settings
├── permissions
├── roles
├── service_status
├── favorites
├── sessions
└── datamart_webhook_logs
```
