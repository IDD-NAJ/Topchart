# Topchart.store - Complete Service Discovery Report
**Phase 1: Complete Service Discovery**
**Date:** January 2025

---

## Executive Summary

Topchart.store is a comprehensive digital services marketplace in Ghana, NOT just a data bundle website. The platform offers **10+ major service categories** with **40+ individual service types** across multiple providers.

---

## 1. DATA BUNDLES SERVICE

### Networks Supported:
- **MTN** - Ghana's largest mobile network
- **Telecel/Vodafone** - Rebranded Vodafone network
- **AirtelTigo** - Merged Airtel and Tigo network

### Data Plan Types:
- Daily bundles (50MB - 200MB)
- Weekly bundles (350MB - 1.5GB)
- Monthly bundles (2GB - 10GB)
- Mega bundles (10GB - 25GB)

### Providers:
- Datamart (primary)
- Reloadly (backup)

### Transaction Type: `data`

### Dashboard Route: `/dashboard/data`

---

## 2. Foreign NumberS SERVICE

### Service Description:
Virtual phone numbers for SMS/OTP verification across global platforms

### Categories (from PVADeals):
- **Social Media** - WhatsApp, Telegram, Facebook, Instagram, Twitter/X
- **E-Commerce & Financial** - PayPal, Stripe, Banks, Trading platforms
- **Professional Tools** - LinkedIn, Microsoft, Google, Email services
- **Streaming & Entertainment** - Netflix, Spotify, Disney+, Gaming platforms

### Duration Options:
- STR (Short-term rental)
- LTR3 (Long-term rental - 3 days)
- LTR7 (Long-term rental - 7 days)
- LTR14 (Long-term rental - 14 days)
- LTR30 (Long-term rental - 30 days)

### Providers:
- PVADeals (primary)
- SMSpva (backup)
- Textverified (backup)

### Transaction Types: `verification`, `verification_str`, `verification_ltr`

### Dashboard Route: `/dashboard/verification`

---

## 3. RESULT CHECKERS SERVICE

### Service Description:
Exam result checker vouchers for Ghanaian educational institutions

### Exam Types:
- **WAEC** - West African Examinations Council
- **BECE** - Basic Education Certificate Examination
- **NOVDEC** - November/December private candidates

### Features:
- Instant PIN delivery
- Serial number generation
- Wholesale pricing for resellers
- Purchase history tracking

### Transaction Type: `result_checker`

### Dashboard Route: `/dashboard/result-checkers`

---

## 4. eSIM SERVICE

### Service Description:
Digital SIM cards for global connectivity without physical SIM cards

### eSIM Types:

#### A. US Phone Plans (Virtual Numbers)
- US Basic - 100 minutes, 100 SMS, 30 days
- US Premium - 500 minutes, 500 SMS, 30 days
- US Business - 999 minutes, 999 SMS, 90 days

#### B. Travel Data eSIMs (International Data)
**Africa Region:**
- Ghana: 1GB-7D, 3GB-30D, 5GB-30D
- Nigeria: 2GB-7D, 5GB-30D
- Kenya: 3GB-30D
- South Africa: 2GB-30D

**Europe Region:**
- UK: 1GB-7D, 5GB-30D

**Americas Region:**
- US: 3GB-7D, 10GB-30D

**Middle East Region:**
- UAE: 2GB-7D, 5GB-30D

**Asia Region:**
- India: 3GB-30D

### Providers:
- Airalo (primary)
- Datamart (backup)

### Transaction Type: `esim`

### Dashboard Route: `/dashboard/esim`

---

## 5. PROXIES SERVICE

### Service Description:
Residential, mobile, and datacenter proxies for various use cases

### Proxy Types:
- **Residential Proxies** - Real residential IPs, hardest to detect
- **Mobile Proxies** - Mobile carrier IPs, ideal for social/mobile
- **Datacenter Proxies** - Fast datacenter IPs, best for high volume

### Features:
- Rotation and sticky session options
- Multiple country/city/state targeting
- ISP targeting
- IP balance management
- Traffic balance management

### Pricing:
- Residential: GHS 2.00/port
- Mobile: GHS 3.00/port
- Datacenter: GHS 1.00/port

### Provider:
- NineProxy

### Transaction Type: `proxy`

### Dashboard Route: `/dashboard/proxies`

---

## 6. GIFT CARDS SERVICE

### Service Description:
Digital gift cards for global brands

### Gift Card Brands:

**Entertainment:**
- Netflix
- Spotify

**Shopping:**
- Amazon
- Google Play
- Apple/iTunes

**Gaming:**
- Steam
- PlayStation
- Xbox

**Lifestyle:**
- Uber
- Airbnb

### Denominations:
- Varies by brand (GHS 10 - GHS 200+)

