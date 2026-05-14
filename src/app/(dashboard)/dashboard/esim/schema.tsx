"use client"

import Script from "next/script"

const esimServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Travel eSIM',
  description: 'Buy travel eSIMs for international data coverage worldwide. Stay connected without physical SIM cards.',
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
    priceRange: '50-500'
  }
}

export function EsimServiceSchema() {
  return (
    <Script
      id="esim-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(esimServiceSchema) }}
    />
  )
}
