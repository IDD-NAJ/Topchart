import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Press Kit',
  description: 'Download Topchart Ghana brand assets, logos, and company fact sheets. Media and press inquiries welcome at press@topchart.gh.',
  openGraph: {
    title: 'Press Kit | Topchart Ghana',
    description: 'Official brand assets, logos, and media resources for Topchart Ghana. Contact our PR team for interviews and press inquiries.',
    url: 'https://topchart.gh/press',
  },
  alternates: {
    canonical: 'https://topchart.gh/press',
  },
}

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
