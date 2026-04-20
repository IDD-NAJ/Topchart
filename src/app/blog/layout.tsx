import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog & Updates',
  description: 'Read the latest news, product updates, security guides, and company announcements from the Topchart  team.',
  openGraph: {
    title: 'Topchart Blog & Updates',
    description: 'Stay up to date with the latest from Topchart — new data bundles, security tips, and company milestones.',
    url: 'https://topchart.gh/blog',
  },
  alternates: {
    canonical: 'https://topchart.gh/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
