"use client"

import Script from "next/script"

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Topchart Blog — Cheap Data Bundles Ghana, MTN Tips & Tech Guides',
  description: 'Read guides about cheap data bundles in Ghana, MTN tricks, OTP Foreign Numbers, internet tips, and digital services. Stay updated with the latest Ghana tech news.',
  url: 'https://topchart.store/blog',
  lastReviewed: new Date().toISOString(),
}

export function WebPageSchema() {
  return (
    <Script
      id="blog-webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
    />
  )
}
