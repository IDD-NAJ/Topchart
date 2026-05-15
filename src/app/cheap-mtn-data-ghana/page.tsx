import { Metadata } from 'next'
import Link from 'next/link'
import { Wifi, Zap, Shield, Clock, CheckCircle, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cheap MTN Data Bundles Ghana | Buy MTN Data Online Instantly',
  description: 'Buy cheap MTN data bundles in Ghana at lowest prices. Instant delivery via MoMo. Daily, weekly, monthly, and mega bundles available. Trusted by 500K+ Ghanaians.',
  keywords: [
    'cheap MTN data bundles Ghana',
    'buy MTN data online Ghana',
    'MTN cheap data',
    'affordable MTN internet',
    'instant MTN data delivery',
    'MTN daily bundles',
    'MTN weekly bundles',
    'MTN monthly bundles',
    'non-expiry MTN data',
    'MTN data with MoMo',
    'cheapest MTN bundles',
    'MTN internet Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-mtn-data-ghana' },
  openGraph: {
    title: 'Cheap MTN Data Bundles Ghana | Buy MTN Data Online Instantly',
    description: 'Buy cheap MTN data bundles in Ghana at lowest prices. Instant delivery via MoMo. Daily, weekly, monthly bundles available.',
    url: 'https://topchart.store/cheap-mtn-data-ghana',
    type: 'website',
  },
}

export default function MTNDataLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-[#FFCC00]/20 px-4 py-2 text-sm font-semibold text-[#FFCC00]">
                <Smartphone className="mr-2 h-4 w-4" />
                MTN Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Cheap MTN Data Bundles Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy cheap MTN data bundles in Ghana at the lowest prices. Instant delivery via MTN MoMo. Daily, weekly, monthly, and mega bundles available. Trusted by 500K+ Ghanaians.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/data"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy MTN Data
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-200 px-8 py-3 font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFCC00]/20 to-[#FFCC00]/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Wifi className="h-32 w-32 text-[#FFCC00]/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Buy MTN Data from Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Get your MTN data bundle instantly after payment. No waiting, no delays.',
              },
              {
                icon: Shield,
                title: 'Lowest Prices',
                description: 'Cheapest MTN data bundles in Ghana. Lower than direct carrier rates.',
              },
              {
                icon: Clock,
                title: '24/7 Service',
                description: 'Buy MTN data anytime, day or night. Our service never sleeps.',
              },
              {
                icon: Smartphone,
                title: 'MTN MoMo Payment',
                description: 'Pay securely with MTN Mobile Money. Fast and convenient.',
              },
              {
                icon: CheckCircle,
                title: 'Non-Expiry Options',
                description: 'Choose from non-expiry bundles that do not expire.',
              },
              {
                icon: Wifi,
                title: 'All Bundle Types',
                description: 'Daily, weekly, monthly, and mega bundles available.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <feature.icon className="mb-4 h-12 w-12 text-[#FFCC00]" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MTN Data Plans */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            MTN Data Bundle Plans
          </h2>
          <p className="mt-4 text-center text-lg text-neutral-600">
            Choose the perfect MTN data plan for your needs
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { size: '50MB', price: 'GHS 1', validity: '1 Day', type: 'Daily' },
              { size: '150MB', price: 'GHS 2', validity: '1 Day', type: 'Daily' },
              { size: '350MB', price: 'GHS 5', validity: '7 Days', type: 'Weekly' },
              { size: '1GB', price: 'GHS 10', validity: '7 Days', type: 'Weekly' },
              { size: '2GB', price: 'GHS 20', validity: '30 Days', type: 'Monthly' },
              { size: '4GB', price: 'GHS 35', validity: '30 Days', type: 'Monthly' },
              { size: '6GB', price: 'GHS 50', validity: '30 Days', type: 'Monthly' },
              { size: '10GB', price: 'GHS 75', validity: '30 Days', type: 'Monthly' },
            ].map((plan, i) => (
              <div key={i} className="rounded-2xl border-2 border-[#FFCC00]/20 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2 inline-block rounded-full bg-[#FFCC00]/20 px-3 py-1 text-xs font-semibold text-[#FFCC00]">
                  {plan.type}
                </div>
                <h3 className="text-3xl font-bold text-neutral-900">{plan.size}</h3>
                <p className="mt-2 text-neutral-600">{plan.validity}</p>
                <p className="mt-4 text-2xl font-bold text-primary">{plan.price}</p>
                <Link
                  href="/dashboard/data"
                  className="mt-6 block w-full rounded-lg bg-[#FFCC00] px-4 py-2 text-center font-semibold text-neutral-900 transition-colors hover:bg-[#FFCC00]/90"
                >
                  Buy Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 bg-[#FFCC00]">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            Ready to Buy Cheap MTN Data?
          </h2>
          <p className="mt-4 text-lg text-neutral-700">
            Join 500K+ Ghanaians buying MTN data on Topchart
          </p>
          <Link
            href="/dashboard/data"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-neutral-900 px-8 py-4 font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Buy MTN Data Now
            <Smartphone className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
