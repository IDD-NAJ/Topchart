"use client"

import Script from "next/script"

const billsServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Bill Payments',
  description: 'Pay electricity, DStv, GOtv, water, and internet bills online in Ghana instantly.',
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
    priceRange: '5-5000'
  }
}

export function BillsServiceSchema() {
  return (
    <Script
      id="bills-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(billsServiceSchema) }}
    />
  )
}
