"use client"

import Script from "next/script"

const resultCheckerServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'WAEC and BECE Result Checker Cards',
  description: 'Buy WAEC, BECE, and NOVDEC result checker vouchers online in Ghana. Check your exam results instantly.',
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
    priceRange: '10-50'
  }
}

export function ResultCheckerServiceSchema() {
  return (
    <Script
      id="result-checker-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(resultCheckerServiceSchema) }}
    />
  )
}
