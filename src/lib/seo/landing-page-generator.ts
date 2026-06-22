import { generateDynamicMetadata, generateLocationMetadata } from './dynamic-metadata'
import { generateProductSchema, generateFAQSchema, generateBreadcrumbSchema } from './dynamic-schema'
import { SERVICE_KEYWORDS } from './service-keywords'

interface LandingPageConfig {
  service: string
  location?: string
  network?: string
  platform?: string
  keywords?: string[]
  customTitle?: string
  customDescription?: string
}

export function generateLandingPageMetadata(config: LandingPageConfig) {
  const { service, location, network, platform, keywords, customTitle, customDescription } = config
  
  const baseUrl = 'https://topchart.store'
  const serviceSlug = service.toLowerCase().replace(/\s+/g, '-')
  const locationSlug = location ? location.toLowerCase().replace(/\s+/g, '-') : ''
  const networkSlug = network ? network.toLowerCase().replace(/\s+/g, '-') : ''
  const platformSlug = platform ? platform.toLowerCase().replace(/\s+/g, '-') : ''
  
  const path = [locationSlug, networkSlug, platformSlug, serviceSlug].filter(Boolean).join('-')
  const canonical = `${baseUrl}/${path}`
  
  let title = customTitle
  let description = customDescription
  let pageKeywords = keywords || []
  
  if (!title) {
    if (location && network) {
      title = `${network} ${service} ${location} | Topchart Ghana`
    } else if (location) {
      title = `${service} ${location} | Topchart Ghana`
    } else if (network) {
      title = `${network} ${service} Ghana | Topchart Ghana`
    } else {
      title = `${service} Ghana | Topchart Ghana`
    }
  }
  
  if (!description) {
    description = `Buy ${service.toLowerCase()}${location ? ` in ${location}` : ''}${network ? ` on ${network}` : ''} in Ghana. Instant delivery via MoMo. Lowest prices guaranteed.`
  }
  
  if (pageKeywords.length === 0) {
    const serviceData = SERVICE_KEYWORDS[service as keyof typeof SERVICE_KEYWORDS]
    if (typeof serviceData === 'object' && 'primary' in serviceData) {
      pageKeywords = [...serviceData.primary, ...serviceData.secondary]
    }
    if (location) {
      pageKeywords = pageKeywords.map(k => k.replace('Ghana', location))
    }
  }
  
  return generateDynamicMetadata({
    title,
    description,
    keywords: pageKeywords,
    canonical,
  })
}

export function generateLandingPageSchema(config: LandingPageConfig) {
  const { service, location } = config
  
  const faqs = generateServiceFAQs(service, location)
  
  return {
    product: generateProductSchema({
      name: `${service} Ghana`,
      description: `Buy ${service.toLowerCase()} in Ghana. Instant delivery via MoMo.`,
      brand: 'Topchart Ghana',
      offers: [],
    }),
    faq: generateFAQSchema({ questions: faqs }),
    breadcrumb: generateBreadcrumbSchema([
      { name: 'Home', url: 'https://topchart.store' },
      { name: service, url: `https://topchart.store/${service.toLowerCase().replace(/\s+/g, '-')}` },
    ]),
  }
}

