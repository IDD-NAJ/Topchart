"use client"

import Script from "next/script"

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Frequently Asked Questions | Topchart Ghana',
  description: 'Find answers about data bundles, Foreign Numbers, payments, airtime delivery & reseller services.',
  url: 'https://topchart.store/faq',
  lastReviewed: new Date().toISOString(),
}

export function WebPageSchema() {
  return (
    <Script
      id="faq-webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
    />
  )
}
