import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Topchart team in Accra, Ghana. We are building the financial infrastructure for the next generation of Ghanaian businesses. View open positions.',
  openGraph: {
    title: 'Careers at Topchart Ghana',
    description: 'Help us build the financial infrastructure for the next generation of Ghanaian businesses. View open engineering, design and operations roles.',
    url: 'https://topchart.gh/careers',
  },
  alternates: {
    canonical: 'https://topchart.gh/careers',
  },
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
