import type { Metadata } from 'next'

interface DynamicMetadataOptions {
  title: string
  description: string
  keywords: string[]
  canonical: string
  ogImage?: string
  type?: 'website' | 'article'
}

export function generateDynamicMetadata(options: DynamicMetadataOptions): Metadata {
  const { title, description, keywords, canonical, ogImage, type = 'website' } = options

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export function generateServiceMetadata(
  serviceName: string,
  serviceDescription: string,
  serviceKeywords: string[],
  canonical: string
): Metadata {
  const title = `${serviceName} | Topchart Ghana`
  return generateDynamicMetadata({
    title,
    description: serviceDescription,
    keywords: serviceKeywords,
    canonical,
    type: 'website',
  })
}

export function generateLocationMetadata(
  location: string,
  service: string,
  canonical: string
): Metadata {
  const title = `${service} ${location} | Topchart Ghana`
  const description = `Buy ${service.toLowerCase()} in ${location}, Ghana. Instant delivery via MoMo. Lowest prices guaranteed.`
  const keywords = [
    `${service.toLowerCase()} ${location}`,
    `buy ${service.toLowerCase()} ${location}`,
    `cheap ${service.toLowerCase()} ${location}`,
    `${location} ${service.toLowerCase()}`,
    `instant ${service.toLowerCase()} ${location}`,
  ]

  return generateDynamicMetadata({
    title,
    description,
    keywords,
    canonical,
  })
}
