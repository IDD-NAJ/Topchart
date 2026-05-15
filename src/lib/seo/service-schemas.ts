import { generateProductSchema, generateServiceSchema, generateFAQSchema } from './dynamic-schema'

export const DATA_BUNDLE_SCHEMA = generateProductSchema({
  name: 'Data Bundles Ghana',
  description: 'Buy cheap MTN, Telecel, and AirtelTigo data bundles in Ghana. Instant delivery via MoMo. Daily, weekly, monthly, and mega bundles available.',
  brand: 'Topchart Ghana',
  offers: [
    {
      name: 'MTN Daily 50MB',
      description: 'MTN daily data bundle - 50MB for 1 day',
      price: '1.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'MTN Monthly 2GB',
      description: 'MTN monthly data bundle - 2GB for 30 days',
      price: '20.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Telecel Weekly 500MB',
      description: 'Telecel weekly data bundle - 500MB for 7 days',
      price: '5.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'AirtelTigo Monthly 3GB',
      description: 'AirtelTigo monthly data bundle - 3GB for 30 days',
      price: '25.00',
      priceCurrency: 'GHS',
    },
  ],
})

export const VERIFICATION_NUMBER_SCHEMA = generateServiceSchema({
  name: 'SMS Verification Numbers',
  description: 'Buy cheap SMS verification numbers and OTP virtual numbers for WhatsApp, Telegram, Facebook, Google, and 100+ platforms in Ghana.',
  provider: 'Topchart Ghana',
  areaServed: ['Ghana', 'Accra', 'Kumasi', 'Tema', 'Takoradi'],
})

export const AIRTIME_SCHEMA = generateServiceSchema({
  name: 'Airtime Topup',
  description: 'Buy airtime online in Ghana instantly. MTN, Telecel, AirtelTigo airtime topup via MoMo at cheapest rates.',
  provider: 'Topchart Ghana',
  areaServed: ['Ghana'],
})

export const RESULT_CHECKER_SCHEMA = generateProductSchema({
  name: 'WAEC Result Checker',
  description: 'Buy WAEC, BECE, and NOVDEC result checker vouchers online in Ghana. Instant PIN delivery via MoMo.',
  brand: 'Topchart Ghana',
  offers: [
    {
      name: 'WAEC WASSCE Checker',
      description: 'WAEC WASSCE result checker voucher',
      price: '15.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'BECE Checker',
      description: 'BECE result checker voucher',
      price: '10.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'NOVDEC Checker',
      description: 'NOVDEC private candidates checker',
      price: '20.00',
      priceCurrency: 'GHS',
    },
  ],
})

export const ESIM_SCHEMA = generateProductSchema({
  name: 'eSIM Ghana',
  description: 'Buy eSIM in Ghana for international travel. Digital SIM cards for global connectivity with US virtual numbers and travel data eSIMs.',
  brand: 'Topchart Ghana',
  offers: [
    {
      name: 'US Virtual Number',
      description: 'US phone number with voice, SMS, and data for 30 days',
      price: '200.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Travel eSIM US',
      description: 'Travel data eSIM for United States - 3GB for 7 days',
      price: '30.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Travel eSIM UK',
      description: 'Travel data eSIM for United Kingdom - 5GB for 30 days',
      price: '65.00',
      priceCurrency: 'GHS',
    },
  ],
})

export const PROXY_SCHEMA = generateProductSchema({
  name: 'Proxies Ghana',
  description: 'Buy residential, mobile, and datacenter proxies in Ghana. Secure, fast, and reliable proxy services for SEO, scraping, and privacy.',
  brand: 'Topchart Ghana',
  offers: [
    {
      name: 'Residential Proxies',
      description: 'Real residential IPs - hardest to detect',
      price: '2.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Mobile Proxies',
      description: 'Mobile carrier IPs - ideal for social/mobile',
      price: '3.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Datacenter Proxies',
      description: 'Fast datacenter IPs - best for high volume',
      price: '1.00',
      priceCurrency: 'GHS',
    },
  ],
})

