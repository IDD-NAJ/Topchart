import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Topchart  Privacy Policy. Learn how we collect, use, and protect your personal information when you use our airtime and data top-up services.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Topchart ',
    description: 'How Topchart  collects, uses, and safeguards your personal information.',
    url: 'https://topchart.store/privacy',
  },
  alternates: {
    canonical: 'https://topchart.store/privacy',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
