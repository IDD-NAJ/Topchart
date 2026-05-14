import type { Metadata } from 'next'

interface BlogPostParams {
  slug: string
}

export async function generateMetadata({ params }: { params: BlogPostParams }): Promise<Metadata> {
  const slug = params.slug
  const baseUrl = 'https://topchart.store'

  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const description = 'Cheap data bundle tips, verification guides and Ghana digital service news.'
  const ogImage = '/og-image.png'

  return {
    title: `${title} | Topchart Ghana`,
    description,
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: `${title} | Topchart Ghana`,
      description,
      url: `${baseUrl}/blog/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Topchart Ghana`,
      description,
      images: [ogImage],
    },
  }
}
