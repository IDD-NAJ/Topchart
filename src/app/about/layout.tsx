import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Topchart  — our mission to redefine digital infrastructure in  with lightning-fast airtime and data top-ups for MTN, Telecel, and AirtelTigo.',
  openGraph: {
    title: 'About Topchart ',
    description: 'Our mission is to eliminate friction in purchasing digital services, providing enterprise-grade infrastructure for everyone.',
    url: 'https://topchart.store/about',
  },
  alternates: {
    canonical: 'https://topchart.store/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