### Transaction Type: `giftcard`

### Dashboard Route: `/dashboard/giftcards`

---

## 7. BILLS PAYMENT SERVICE

### Service Description:
Utility bill payments for essential services

### Bill Categories:

#### A. Electricity
- **ECG Prepaid** - Meter number payments
- **ECG Postpaid** - Account number payments

#### B. TV Subscriptions
- **DSTV** - Smart card number payments
- **GOtv** - ICU number payments

#### C. Water
- **Ghana Water (GWCL)** - Account number payments

#### D. Internet
- **MTN Fibre** - Account number payments
- **Telecel Broadband** - Account number payments

### Providers:
- VTpass (primary)
- Datamart (backup)
- Reloadly Utilities (backup)

### Transaction Type: `bill`

### Dashboard Route: `/dashboard/bills`

---

## 8. AIRTIME SERVICE

### Service Description:
Mobile airtime topup for Ghanaian networks

### Networks:
- MTN
- Telecel/Vodafone
- AirtelTigo

### Provider:
- Reloadly

### Transaction Type: `airtime`

### Dashboard Route: Integrated with data bundles

---

## 9. RESELLER PROGRAMME SERVICE

### Service Description:
Commission-based reseller platform for entrepreneurs

### Features:
- White-label storefront
- Custom branding
- Commission structure
- Analytics dashboard
- Marketing tools
- Referral system
- Tier system
- Purchase history
- Activity tracking

### Commission Types:
- Referral bonuses
- Direct sales commissions
- Tier-based rewards

### Dashboard Route: `/dashboard/reseller`

---

## 10. WALLET SERVICE

### Service Description:
Digital wallet for funding and transactions

### Funding Methods:
- MTN MoMo
- Telecel Cash
- AirtelTigo Money
- Visa/Mastercard (via Paystack)
- Bank transfer

### Wallet Features:
- Available balance
- Pending balance
- Transaction history
- Deposit tracking
- Withdrawal system
- Bonus credits
- Refund processing

### Transaction Types: `deposit`, `withdrawal`, `refund`, `bonus`

### Dashboard Route: `/dashboard/wallet`

---

## 11. REFERRAL SYSTEM SERVICE

### Service Description:
User referral and reward system

### Features:
- Unique referral codes
- Reward tracking
- Referral statistics
- Qualified referrals counting
- Total earnings tracking
- Reward distribution

### Transaction Type: `referral`

---

## 12. TRANSACTION SYSTEM SERVICE

### Service Description:
Central transaction processing and tracking

### Transaction Statuses:
- success
- pending
- failed
- processing
- refunded

### Transaction Types (Complete List):
1. `deposit` - Wallet funding
2. `airtime` - Airtime purchase
3. `data` - Data bundle purchase
4. `referral` - Referral bonus
5. `bonus` - Bonus credit
6. `withdrawal` - Wallet withdrawal
7. `refund` - Transaction refund
8. `result_checker` - Result checker purchase
9. `esim` - eSIM purchase
10. `proxy` - Proxy purchase
11. `giftcard` - Gift card purchase
12. `bill` - Bill payment
13. `verification` - Standard Foreign Number
14. `verification_str` - Short-term verification
15. `verification_ltr` - Long-term verification

---

## EXISTING LANDING PAGES (Already Created)

1. `/buy-verification-numbers-ghana` - Foreign Numbers landing page
2. `/cheap-data-accra` - Accra-specific data bundles
3. `/cheap-data-kumasi` - Kumasi-specific data bundles
4. `/cheap-mtn-data-ghana` - MTN data bundles
5. `/data-reseller-ghana` - Reseller programme
6. `/dstv-subscription-ghana` - DSTV payments

---

## SERVICE PROVIDERS SUMMARY

### Primary Providers:
- **Datamart** - Data bundles, bills
- **PVADeals** - Foreign Numbers
- **Airalo** - eSIM services
- **NineProxy** - Proxy services
- **VTpass** - Bill payments
- **Reloadly** - Airtime, utilities
- **Paystack** - Payment processing

### Backup Providers:
- **SMSpva** - Foreign Numbers
- **Textverified** - Foreign Numbers
- **Datamart** - Bills (secondary)

---

## KEYWORDS BY SERVICE CATEGORY

### Data Bundles:
- cheap data bundles Ghana
- MTN cheap data bundles
- Telecel bundles Ghana
- AirtelTigo internet bundles
- buy MTN data online Ghana
- affordable internet Ghana
- instant data delivery Ghana
- non expiry data bundles

### Foreign Numbers:
- buy Foreign Numbers
- cheap SMS Foreign Numbers
- virtual numbers for OTP
- WhatsApp Foreign Number
- Telegram Foreign Number
- temporary phone number
- online SMS verification
- cheap OTP numbers

