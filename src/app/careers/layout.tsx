import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Topchart team in Accra, . We are building the financial infrastructure for the next generation of ian businesses. View open positions.',
  openGraph: {
    title: 'Careers at Topchart ',
    description: 'Help us build the financial infrastructure for the next generation of ian businesses. View open engineering, design and operations roles.',
    url: 'https://topchart.store/careers',
  },
  alternates: {
    canonical: 'https://topchart.store/careers',
  },
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
