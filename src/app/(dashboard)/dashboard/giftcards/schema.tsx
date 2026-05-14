"use client"

import Script from "next/script"

const giftCardsServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Digital Gift Cards',
  description: 'Buy Netflix, Amazon, Google Play, Steam, and iTunes gift cards online in Ghana with instant delivery.',
  provider: {
    '@type': 'Organization',
    name: 'Topchart',
    url: 'https://topchart.store'
  },
  areaServed: {
    '@type': 'Country',
    name: 'Ghana'
  },
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'GHS',
    priceRange: '10-500'
  }
}

export function GiftCardsServiceSchema() {
  return (
    <Script
      id="giftcards-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(giftCardsServiceSchema) }}
    />
  )
}
