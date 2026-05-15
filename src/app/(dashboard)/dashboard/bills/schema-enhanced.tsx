"use client"

import Script from "next/script"

const billsServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Bill Payments Ghana',
  description: 'Pay electricity, DStv, GOtv, water, and internet bills online in Ghana instantly via Topchart.',
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
    name: 'Bill Payment Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Electricity Bill Payment',
          description: 'Pay ECG and electricity bills online in Ghana'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'DStv Subscription',
          description: 'Renew DStv subscription online in Ghana'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'GOtv Subscription',
          description: 'Pay GOtv subscription online in Ghana'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Water Bill Payment',
          description: 'Pay water bills online in Ghana'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Internet Bill Payment',
          description: 'Pay internet bills online in Ghana'
        }
      }
    ]
  },
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'GHS',
    priceRange: '5-5000'
  }
}

export function BillsServiceSchemaEnhanced() {
  return (
    <Script
      id="bills-service-schema-enhanced"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(billsServiceSchema) }}
    />
  )
}
