"use client"

import Script from "next/script"

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Blog — Cheap Data Tips & Ghana Tech Guides',
  description: 'Read guides about cheap data bundles, OTP verification numbers, internet tricks & digital services in Ghana.',
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
