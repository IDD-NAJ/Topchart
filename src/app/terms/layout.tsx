import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Topchart  Terms of Service. Understand the rules, regulations, and conditions for using our airtime and data top-up platform.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Service | Topchart ',
    description: 'Terms and conditions for using Topchart \'s airtime and data top-up services.',
    url: 'https://topchart.store/terms',
  },
  alternates: {
    canonical: 'https://topchart.store/terms',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
