"use client"

import Script from "next/script"

interface ArticleSchemaProps {
  title?: string
  description?: string
  datePublished?: string
  dateModified?: string
  slug?: string
}

export function ArticleSchema({ title, description, datePublished, dateModified, slug }: ArticleSchemaProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title || 'Topchart Blog Post',
    description: description || 'Cheap data bundle tips, verification guides and Ghana digital service news.',
    author: {
      '@type': 'Organization',
      name: 'Topchart Ghana',
      url: 'https://topchart.store',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Topchart Ghana',
      url: 'https://topchart.store',
      logo: {
        '@type': 'ImageObject',
        url: 'https://topchart.store/logo.svg',
      },
    },
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    url: slug ? `https://topchart.store/blog/${slug}` : 'https://topchart.store/blog',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': slug ? `https://topchart.store/blog/${slug}` : 'https://topchart.store/blog',
    },
  }

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  )
}
