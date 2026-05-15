import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cheap Data Bundles Accra | Buy MTN Data Online in Accra',
  description: 'Buy cheap data bundles in Accra, Ghana. Lowest MTN, Telecel & AirtelTigo data prices. Instant delivery via MTN MoMo. Serving all Accra neighborhoods.',
  keywords: [
    'cheap data bundles Accra',
    'buy MTN data Accra',
    'data bundles Accra Ghana',
    'Accra internet deals',
    'MTN data Accra',
    'Telecel data Accra',
    'AirtelTigo data Accra',
    'cheap internet Accra',
    'data delivery Accra',
    'Accra data reseller',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-data-accra' },
  openGraph: {
    title: 'Cheap Data Bundles Accra | Buy MTN Data Online in Accra',
    description: 'Buy cheap data bundles in Accra, Ghana. Lowest MTN, Telecel & AirtelTigo data prices.',
    url: 'https://topchart.store/cheap-data-accra',
  },
}

export default function CheapDataAccraPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cheap Data Bundles in Accra
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy MTN, Telecel & AirtelTigo data bundles at lowest prices in Accra. Instant delivery via MTN MoMo.
          </p>
          <Link
            href="/dashboard/data"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Buy Data in Accra
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas We Serve in Accra</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Accra Central</li>
              <li>• East Legon</li>
              <li>• Airport Residential</li>
              <li>• Cantonments</li>
              <li>• Labadi</li>
              <li>• Teshie</li>
              <li>• Nungua</li>
              <li>• Madina</li>
              <li>• Achimota</li>
              <li>• And more...</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us in Accra?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Lowest data prices in Accra</li>
              <li>✓ Instant MTN MoMo delivery</li>
              <li>✓ 24/7 automated service</li>
              <li>✓ Trusted by Accra residents</li>
              <li>✓ Non-expiry bundles available</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accra Data Bundle FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How fast is data delivery in Accra?</h3>
              <p className="text-gray-700">Data delivery is instant across all Accra neighborhoods. Your bundle will be activated within seconds of payment.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you serve all Accra areas?</h3>
              <p className="text-gray-700">Yes, we serve all areas in Accra including East Legon, Airport Residential, Cantonments, Labadi, Teshie, Nungua, Madina, Achimota, and more.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/data"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Your Data Bundle in Accra
          </Link>
        </div>
      </div>
    </div>
  )
}
