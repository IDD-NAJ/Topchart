"use client"

import Script from "next/script"

interface SchemaProps {
  schema: Record<string, any>
  id?: string
}

export function SEOJsonLd({ schema, id }: SchemaProps) {
  return (
    <Script
      id={id || 'seo-schema'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
