import type { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords: string[]
  canonical: string
  openGraph?: {
    title?: string
    description?: string
    images?: string[]
  }
  noindex?: boolean
}

interface SchemaConfig {
  type: 'Service' | 'Product' | 'Organization' | 'LocalBusiness' | 'Article' | 'FAQPage'
  name: string
  description: string
  provider?: string
  areaServed?: string | string[]
  priceRange?: string
  priceCurrency?: string
  additionalData?: Record<string, any>
}

export function generateMetadata(config: SEOConfig): Metadata {
  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical: config.canonical,
    },
    openGraph: {
      title: config.openGraph?.title || config.title,
      description: config.openGraph?.description || config.description,
      url: config.canonical,
      siteName: 'Topchart Ghana',
      locale: 'en_GH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.openGraph?.title || config.title,
      description: config.openGraph?.description || config.description,
    },
    robots: {
      index: !config.noindex,
      follow: !config.noindex,
    },
  }

  if (config.openGraph?.images && config.openGraph.images.length > 0) {
    metadata.openGraph!.images = config.openGraph.images.map((img) => ({
      url: img,
      width: 1200,
      height: 630,
      alt: config.title,
    }))
    metadata.twitter!.images = config.openGraph.images
  }

  return metadata
}

export function generateSchema(config: SchemaConfig): Record<string, any> {
  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': config.type,
    name: config.name,
    description: config.description,
  }

  if (config.provider) {
    baseSchema.provider = {
      '@type': 'Organization',
      name: config.provider,
      url: 'https://topchart.store',
    }
  }

  if (config.areaServed) {
    if (Array.isArray(config.areaServed)) {
      baseSchema.areaServed = config.areaServed.map((area) => ({
        '@type': 'Country',
        name: area,
      }))
    } else {
      baseSchema.areaServed = {
        '@type': 'Country',
        name: config.areaServed,
      }
    }
  }

  if (config.priceRange && config.priceCurrency) {
    baseSchema.offers = {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: config.priceCurrency,
      priceRange: config.priceRange,
    }
  }

  return { ...baseSchema, ...config.additionalData }
}

export function generateBreadcrumbs(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateProductSchema(config: {
  name: string
  description: string
  price: string
  priceCurrency: string
  availability?: string
  brand?: string
  category?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.description,
    brand: {
      '@type': 'Brand',
      name: config.brand || 'Topchart Ghana',
    },
    category: config.category,
    offers: {
      '@type': 'Offer',
      price: config.price,
      priceCurrency: config.priceCurrency,
      availability: config.availability || 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Topchart Ghana',
        url: 'https://topchart.store',
      },
    },
  }
}
