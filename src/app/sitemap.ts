import type { MetadataRoute } from 'next'

// The Keyword Matrix from SEO Strategy Part 2
const primaryKeywords = [
  'buy-airtime-online-ghana',
  'instant-airtime-top-up-ghana',
  'cheap-mobile-data-ghana',
  'buy-mtn-data-bundle-online-ghana',
  'vodafone-airtime-recharge-ghana',
  'airtel-tigo-data-bundle-ghana',
  'fast-data-bundle-purchase-ghana',
  'buy-usa-phone-number-online',
  'virtual-phone-number-for-verification',
  'buy-residential-proxies-africa',
  'cheap-rotating-proxies-usa',
  'buy-amazon-gift-card-usa',
  'pay-electricity-bill-online-ghana',
  'dstv-subscription-payment-online-ghana'
]

const modifiers = ['instant', 'cheap', 'fast', 'secure']

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://topchart.gh'
  const now = new Date()

  // Standard Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date('2026-01-18'), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date('2026-01-18'), changeFrequency: 'yearly', priority: 0.4 },
  ]

  // Programmatic Routes Generation
  const programmaticRoutes: MetadataRoute.Sitemap = []
  
  for (const keyword of primaryKeywords) {
    programmaticRoutes.push({
      url: `${baseUrl}/${keyword}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    })
    // Add variations with modifiers
    for (const mod of modifiers) {
      programmaticRoutes.push({
        url: `${baseUrl}/${mod}-${keyword}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  // Cap sitemap output if > 50k normally, here we return combined array safely (Next.js handles up to 50k in one JSON file)
  return [...staticRoutes, ...programmaticRoutes]
}
