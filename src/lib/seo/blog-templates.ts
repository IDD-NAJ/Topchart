import type { Metadata } from 'next'

interface BlogPostMetadata {
  title: string
  description: string
  keywords: string[]
  category: string
  publishedTime: string
  modifiedTime?: string
  author: string
  image?: string
}

export function generateBlogMetadata(metadata: BlogPostMetadata): Metadata {
  const { title, description, keywords, category, publishedTime, modifiedTime, author, image } = metadata

  return {
    title,
    description,
    keywords,
    authors: [{ name: author }],
    publisher: {
      name: 'Topchart Ghana',
      logo: {
        url: 'https://topchart.store/logo.svg',
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [{ name: author }],
      siteName: 'Topchart Ghana',
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export const BLOG_CATEGORIES = {
  dataBundles: {
    name: 'Data Bundles',
    slug: 'data-bundles',
    description: 'Everything about data bundles in Ghana - MTN, Telecel, AirtelTigo plans, prices, and tips.',
  },
  verificationNumbers: {
    name: 'Foreign Numbers',
    slug: 'verification-numbers',
    description: 'SMS Foreign Numbers, OTP numbers, virtual numbers for WhatsApp, Telegram, Facebook, and more.',
  },
  resultCheckers: {
    name: 'Result Checkers',
    slug: 'result-checkers',
    description: 'WAEC, BECE, NOVDEC result checker guides and tips for Ghana students.',
  },
  billPayments: {
    name: 'Bill Payments',
    slug: 'bill-payments',
    description: 'How to pay bills online in Ghana - ECG, DSTV, GOtv, water, internet payment guides.',
  },
  giftCards: {
    name: 'Gift Cards',
    slug: 'gift-cards',
    description: 'Digital gift cards guide - Netflix, Spotify, Amazon, Google Play, iTunes, Steam, and more.',
  },
  proxies: {
    name: 'Proxies',
    slug: 'proxies',
    description: 'Residential, mobile, and datacenter proxies guide for Ghana users.',
  },
  reseller: {
    name: 'Reseller',
    slug: 'reseller',
    description: 'How to become a data reseller in Ghana, reseller platform guides, and business tips.',
  },
} as const

export const BLOG_POST_TEMPLATES = {
  dataBundles: {
    title: '{topic} Data Bundles Ghana: Complete {year} Guide',
    description: 'Discover the best {topic} data bundles in Ghana. Complete price guide, how to buy, tips, and everything you need to know.',
    keywords: ['{topic} data bundles Ghana', 'buy {topic} data online', 'cheap {topic} bundles', '{topic} internet Ghana'],
  },
  verificationNumbers: {
    title: '{platform} Foreign Number Ghana: Complete Guide',
    description: 'Learn how to get {platform} Foreign Numbers in Ghana. Step-by-step guide, prices, tips, and everything you need to know.',
    keywords: ['{platform} Foreign Number', 'buy {platform} number Ghana', 'cheap {platform} OTP', 'virtual {platform} number'],
  },
  resultCheckers: {
    title: '{exam} Result Checker Ghana: Complete {year} Guide',
    description: 'Everything about {exam} result checker in Ghana. How to buy, prices, how to check results, and step-by-step guide.',
    keywords: ['{exam} result checker Ghana', 'buy {exam} checker', '{exam} PIN Ghana', 'check {exam} results online'],
  },
  billPayments: {
    title: '{service} Payment Ghana: Complete Guide',
    description: 'How to pay {service} bill online in Ghana. Step-by-step guide, prices, payment methods, and tips.',
    keywords: ['{service} payment Ghana', 'pay {service} online', 'cheap {service} bill', '{service} bill payment'],
  },
  giftCards: {
    title: '{brand} Gift Card Ghana: Complete {year} Guide',
    description: 'How to buy and use {brand} gift cards in Ghana. Prices, where to buy, how to redeem, and tips.',
    keywords: ['{brand} gift card Ghana', 'buy {brand} gift card', 'cheap {brand} voucher', '{brand} gift card deals'],
  },
  proxies: {
    title: '{type} Proxies Ghana: Complete Guide',
    description: 'Everything about {type} proxies in Ghana. How to buy, prices, use cases, and step-by-step guide.',
    keywords: ['{type} proxies Ghana', 'buy {type} proxies', 'Ghana proxy service', 'cheap {type} proxies'],
  },
  reseller: {
    title: 'Data Reseller Ghana: {topic} Complete Guide',
    description: 'Complete guide to {topic} for data resellers in Ghana. How to start, pricing, tips, and step-by-step process.',
    keywords: ['data reseller Ghana', 'become data reseller', 'make money selling data', 'reseller platform Ghana'],
  },
}
