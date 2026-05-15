import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Reseller Ghana | Become a Topchart Reseller & Earn Daily',
  description: 'Become a data reseller in Ghana with Topchart. Earn daily commissions selling cheap data bundles, airtime, and verification numbers. White-label platform, automated delivery.',
  keywords: [
    'data reseller Ghana',
    'become a data reseller',
    'cheap reseller bundles Ghana',
    'reseller platform Ghana',
    'make money selling data',
    'automated reseller platform',
    'data reseller business Ghana',
    'MTN reseller Ghana',
    'start data business Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/data-reseller-ghana' },
  openGraph: {
    title: 'Data Reseller Ghana | Become a Topchart Reseller & Earn Daily',
    description: 'Become a data reseller in Ghana with Topchart. Earn daily commissions selling cheap data bundles.',
    url: 'https://topchart.store/data-reseller-ghana',
  },
}

export default function DataResellerGhanaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Data Reseller in Ghana
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join 500+ resellers earning daily commissions. White-label platform, automated delivery, full support.
          </p>
          <Link
            href="/dashboard/reseller"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Start Reselling Today
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Become a Reseller?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Daily commission earnings</li>
              <li>✓ White-label platform</li>
              <li>✓ Automated delivery system</li>
              <li>✓ No inventory needed</li>
              <li>✓ Full marketing support</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What You Can Sell</h2>
            <ul className="space-y-3 text-gray-700">
              <li>• MTN, Telecel, AirtelTigo data</li>
              <li>• Airtime top-ups</li>
              <li>• Verification numbers</li>
              <li>• Gift cards</li>
              <li>• Bill payments</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I become a data reseller in Ghana?</h3>
              <p className="text-gray-700">Sign up on Topchart, apply for the reseller program, and start selling immediately. No upfront costs, earn commissions on every sale.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How much can I earn as a reseller?</h3>
              <p className="text-gray-700">Resellers earn daily commissions on every sale. Top resellers earn significant income selling data bundles, airtime, and verification numbers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do I need inventory to start?</h3>
              <p className="text-gray-700">No, you don't need inventory. Our automated delivery system handles everything. You just make sales and earn commissions.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/reseller"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Join the Reseller Program
          </Link>
        </div>
      </div>
    </div>
  )
}