function generateServiceFAQs(service: string, location?: string): Array<{ question: string; answer: string }> {
  const locationText = location ? ` in ${location}` : ''
  
  const faqs: Record<string, Array<{ question: string; answer: string }>> = {
    data: [
      {
        question: `How can I buy cheap data bundles${locationText}?`,
        answer: `You can buy cheap data bundles${locationText} on Topchart.store. Simply select your network (MTN, Telecel, or AirtelTigo), choose your preferred data plan, and pay via MTN MoMo, Telecel Cash, or AirtelTigo Money. Your data bundle is delivered instantly.`,
      },
      {
        question: `What are the cheapest data bundles${locationText}?`,
        answer: `The cheapest data bundles${locationText} start from GHS 1 for 50MB daily bundles. Weekly bundles start from GHS 5, and monthly bundles from GHS 20. Topchart offers the lowest prices in Ghana.`,
      },
      {
        question: `Do you offer non-expiry data bundles${locationText}?`,
        answer: `Yes, Topchart offers non-expiry data bundles${locationText} on MTN, Telecel, and AirtelTigo. These bundles do not expire until you use them completely.`,
      },
    ],
    verification: [
      {
        question: `How do I buy Foreign Numbers${locationText}?`,
        answer: `Buy Foreign Numbers${locationText} on Topchart.store. Select your preferred platform (WhatsApp, Telegram, Facebook, etc.), choose duration (1 hour to 30 days), and pay via MoMo. Your number is delivered instantly.`,
      },
      {
        question: `Are your Foreign Numbers${locationText} private and secure?`,
        answer: `Yes, all Foreign Numbers${locationText} are private and secure. Numbers are disposable and not shared with third parties. Your privacy is protected.`,
      },
      {
        question: `What platforms can I verify${locationText}?`,
        answer: `You can verify 100+ platforms${locationText} including WhatsApp, Telegram, Facebook, Instagram, Google, Microsoft, PayPal, Stripe, Netflix, Spotify, and many more.`,
      },
    ],
    airtime: [
      {
        question: `How can I buy airtime online${locationText}?`,
        answer: `Buy airtime online${locationText} on Topchart.store. Enter your phone number, select your network (MTN, Telecel, AirtelTigo), choose amount, and pay via MoMo. Airtime is credited instantly.`,
      },
      {
        question: `What are the airtime denominations available${locationText}?`,
        answer: `Airtime denominations${locationText} range from GHS 1 to GHS 500+. You can buy any amount you need on Topchart.store.`,
      },
      {
        question: `Is it safe to buy airtime online${locationText}?`,
        answer: `Yes, buying airtime online${locationText} on Topchart.store is safe. We use secure payment methods including MTN MoMo, Telecel Cash, and AirtelTigo Money.`,
      },
    ],
    resultCheckers: [
      {
        question: `How can I buy WAEC result checker${locationText}?`,
        answer: `Buy WAEC result checker${locationText} on Topchart.store. Select your exam type (WAEC, BECE, NOVDEC), pay via MoMo, and receive your PIN and serial number instantly.`,
      },
      {
        question: `Are your WAEC checkers valid${locationText}?`,
        answer: `Yes, all WAEC checkers${locationText} on Topchart.store are valid and verified directly from WAEC. You can use them to check your results immediately.`,
      },
      {
        question: `Do you offer wholesale prices for resellers${locationText}?`,
        answer: `Yes, resellers get wholesale prices on result checkers${locationText}. Join our reseller programme to earn commissions on every sale.`,
      },
    ],
    esim: [
      {
        question: `How do I buy eSIM${locationText}?`,
        answer: `Buy eSIM${locationText} on Topchart.store. Choose between travel data eSIMs or US virtual numbers, select your plan, and pay. Your eSIM QR code is delivered instantly for activation.`,
      },
      {
        question: `What countries are available for travel eSIM${locationText}?`,
        answer: `Travel eSIM${locationText} is available for 50+ countries including US, UK, UAE, Nigeria, Kenya, South Africa, India, and more. Perfect for international travel.`,
      },
      {
        question: `Do I need a physical SIM for eSIM${locationText}?`,
        answer: `No, eSIM${locationText} is completely digital. No physical SIM card is needed. Simply scan the QR code and activate your eSIM on your eSIM-compatible device.`,
      },
    ],
    bills: [
      {
        question: `How can I pay my bills online${locationText}?`,
        answer: `Pay bills online${locationText} on Topchart.store. Select your bill type (electricity, TV, water, internet), enter your account number, and pay via MoMo. Payment is processed instantly.`,
      },
      {
        question: `What bill payment services are available${locationText}?`,
        answer: `Bill payment services${locationText} include ECG prepaid and postpaid, DSTV and GOtv subscriptions, Ghana Water (GWCL), MTN Fibre, and Telecel Broadband.`,
      },
      {
        question: `Is bill payment secure${locationText}?`,
        answer: `Yes, bill payment${locationText} on Topchart.store is secure. We use encrypted payment methods and your account details are protected.`,
      },
    ],
  }
  
  return faqs[service] || []
}
