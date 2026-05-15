import { Metadata } from 'next'
import Link from 'next/link'
import { Wifi, Zap, Shield, Clock, CheckCircle, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cheap Telecel Bundles Ghana | Buy Telecel Data Online Instant',
  description: 'Buy cheap Telecel/Vodafone data bundles in Ghana at lowest prices. Instant delivery via MoMo. Daily, weekly, monthly bundles available. Trusted by 500K+ Ghanaians.',
  keywords: [
    'cheap Telecel bundles Ghana',
    'buy Telecel data online Ghana',
    'Telecel cheap data',
    'Vodafone data Ghana',
    'affordable Telecel internet',
    'instant Telecel data delivery',
    'Telecel daily bundles',
    'Telecel weekly bundles',
    'Telecel monthly bundles',
    'non-expiry Telecel data',
    'Telecel data with MoMo',
    'cheapest Telecel bundles',
  ],
  alternates: { canonical: 'https://topchart.store/cheap-telecel-bundles-ghana' },
  openGraph: {
    title: 'Cheap Telecel Bundles Ghana | Buy Telecel Data Online Instant',
    description: 'Buy cheap Telecel/Vodafone data bundles in Ghana at lowest prices. Instant delivery via MoMo. Daily, weekly, monthly bundles available.',
    url: 'https://topchart.store/cheap-telecel-bundles-ghana',
    type: 'website',
  },
}

export default function TelecelDataLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-[#E60000]/10 px-4 py-2 text-sm font-semibold text-[#E60000]">
                <Smartphone className="mr-2 h-4 w-4" />
                Telecel Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Cheap Telecel Bundles Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy cheap Telecel/Vodafone data bundles in Ghana at the lowest prices. Instant delivery via Telecel Cash or MTN MoMo. Daily, weekly, monthly, and mega bundles available. Trusted by 500K+ Ghanaians.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/data"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy Telecel Data
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-[#E60000]/20 to-[#E60000]/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Wifi className="h-32 w-32 text-[#E60000]/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Telecel Data Bundle Plans
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { size: '50MB', price: 'GHS 1', validity: '1 Day', type: 'Daily' },
              { size: '150MB', price: 'GHS 2', validity: '1 Day', type: 'Daily' },
              { size: '500MB', price: 'GHS 5', validity: '7 Days', type: 'Weekly' },
              { size: '1GB', price: 'GHS 9', validity: '7 Days', type: 'Weekly' },
              { size: '2GB', price: 'GHS 18', validity: '30 Days', type: 'Monthly' },
              { size: '5GB', price: 'GHS 40', validity: '30 Days', type: 'Monthly' },
              { size: '10GB', price: 'GHS 70', validity: '30 Days', type: 'Monthly' },
              { size: '20GB', price: 'GHS 120', validity: '30 Days', type: 'Mega' },
            ].map((plan, i) => (
              <div key={i} className="rounded-2xl border-2 border-[#E60000]/20 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2 inline-block rounded-full bg-[#E60000]/20 px-3 py-1 text-xs font-semibold text-[#E60000]">
                  {plan.type}
                </div>
                <h3 className="text-3xl font-bold text-neutral-900">{plan.size}</h3>
                <p className="mt-2 text-neutral-600">{plan.validity}</p>
                <p className="mt-4 text-2xl font-bold text-primary">{plan.price}</p>
                <Link
                  href="/dashboard/data"
                  className="mt-6 block w-full rounded-lg bg-[#E60000] px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-[#E60000]/90"
                >
                  Buy Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 bg-[#E60000]">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Buy Cheap Telecel Data?
          </h2>
          <Link
            href="/dashboard/data"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-[#E60000] transition-colors hover:bg-neutral-100"
          >
            Buy Telecel Data Now
            <Smartphone className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
