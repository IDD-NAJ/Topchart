"use client"

import Script from "next/script"

const proxiesServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Proxy Services Ghana',
  description: 'Buy secure residential, mobile and datacenter proxies in Ghana. IP rotation, sticky sessions, multi-country support via 9Proxy.',
  provider: {
    '@type': 'Organization',
    name: 'Topchart Ghana',
    url: 'https://topchart.store'
  },
  areaServed: [
    {
      '@type': 'Country',
      name: 'Ghana'
    },
    {
      '@type': 'Country',
      name: 'Nigeria'
    },
    {
      '@type': 'Country',
      name: 'Kenya'
    },
    {
      '@type': 'Country',
      name: 'South Africa'
    },
    {
      '@type': 'Country',
      name: 'United States'
    },
    {
      '@type': 'Country',
      name: 'United Kingdom'
    },
    {
      '@type': 'Country',
      name: 'Germany'
    },
    {
      '@type': 'Country',
      name: 'France'
    },
    {
      '@type': 'Country',
      name: 'UAE'
    },
    {
      '@type': 'Country',
      name: 'India'
    },
  ],
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'GHS',
    priceRange: '10-500'
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Proxy Types',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Residential Proxies',
          description: 'IP rotates on each request for maximum anonymity'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Mobile Proxies',
          description: 'Mobile IP addresses for mobile-specific targeting'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Datacenter Proxies',
          description: 'High-speed datacenter IPs for performance'
        }
      }
    ]
  }
}

export function ProxiesServiceSchema() {
  return (
    <Script
      id="proxies-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(proxiesServiceSchema) }}
    />
  )
}
