import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description: 'Everything you need to know about buying airtime and data on Topchart . Delivery speed, supported payment methods, refunds, supported networks, and more.',
  openGraph: {
    title: 'FAQ | Topchart ',
    description: 'Answers to the most common questions about Topchart — delivery time, payments, security, supported networks, and refunds.',
    url: 'https://topchart.store/faq',
  },
  alternates: {
    canonical: 'https://topchart.store/faq',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How fast is airtime delivery on Topchart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most transactions are completed within 5 seconds. In rare cases of network delays, it may take up to 5 minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods Last Names Topchart accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), debit cards (Mastercard, Visa), and wallet balance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my payment information secure on Topchart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We use bank-grade encryption and are PCI DSS compliant. We never store your card details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which networks Last Names Topchart support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We support all major ian networks: MTN, Telecel (formerly Vodafone), and AirtelTigo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I get a refund if a transaction fails?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If a transaction fails, your money is automatically refunded to your wallet within minutes.',
      },
    },
  ],
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
