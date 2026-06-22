"use client"

import Script from "next/script"

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'About Topchart — Digital Services Platform',
  description: "Learn about Topchart, Ghana's digital services platform for data bundles, airtime, Foreign Numbers, result checkers, gift cards and bill payments.",
  url: 'https://topchart.store/about',
  lastReviewed: new Date().toISOString(),
}

export function WebPageSchema() {
  return (
    <Script
      id="about-webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
    />
  )
}
