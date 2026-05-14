"use client"

import Script from "next/script"

const verificationServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Virtual Numbers for Verification',
  description: 'Get temporary virtual phone numbers for OTP and SMS verification on WhatsApp, Telegram, Google, Facebook and more in Ghana.',
  provider: {
    '@type': 'Organization',
    name: 'Topchart',
    url: 'https://topchart.store'
  },
  areaServed: {
    '@type': 'Country',
    name: 'Ghana'
  },
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/InStock',
    priceCurrency: 'GHS',
    priceRange: '2-50'
  }
}

export function VerificationServiceSchema() {
  return (
    <Script
      id="verification-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(verificationServiceSchema) }}
    />
  )
}
