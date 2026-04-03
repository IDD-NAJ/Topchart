import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Topchart Ghana Privacy Policy. Learn how we collect, use, and protect your personal information when you use our airtime and data top-up services.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Topchart Ghana',
    description: 'How Topchart Ghana collects, uses, and safeguards your personal information.',
    url: 'https://topchart.gh/privacy',
  },
  alternates: {
    canonical: 'https://topchart.gh/privacy',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
