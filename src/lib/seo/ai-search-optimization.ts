export const AI_SEARCH_GUIDELINES = {
  structure: {
    useClearHeadings: true,
    conciseSummaries: true,
    faqSections: true,
    stepByStepGuides: true,
    comparisonTables: true,
    prosConsLists: true,
  },
  content: {
    directAnswers: true,
    conversationalTone: true,
    avoidJargon: true,
    useExamples: true,
    includeData: true,
    citeSources: true,
  },
  formatting: {
    useBullets: true,
    useNumberedLists: true,
    useBoldKeyTerms: true,
    useShortParagraphs: true,
    useBlockquotes: true,
  },
  schema: {
    faqSchema: true,
    articleSchema: true,
    howToSchema: true,
    breadcrumbSchema: true,
  },
}

export function generateAIOptimizedContent(topic: string, service: string): {
  summary: string
  faqs: Array<{ question: string; answer: string }>
  keyPoints: string[]
} {
  const summaries: Record<string, string> = {
    dataBundles: `Buy cheap data bundles in Ghana on Topchart.store. MTN, Telecel, and AirtelTigo data bundles available at lowest prices. Instant delivery via MoMo. Daily, weekly, monthly, and non-expiry bundles.`,
    verificationNumbers: `Get SMS Foreign Numbers in Ghana for WhatsApp, Telegram, Facebook, Google, and 100+ platforms. Cheap OTP numbers, instant delivery, private and secure.`,
    resultCheckers: `Buy WAEC, BECE, and NOVDEC result checkers in Ghana. Instant PIN delivery via MoMo. Valid checkers, wholesale prices for resellers.`,
    billPayments: `Pay bills online in Ghana. ECG electricity, DSTV and GOtv TV subscriptions, Ghana Water, MTN Fibre, and Telecel Broadband payments via MoMo.`,
    giftCards: `Buy digital gift cards in Ghana. Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, Airbnb gift cards available.`,
    proxies: `Buy residential, mobile, and datacenter proxies in Ghana. Secure, fast, and reliable proxy services for SEO, scraping, and privacy.`,
    reseller: `Become a data reseller in Ghana. Join Topchart reseller programme with white-label platform, automated delivery, wholesale prices, and daily commissions.`,
  }

  const faqs: Record<string, Array<{ question: string; answer: string }>> = {
    dataBundles: [
      {
        question: `What are the cheapest data bundles in Ghana?`,
        answer: `The cheapest data bundles in Ghana start from GHS 1 for 50MB daily bundles on MTN, Telecel, and AirtelTigo. Weekly bundles start from GHS 5, and monthly bundles from GHS 20. Topchart offers the lowest prices in Ghana with instant delivery via MoMo.`,
      },
      {
        question: `How do I buy data bundles online in Ghana?`,
        answer: `To buy data bundles online in Ghana, visit Topchart.store, select your network (MTN, Telecel, or AirtelTigo), choose your data plan, enter your phone number, and pay via MTN MoMo, Telecel Cash, or AirtelTigo Money. Your data bundle is delivered instantly.`,
      },
      {
        question: `Do you offer non-expiry data bundles in Ghana?`,
        answer: `Yes, Topchart offers non-expiry data bundles in Ghana on MTN, Telecel, and AirtelTigo. These bundles do not expire until you use them completely, making them perfect for long-term storage.`,
      },
    ],
    verificationNumbers: [
      {
        question: `How do I get a WhatsApp Foreign Number in Ghana?`,
        answer: `Get a WhatsApp Foreign Number in Ghana on Topchart.store. Select WhatsApp from the platform list, choose your preferred duration (1 hour to 30 days), and pay via MoMo. Your WhatsApp number is delivered instantly with SMS receive capability.`,
      },
      {
        question: `Are Foreign Numbers in Ghana private and secure?`,
        answer: `Yes, all Foreign Numbers on Topchart.store are private and secure. Numbers are disposable and not shared with third parties. Your privacy is protected, and numbers are automatically deleted after the rental period.`,
      },
      {
        question: `What platforms can I verify with Ghana numbers?`,
        answer: `You can verify 100+ platforms with Ghana numbers including WhatsApp, Telegram, Facebook, Instagram, Google, Microsoft, PayPal, Stripe, Netflix, Spotify, Amazon, and many more. Check the platform list on Topchart.store for full availability.`,
      },
    ],
    resultCheckers: [
      {
        question: `How do I buy WAEC result checker in Ghana?`,
        answer: `Buy WAEC result checker in Ghana on Topchart.store. Select WAEC from the exam types, choose your checker type (WASSCE, BECE, or NOVDEC), pay via MoMo, and receive your PIN and serial number instantly.`,
      },
      {
        question: `Are WAEC checkers in Ghana valid?`,
        answer: `Yes, all WAEC checkers on Topchart.store are valid and verified directly from WAEC. You can use them immediately to check your results on the WAEC portal. Resellers get wholesale prices.`,
      },
      {
        question: `How much do result checkers cost in Ghana?`,
        answer: `Result checker prices in Ghana vary by exam type. BECE checkers start from GHS 10, WASSCE from GHS 15, and NOVDEC from GHS 20. Resellers get wholesale prices on bulk purchases.`,
      },
    ],
    billPayments: [
      {
        question: `How do I pay DSTV subscription in Ghana?`,
        answer: `Pay DSTV subscription in Ghana on Topchart.store. Enter your DSTV smart card number, select your package (Access, Family, Compact, Premium), choose duration, and pay via MoMo. Your subscription is activated instantly.`,
      },
      {
        question: `How do I pay ECG bill online in Ghana?`,
        answer: `Pay ECG bill online in Ghana on Topchart.store. Select ECG prepaid or postpaid, enter your meter number or account number, choose amount, and pay via MoMo. Your payment is processed instantly.`,
      },
      {
        question: `What bill payment services are available in Ghana?`,
        answer: `Bill payment services in Ghana include ECG electricity (prepaid and postpaid), DSTV and GOtv TV subscriptions, Ghana Water (GWCL), MTN Fibre, and Telecel Broadband internet payments.`,
      },
    ],
    giftCards: [
      {
        question: `How do I buy Netflix gift card in Ghana?`,
        answer: `Buy Netflix gift card in Ghana on Topchart.store. Select Netflix from gift card brands, choose your denomination (GHS 30, 50, 100), pay via MoMo or card, and receive your gift card code instantly via email.`,
      },
      {
        question: `What gift cards are available in Ghana?`,
        answer: `Gift cards available in Ghana on Topchart.store include Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, and Airbnb gift cards. All delivered instantly via email.`,
      },
      {
        question: `Are gift cards in Ghana valid?`,
        answer: `Yes, all gift cards on Topchart.store are valid and work globally. You can use them for subscriptions, purchases, and gifting. Check each brand for regional restrictions.`,
      },
    ],
    proxies: [
      {
        question: `How do I buy residential proxies in Ghana?`,
        answer: `Buy residential proxies in Ghana on Topchart.store. Select residential proxy type, choose your target country and city, select duration, and pay. Your proxy credentials are delivered instantly.`,
      },
      {
        question: `What types of proxies are available in Ghana?`,
        answer: `Proxy types available in Ghana include residential proxies (real IPs, hardest to detect), mobile proxies (mobile carrier IPs), and datacenter proxies (fast, high volume). Prices start from GHS 1-3 per port.`,
      },
      {
        question: `Are proxies in Ghana secure and private?`,
        answer: `Yes, proxies on Topchart.store are secure and private. We use encrypted connections and do not log your activities. Perfect for SEO, scraping, and privacy protection.`,
      },
    ],
    reseller: [
      {
        question: `How do I become a data reseller in Ghana?`,
        answer: `Become a data reseller in Ghana by joining the Topchart reseller programme. Sign up for free, fund your wallet, set your prices, and start selling. You get wholesale prices and earn commissions on every sale.`,
      },
      {
        question: `How much can I earn as a data reseller in Ghana?`,
        answer: `As a data reseller in Ghana with Topchart, you can earn daily commissions on every sale. Set your own markup and profit margins. Top resellers earn over GHS 1,000+ monthly selling data bundles.`,
      },
      {
        question: `What services can I resell in Ghana?`,
        answer: `As a Topchart reseller in Ghana, you can resell data bundles, airtime, Foreign Numbers, eSIM, gift cards, bill payments, and more. All services delivered automatically to your customers.`,
      },
    ],
  }

  const keyPoints: Record<string, string[]> = {
    dataBundles: [
      'Cheapest data bundles in Ghana starting from GHS 1',
      'MTN, Telecel, and AirtelTigo networks supported',
      'Instant delivery via MTN MoMo, Telecel Cash, AirtelTigo Money',
      'Daily, weekly, monthly, and non-expiry bundles available',
      '24/7 service, no extra fees',
    ],
    verificationNumbers: [
      'SMS Foreign Numbers for 100+ platforms',
      'WhatsApp, Telegram, Facebook, Google verification',
      'Cheap prices starting from GHS 2',
      'Instant delivery, private and secure',
      'Rentals from 1 hour to 30 days',
    ],
    airtime: [
      'Buy airtime online for MTN, Telecel, AirtelTigo',
      'Instant credit to your phone',
      'Amounts from GHS 1 to GHS 500+',
      'Pay via MoMo, cheapest rates',
      '24/7 service available',
    ],
    resultCheckers: [
      'WAEC, BECE, NOVDEC result checkers',
      'Instant PIN and serial number delivery',
      'Valid checkers from WAEC',
      'Wholesale prices for resellers',
      'Pay via MoMo, instant processing',
    ],
    esim: [
      'Digital SIM cards for 50+ countries',
      'US virtual numbers with voice and SMS',
      'Travel data eSIMs for international use',
      'QR code activation, no physical SIM needed',
      'Instant delivery via email',
    ],
    billPayments: [
      'ECG electricity (prepaid and postpaid)',
      'DSTV and GOtv TV subscriptions',
      'Ghana Water (GWCL) payments',
      'MTN Fibre and Telecel Broadband',
      'Instant payment via MoMo',
    ],
    giftCards: [
      'Netflix, Spotify, Amazon gift cards',
      'Google Play, iTunes, Steam gift cards',
      'PlayStation, Xbox, Uber, Airbnb gift cards',
      'Instant delivery via email',
      'Valid globally',
    ],
    proxies: [
      'Residential, mobile, datacenter proxies',
      'Prices from GHS 1-3 per port',
      'Secure and private connections',
      'Perfect for SEO, scraping, privacy',
      'Instant setup and delivery',
    ],
    reseller: [
      'Join Topchart reseller programme for free',
      'Get wholesale prices on all services',
      'Set your own prices and profit margins',
      'Automated delivery to customers',
      'Earn daily commissions',
    ],
  }

  return {
    summary: summaries[service] || '',
    faqs: faqs[service] || [],
    keyPoints: keyPoints[service] || [],
  }
}
