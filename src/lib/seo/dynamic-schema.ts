interface ProductSchema {
  name: string
  description: string
  brand: string
  offers: Array<{
    name: string
    description: string
    price: string
    priceCurrency: string
    availability?: string
  }>
}

interface ServiceSchema {
  name: string
  description: string
  provider: string
  areaServed?: string[]
}

interface FAQSchema {
  questions: Array<{
    question: string
    answer: string
  }>
}

export function generateProductSchema(data: ProductSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    brand: {
      '@type': 'Brand',
      name: data.brand,
    },
    offers: data.offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: offer.availability || 'https://schema.org/InStock',
    })),
  }
}

export function generateServiceSchema(data: ServiceSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'Organization',
      name: data.provider,
    },
    areaServed: data.areaServed?.map((area) => ({
      '@type': 'City',
      name: area,
    })),
  }
}

export function generateFAQSchema(data: FAQSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.questions.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
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
