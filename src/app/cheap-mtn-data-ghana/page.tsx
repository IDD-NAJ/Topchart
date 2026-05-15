import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheap MTN Data Bundles Ghana | Buy MTN Data Online Instantly',
  description: 'Buy cheap MTN data bundles in Ghana at lowest prices. Instant delivery via MTN MoMo. Daily, weekly, monthly non-expiry bundles available. Trusted by 500K+ Ghanaians.',
  keywords: [
    'cheap MTN data bundles Ghana',
    'buy MTN data online Ghana',
    'MTN cheap data Accra',
    'cheapest MTN bundles Ghana',
    'MTN data deals Ghana',
    'instant MTN data delivery',
    'non expiry MTN data',
    'MTN data with MoMo',
    'affordable MTN internet Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-mtn-data-ghana' },
  openGraph: {
    title: 'Cheap MTN Data Bundles Ghana | Buy MTN Data Online Instantly',
    description: 'Buy cheap MTN data bundles in Ghana at lowest prices. Instant delivery via MTN MoMo.',
    url: 'https://topchart.store/cheap-mtn-data-ghana',
  },
}

export default function CheapMTNDataGhanaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cheap MTN Data Bundles Ghana
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy MTN data online at the lowest prices in Ghana. Instant delivery via MTN MoMo.
          </p>
          <Link
            href="/dashboard/data"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Buy MTN Data Now
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Our MTN Data?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Lowest prices in Ghana</li>
              <li>✓ Instant delivery via MTN MoMo</li>
              <li>✓ Non-expiry data bundles available</li>
              <li>✓ 24/7 automated delivery</li>
              <li>✓ Trusted by 500K+ Ghanaians</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">MTN Data Plans</h2>
            <ul className="space-y-3 text-gray-700">
              <li>• Daily data bundles</li>
              <li>• Weekly data bundles</li>
              <li>• Monthly data bundles</li>
              <li>• Non-expiry bundles</li>
              <li>• Special student plans</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I buy MTN data online in Ghana?</h3>
              <p className="text-gray-700">Simply create an account on Topchart, select your MTN data bundle, and pay securely via MTN MoMo. Your data will be delivered instantly.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are your MTN data bundles cheap?</h3>
              <p className="text-gray-700">Yes, we offer the cheapest MTN data bundles in Ghana with prices lower than direct carrier rates.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you have non-expiry MTN data bundles?</h3>
              <p className="text-gray-700">Yes, we offer non-expiry MTN data bundles that do not expire, giving you maximum flexibility.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/data"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started with MTN Data
          </Link>
        </div>
      </div>
    </div>
  )
}
