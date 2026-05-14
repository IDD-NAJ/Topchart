"use client"

import Script from "next/script"

const dataServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Data Bundles Purchase',
  description: 'Buy cheap MTN, Telecel, and AirtelTigo data bundles online in Ghana with instant delivery.',
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
    priceRange: '1-500'
  }
}

export function DataServiceSchema() {
  return (
    <Script
      id="data-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dataServiceSchema) }}
    />
  )
}