export const GIFT_CARD_SCHEMA = generateProductSchema({
  name: 'Gift Cards Ghana',
  description: 'Buy digital gift cards in Ghana. Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, and Airbnb gift cards available.',
  brand: 'Topchart Ghana',
  offers: [
    {
      name: 'Netflix Gift Card',
      description: 'Netflix gift card for entertainment',
      price: '30.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Spotify Gift Card',
      description: 'Spotify gift card for music streaming',
      price: '15.00',
      priceCurrency: 'GHS',
    },
    {
      name: 'Amazon Gift Card',
      description: 'Amazon gift card for shopping',
      price: '25.00',
      priceCurrency: 'GHS',
    },
  ],
})

export const BILL_PAYMENT_SCHEMA = generateServiceSchema({
  name: 'Bill Payment Ghana',
  description: 'Pay bills online in Ghana. Electricity (ECG), TV (DSTV, GOtv), Water (GWCL), and Internet (MTN Fibre, Telecel Broadband) bill payments.',
  provider: 'Topchart Ghana',
  areaServed: ['Ghana'],
})

export const DATA_BUNDLE_FAQ_SCHEMA = generateFAQSchema({
  questions: [
    {
      question: 'How can I buy cheap data bundles in Ghana?',
      answer: 'You can buy cheap data bundles in Ghana on Topchart.store. Simply select your network (MTN, Telecel, or AirtelTigo), choose your preferred data plan, and pay via MTN MoMo, Telecel Cash, or AirtelTigo Money. Your data bundle is delivered instantly.',
    },
    {
      question: 'What are the cheapest data bundles in Ghana?',
      answer: 'The cheapest data bundles in Ghana start from GHS 1 for 50MB daily bundles. Weekly bundles start from GHS 5, and monthly bundles from GHS 20. Topchart offers the lowest prices in Ghana.',
    },
    {
      question: 'Do you offer non-expiry data bundles in Ghana?',
      answer: 'Yes, Topchart offers non-expiry data bundles on MTN, Telecel, and AirtelTigo. These bundles do not expire until you use them completely.',
    },
    {
      question: 'How do I buy MTN data bundles online in Ghana?',
      answer: 'Buy MTN data bundles online in Ghana on Topchart.store. Enter your MTN phone number, select your preferred MTN data plan (daily, weekly, monthly, or mega), and pay via MTN MoMo. Your MTN data is credited instantly.',
    },
    {
      question: 'Can I buy Telecel data bundles online in Ghana?',
      answer: 'Yes, you can buy Telecel data bundles online in Ghana on Topchart.store. Enter your Telecel phone number, choose your Telecel data plan, and pay via Telecel Cash or MTN MoMo. Instant delivery guaranteed.',
    },
  ],
})

export const VERIFICATION_NUMBER_FAQ_SCHEMA = generateFAQSchema({
  questions: [
    {
      question: 'How do I buy verification numbers in Ghana?',
      answer: 'Buy verification numbers in Ghana on Topchart.store. Select your preferred platform (WhatsApp, Telegram, Facebook, etc.), choose duration (1 hour to 30 days), and pay via MoMo. Your number is delivered instantly.',
    },
    {
      question: 'Are your verification numbers private and secure?',
      answer: 'Yes, all verification numbers on Topchart.store are private and secure. Numbers are disposable and not shared with third parties. Your privacy is protected.',
    },
    {
      question: 'What platforms can I verify in Ghana?',
      answer: 'You can verify 100+ platforms in Ghana including WhatsApp, Telegram, Facebook, Instagram, Google, Microsoft, PayPal, Stripe, Netflix, Spotify, and many more.',
    },
    {
      question: 'How do I get a WhatsApp verification number in Ghana?',
      answer: 'Get a WhatsApp verification number in Ghana on Topchart.store. Select WhatsApp from the platform list, choose your preferred duration, and pay. Your WhatsApp number is delivered instantly with SMS receive capability.',
    },
    {
      question: 'What are the cheapest verification numbers in Ghana?',
      answer: 'The cheapest verification numbers in Ghana start from GHS 2 for short-term rentals (1 hour). Medium-term rentals (3-7 days) start from GHS 5, and long-term rentals (14-30 days) start from GHS 15.',
    },
  ],
})

