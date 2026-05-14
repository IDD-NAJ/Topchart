"use client"

import Script from "next/script"

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://topchart.store',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'About',
      item: 'https://topchart.store/about',
    },
  ],
}

export function BreadcrumbSchema() {
  return (
    <Script
      id="about-breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  )
}
