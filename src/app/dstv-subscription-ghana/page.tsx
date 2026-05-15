import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DSTV Subscription Ghana | Renew DSTV Online Instantly',
  description: 'Renew DSTV subscription online in Ghana instantly. Pay DSTV bills via MTN MoMo, Telecel Cash, or card. Fast, secure, and reliable DSTV payment service.',
  keywords: [
    'DSTV subscription Ghana',
    'renew DSTV online Ghana',
    'pay DSTV bills Ghana',
    'cheap DSTV renewal Ghana',
    'instant DSTV payment',
    'DSTV with MoMo',
    'DSTV subscription Accra',
    'DSTV payment online Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/dstv-subscription-ghana' },
  openGraph: {
    title: 'DSTV Subscription Ghana | Renew DSTV Online Instantly',
    description: 'Renew DSTV subscription online in Ghana instantly. Pay DSTV bills via MTN MoMo or card.',
    url: 'https://topchart.store/dstv-subscription-ghana',
  },
}

export default function DSTVSubscriptionGhanaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DSTV Subscription Ghana
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Renew DSTV subscription online in Ghana instantly. Pay via MTN MoMo, Telecel Cash, or card.
          </p>
          <Link
            href="/dashboard/bills"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Renew DSTV Now
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Renew DSTV with Us?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Instant DSTV renewal</li>
              <li>✓ Multiple payment methods</li>
              <li>✓ MTN MoMo, Telecel Cash, Card</li>
              <li>✓ 24/7 automated service</li>
              <li>✓ Secure and reliable</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">DSTV Packages</h2>
            <ul className="space-y-3 text-gray-700">
              <li>• DSTV Compact</li>
              <li>• DSTV Compact Plus</li>
              <li>• DSTV Premium</li>
              <li>• DSTV Access</li>
              <li>• DSTV Family</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I renew DSTV online in Ghana?</h3>
              <p className="text-gray-700">Create an account on Topchart, select DSTV subscription, enter your smartcard number, and pay via MTN MoMo, Telecel Cash, or card. Your DSTV will be renewed instantly.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept for DSTV?</h3>
              <p className="text-gray-700">We accept MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, and Mastercard for DSTV subscription payments in Ghana.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How fast is DSTV renewal?</h3>
              <p className="text-gray-700">DSTV renewal is instant. Your subscription will be activated within seconds of successful payment.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/bills"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Renew Your DSTV Subscription
          </Link>
        </div>
      </div>
    </div>
  )
}
