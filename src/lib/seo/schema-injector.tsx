"use client"

import Script from "next/script"

interface SchemaProps {
  schema: Record<string, unknown>
}

export function SchemaInjector({ schema }: SchemaProps) {
  return (
    <Script
      id={`schema-${schema['@type']}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Topchart Ghana',
    description: 'Topchart is Ghana leading digital services marketplace offering cheap data bundles, airtime, Foreign Numbers, eSIM, gift cards, bill payments, and more.',
    url: 'https://topchart.store',
    logo: 'https://topchart.store/logo.svg',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+233509122072',
      contactType: 'customer service',
      areaServed: 'GH',
      availableLanguage: 'en',
    },
    sameAs: [
      'https://twitter.com/topchartgh',
      'https://linkedin.com/company/topchartgh',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressCountry: 'GH',
    },
  }

  return <SchemaInjector schema={schema} />
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Topchart Ghana',
    description: 'Digital services marketplace in Ghana offering data bundles, airtime, Foreign Numbers, eSIM, gift cards, and bill payments.',
    url: 'https://topchart.store',
    telephone: '+233509122072',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Accra',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 5.6037,
      longitude: -0.1870,
    },
    areaServed: [
      { '@type': 'City', name: 'Accra' },
      { '@type': 'City', name: 'Kumasi' },
      { '@type': 'City', name: 'Tema' },
      { '@type': 'City', name: 'Takoradi' },
      { '@type': 'Country', name: 'Ghana' },
    ],
    openingHours: 'Mo-Su 00:00-23:59',
    priceRange: 'GHS 1-500',
  }

  return <SchemaInjector schema={schema} />
}
