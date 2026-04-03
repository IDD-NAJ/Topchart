import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Topchart Ghana — our mission to redefine digital infrastructure in Ghana with lightning-fast airtime and data top-ups for MTN, Telecel, and AirtelTigo.',
  openGraph: {
    title: 'About Topchart Ghana',
    description: 'Our mission is to eliminate friction in purchasing digital services, providing enterprise-grade infrastructure for everyone.',
    url: 'https://topchart.gh/about',
  },
  alternates: {
    canonical: 'https://topchart.gh/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
