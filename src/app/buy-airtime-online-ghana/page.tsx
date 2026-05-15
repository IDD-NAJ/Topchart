import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Zap, Shield, Clock, CheckCircle, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buy Airtime Online Ghana | Instant Airtime Topup MTN, Telecel, AirtelTigo',
  description: 'Buy airtime online in Ghana instantly. MTN, Telecel, AirtelTigo airtime topup via MoMo. Cheap airtime rates, instant delivery. 24/7 service.',
  keywords: [
    'buy airtime online Ghana',
    'instant airtime topup',
    'MTN airtime Ghana',
    'Telecel airtime online',
    'AirtelTigo recharge Ghana',
    'cheap airtime Ghana',
    'mobile recharge online Ghana',
    'airtime with MoMo',
    'instant topup Ghana',
    'buy credit online',
    'mobile airtime Ghana',
    'fast airtime delivery',
  ],
  alternates: { canonical: 'https://topchart.store/buy-airtime-online-ghana' },
  openGraph: {
    title: 'Buy Airtime Online Ghana | Instant Airtime Topup',
    description: 'Buy airtime online in Ghana instantly. MTN, Telecel, AirtelTigo airtime via MoMo. Cheap rates, instant delivery.',
    url: 'https://topchart.store/buy-airtime-online-ghana',
    type: 'website',
  },
}

export default function AirtimeLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Phone className="mr-2 h-4 w-4" />
                Airtime Topup
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Buy Airtime Online Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy airtime online in Ghana instantly. MTN, Telecel, AirtelTigo airtime topup via MoMo at the cheapest rates. Instant delivery, 24/7 service. No extra fees.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/data"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy Airtime Now
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Phone className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            All Networks Supported
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                name: 'MTN Ghana',
                color: 'bg-[#FFCC00]',
                description: 'Largest network in Ghana. Fast and reliable.',
              },
              {
                name: 'Telecel/Vodafone',
                color: 'bg-[#E60000]',
                description: 'Wide coverage across Ghana. Affordable rates.',
              },
              {
                name: 'AirtelTigo',
                color: 'bg-[#0066CC]',
                description: 'Merged network with great data and voice plans.',
              },
            ].map((network, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${network.color}`} />
                <h3 className="text-xl font-bold text-neutral-900">{network.name}</h3>
                <p className="mt-3 text-neutral-600">{network.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Buy Airtime from Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Airtime credited instantly after payment.',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money.',
              },
              {
                icon: Clock,
                title: '24/7 Service',
                description: 'Buy airtime anytime, day or night.',
              },
              {
                icon: Smartphone,
                title: 'All Amounts',
                description: 'From GHS 1 to GHS 500+ available.',
              },
              {
                icon: CheckCircle,
                title: 'No Extra Fees',
                description: 'Pay exactly what you see. No hidden charges.',
              },
              {
                icon: Phone,
                title: 'Easy Process',
                description: 'Enter phone number, select amount, pay. Done.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <feature.icon className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 bg-primary">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Buy Airtime?
          </h2>
          <Link
            href="/dashboard/data"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-primary transition-colors hover:bg-neutral-100"
          >
            Buy Airtime Now
            <Phone className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
