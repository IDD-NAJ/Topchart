"use client"

import Script from "next/script"

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Topchart Proxy Services',
  description: 'High-quality residential, mobile, and datacenter proxies in Ghana for SEO, scraping, and privacy.',
  brand: {
    '@type': 'Brand',
    name: 'Topchart Ghana',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Residential Proxies',
      description: 'Real residential IPs — hardest to detect',
      price: '2.00',
      priceCurrency: 'GHS',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Mobile Proxies',
      description: 'Mobile carrier IPs — ideal for social/mobile',
      price: '3.00',
      priceCurrency: 'GHS',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Datacenter Proxies',
      description: 'Fast datacenter IPs — best for high volume',
      price: '1.00',
      priceCurrency: 'GHS',
      availability: 'https://schema.org/InStock',
    },
  ],
}

export function ProxySchema() {
  return (
    <Script
      id="proxy-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  )
}