### Result Checkers:
- WAEC result checker Ghana
- BECE result checker
- NOVDEC checker Ghana
- buy result checker online
- exam result voucher

### eSIM:
- eSIM Ghana
- travel eSIM
- US virtual number
- international data eSIM
- digital SIM card
- eSIM for travel

### Proxies:
- residential proxies Ghana
- mobile proxies
- datacenter proxies
- buy proxies online
- Ghana proxy service

### Gift Cards:
- buy gift cards Ghana
- Netflix gift card
- Spotify gift card
- Amazon gift card
- digital gift cards

### Bills - Electricity:
- pay electricity bill Ghana
- ECG payment Ghana
- prepaid electricity Ghana
- postpaid electricity Ghana

### Bills - TV:
- DSTV subscription Ghana
- pay GOTV online Ghana
- cheap DSTV renewal Ghana
- instant TV subscription Ghana
- renew DSTV online
- GOTV payment Ghana

### Bills - Water:
- pay water bill Ghana
- GWCL payment Ghana
- Ghana Water Company

### Bills - Internet:
- MTN Fibre payment
- Telecel Broadband payment
- internet bill payment Ghana

### Airtime:
- buy airtime online Ghana
- instant airtime topup
- MTN airtime Ghana
- Telecel airtime online
- AirtelTigo recharge Ghana
- cheap airtime Ghana
- mobile recharge online Ghana

### Reseller:
- data reseller Ghana
- become a data reseller
- cheap reseller bundles Ghana
- reseller platform Ghana
- make money selling data
- automated reseller platform

---

## SEO OPPORTUNITIES IDENTIFIED

### High-Priority Landing Pages Needed:

1. **Data Bundle Landing Pages:**
   - `/cheap-mtn-data-ghana` ✓ (exists)
   - `/cheap-telecel-bundles-ghana`
   - `/cheap-airteltigo-data-ghana`
   - `/non-expiry-data-bundles-ghana`
   - `/weekly-data-bundles-ghana`
   - `/monthly-data-bundles-ghana`

2. **Foreign Number Landing Pages:**
   - `/buy-verification-numbers-ghana` ✓ (exists)
   - `/whatsapp-verification-number`
   - `/telegram-verification-number`
   - `/google-verification-number`
   - `/facebook-verification-number`
   - `/temporary-phone-number`

3. **Result Checker Landing Pages:**
   - `/waec-result-checker-ghana`
   - `/bece-result-checker`
   - `/novdec-checker-ghana`

4. **eSIM Landing Pages:**
   - `/esim-ghana`
   - `/travel-esim`
   - `/us-virtual-number`
   - `/international-data-esim`

5. **Proxy Landing Pages:**
   - `/residential-proxies-ghana`
   - `/mobile-proxies`
   - `/datacenter-proxies`

6. **Gift Card Landing Pages:**
   - `/buy-gift-cards-ghana`
   - `/netflix-gift-card-ghana`
   - `/spotify-gift-card-ghana`

7. **Bill Payment Landing Pages:**
   - `/dstv-subscription-ghana` ✓ (exists)
   - `/gotv-payment-ghana`
   - `/ecg-payment-ghana`
   - `/pay-electricity-bill-ghana`
   - `/gwcl-payment-ghana`
   - `/mtn-fibre-payment`

8. **Airtime Landing Pages:**
   - `/buy-airtime-online-ghana`
   - `/mtn-airtime-ghana`
   - `/telecel-airtime-ghana`
   - `/airteltigo-recharge-ghana`

9. **Reseller Landing Pages:**
   - `/data-reseller-ghana` ✓ (exists)
   - `/become-reseller-ghana`

10. **Local SEO Landing Pages:**
    - `/cheap-data-accra` ✓ (exists)
    - `/cheap-data-kumasi` ✓ (exists)
    - `/cheap-data-tema`
    - `/cheap-data-takoradi`
    - `/cheap-data-cape-coast`

---

## DYNAMIC SERVICE GENERATION NEEDS

### Services Requiring Dynamic SEO:

1. **Data Bundles** - Dynamic by network and plan type
2. **Foreign Numbers** - Dynamic by service (WhatsApp, Telegram, etc.)
3. **eSIM** - Dynamic by country and region
4. **Gift Cards** - Dynamic by brand
5. **Bills** - Dynamic by provider
6. **Proxies** - Dynamic by proxy type

---

## PHASE 1 CONCLUSION

**Total Services Discovered:** 12 major service categories
**Total Individual Service Types:** 40+
**Total Providers:** 10+
**Existing Landing Pages:** 6
**Recommended New Landing Pages:** 30+

**Next Phase:** Phase 2 - Service-Specific SEO Architecture
