import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buy Verification Numbers Ghana | OTP & SMS Virtual Numbers',
  description: 'Buy temporary virtual phone numbers for OTP and SMS verification in Ghana. WhatsApp, Telegram, Google, Facebook verification numbers with instant activation.',
  keywords: [
    'buy verification numbers Ghana',
    'OTP verification numbers Ghana',
    'SMS verification Ghana',
    'virtual phone numbers Ghana',
    'WhatsApp verification Ghana',
    'Telegram verification Ghana',
    'Google verification number Ghana',
    'Facebook verification Ghana',
    'temporary phone number Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/buy-verification-numbers-ghana' },
  openGraph: {
    title: 'Buy Verification Numbers Ghana | OTP & SMS Virtual Numbers',
    description: 'Buy temporary virtual phone numbers for OTP and SMS verification in Ghana. WhatsApp, Telegram, Google verification.',
    url: 'https://topchart.store/buy-verification-numbers-ghana',
  },
}

export default function BuyVerificationNumbersGhanaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Buy Verification Numbers Ghana
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get temporary virtual phone numbers for OTP and SMS verification. WhatsApp, Telegram, Google, Facebook verification.
          </p>
          <Link
            href="/dashboard/verification"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Get Verification Number
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Our Verification Numbers?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Instant activation</li>
              <li>✓ WhatsApp, Telegram, Google, Facebook</li>
              <li>✓ Secure and private</li>
              <li>✓ Disposable numbers</li>
              <li>✓ 24/7 availability</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Platforms</h2>
            <ul className="space-y-3 text-gray-700">
              <li>• WhatsApp verification</li>
              <li>• Telegram verification</li>
              <li>• Google verification</li>
              <li>• Facebook verification</li>
              <li>• Instagram verification</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I buy verification numbers in Ghana?</h3>
              <p className="text-gray-700">Create an account on Topchart, select your verification service (WhatsApp, Telegram, etc.), and pay securely. Your virtual number will be activated instantly.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are your verification numbers secure?</h3>
              <p className="text-gray-700">Yes, our verification numbers are secure and private. They are disposable and designed for one-time use for OTP verification.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Which platforms do you support?</h3>
              <p className="text-gray-700">We support verification for WhatsApp, Telegram, Google, Facebook, Instagram, and many other platforms.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/verification"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Get Your Verification Number
          </Link>
        </div>
      </div>
    </div>
  )
}