export const AIRTIME_FAQ_SCHEMA = generateFAQSchema({
  questions: [
    {
      question: 'How can I buy airtime online in Ghana?',
      answer: 'Buy airtime online in Ghana on Topchart.store. Enter your phone number, select your network (MTN, Telecel, AirtelTigo), choose amount, and pay via MoMo. Airtime is credited instantly.',
    },
    {
      question: 'What are the airtime denominations available in Ghana?',
      answer: 'Airtime denominations in Ghana range from GHS 1 to GHS 500+. You can buy any amount you need on Topchart.store.',
    },
    {
      question: 'Is it safe to buy airtime online in Ghana?',
      answer: 'Yes, buying airtime online in Ghana on Topchart.store is safe. We use secure payment methods including MTN MoMo, Telecel Cash, and AirtelTigo Money.',
    },
    {
      question: 'How do I buy MTN airtime in Ghana?',
      answer: 'Buy MTN airtime in Ghana on Topchart.store. Enter your MTN phone number, select your airtime amount, and pay via MTN MoMo. Your MTN airtime is credited instantly.',
    },
  ],
})

export const ESIM_FAQ_SCHEMA = generateFAQSchema({
  questions: [
    {
      question: 'How do I buy eSIM in Ghana?',
      answer: 'Buy eSIM in Ghana on Topchart.store. Choose between travel data eSIMs or US virtual numbers, select your plan, and pay. Your eSIM QR code is delivered instantly for activation.',
    },
    {
      question: 'What countries are available for travel eSIM?',
      answer: 'Travel eSIM is available for 50+ countries including US, UK, UAE, Nigeria, Kenya, South Africa, India, and more. Perfect for international travel.',
    },
    {
      question: 'Do I need a physical SIM for eSIM?',
      answer: 'No, eSIM is completely digital. No physical SIM card is needed. Simply scan the QR code and activate your eSIM on your eSIM-compatible device.',
    },
    {
      question: 'How do I get a US virtual number in Ghana?',
      answer: 'Get a US virtual number in Ghana on Topchart.store. Select US virtual number plan, choose duration (30-90 days), and pay. Your US number with voice and SMS is activated instantly.',
    },
  ],
})

export const BILL_PAYMENT_FAQ_SCHEMA = generateFAQSchema({
  questions: [
    {
      question: 'How can I pay my bills online in Ghana?',
      answer: 'Pay bills online in Ghana on Topchart.store. Select your bill type (electricity, TV, water, internet), enter your account number, and pay via MoMo. Payment is processed instantly.',
    },
    {
      question: 'What bill payment services are available in Ghana?',
      answer: 'Bill payment services in Ghana include ECG prepaid and postpaid, DSTV and GOtv subscriptions, Ghana Water (GWCL), MTN Fibre, and Telecel Broadband.',
    },
    {
      question: 'Is bill payment secure in Ghana?',
      answer: 'Yes, bill payment on Topchart.store is secure. We use encrypted payment methods and your account details are protected.',
    },
    {
      question: 'How do I pay DSTV subscription in Ghana?',
      answer: 'Pay DSTV subscription in Ghana on Topchart.store. Enter your DSTV smart card number, select your package (Access, Family, Compact, Premium), and pay via MoMo. Instant activation.',
    },
    {
      question: 'How do I pay ECG bill in Ghana?',
      answer: 'Pay ECG bill in Ghana on Topchart.store. Enter your ECG meter number (prepaid) or account number (postpaid), select amount, and pay via MoMo. Instant processing.',
    },
  ],
})
