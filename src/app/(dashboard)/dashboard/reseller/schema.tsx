"use client"

import Script from "next/script"

const resellerServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Reseller Programme',
  description: 'Join Topchart\'s reseller programme to earn commissions selling data bundles, airtime, and verification numbers under your own brand.',
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
    priceCurrency: 'GHS'
  }
}

export function ResellerServiceSchema() {
  return (
    <Script
      id="reseller-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(resellerServiceSchema) }}
    />
  )
}
