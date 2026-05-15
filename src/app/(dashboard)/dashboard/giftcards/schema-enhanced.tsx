"use client"

import Script from "next/script"

const giftCardsServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Digital Gift Cards Ghana',
  description: 'Buy Netflix, Amazon, Google Play, Steam, and iTunes gift cards online in Ghana with instant delivery.',
  provider: {
    '@type': 'Organization',
    name: 'Topchart Ghana',
    url: 'https://topchart.store'
  },
  areaServed: {
    '@type': 'Country',
    name: 'Ghana'
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Gift Card Categories',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Entertainment Gift Cards',
          description: 'Netflix, Spotify, and entertainment gift cards'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Shopping Gift Cards',
          description: 'Amazon, Jumia, and shopping gift cards'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Gaming Gift Cards',
          description: 'Steam, PlayStation, Xbox, and gaming gift cards'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Lifestyle Gift Cards',
          description: 'Google Play, iTunes, and lifestyle gift cards'
        }
      }
    ]
  },
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'GHS',
    priceRange: '10-500'
  }
}

export function GiftCardsServiceSchemaEnhanced() {
  return (
    <Script
      id="giftcards-service-schema-enhanced"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(giftCardsServiceSchema) }}
    />
  )
}
