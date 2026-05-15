import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheap Data Bundles Kumasi | Buy Telecel Data Online in Kumasi',
  description: 'Buy cheap data bundles in Kumasi, Ghana. Lowest MTN, Telecel & AirtelTigo data prices. Instant delivery via Telecel Cash. Serving all Kumasi areas.',
  keywords: [
    'cheap data bundles Kumasi',
    'buy Telecel data Kumasi',
    'data bundles Kumasi Ghana',
    'Kumasi internet deals',
    'MTN data Kumasi',
    'Telecel data Kumasi',
    'AirtelTigo data Kumasi',
    'cheap internet Kumasi',
    'data delivery Kumasi',
    'Kumasi data reseller',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-data-kumasi' },
  openGraph: {
    title: 'Cheap Data Bundles Kumasi | Buy Telecel Data Online in Kumasi',
    description: 'Buy cheap data bundles in Kumasi, Ghana. Lowest MTN, Telecel & AirtelTigo data prices.',
    url: 'https://topchart.store/cheap-data-kumasi',
  },
}

export default function CheapDataKumasiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cheap Data Bundles in Kumasi
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy MTN, Telecel & AirtelTigo data bundles at lowest prices in Kumasi. Instant delivery via Telecel Cash.
          </p>
          <Link
            href="/dashboard/data"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Buy Data in Kumasi
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas We Serve in Kumasi</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Kumasi Central</li>
              <li>• Adum</li>
              <li>• Kejetia</li>
              <li>• Asokwa</li>
              <li>• Oforikrom</li>
              <li>• KNUST</li>
              <li>• Ayeduase</li>
              <li>• Kasi</li>
              <li>• And more...</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us in Kumasi?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Lowest data prices in Kumasi</li>
              <li>✓ Instant Telecel Cash delivery</li>
              <li>✓ 24/7 automated service</li>
              <li>✓ Trusted by Kumasi residents</li>
              <li>✓ Student discounts available</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/data"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Get Your Data Bundle in Kumasi
          </Link>
        </div>
      </div>
    </div>
  )
}
