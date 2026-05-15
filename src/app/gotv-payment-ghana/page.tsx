import { Metadata } from 'next'
import Link from 'next/link'
import { Tv, Zap, Shield, Clock, CheckCircle, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'GOtv Payment Ghana | Pay GOtv Online Cheap & Instant',
  description: 'Pay GOtv subscription online in Ghana at cheap prices. Instant GOtv payment via MoMo. All GOtv packages available. Lowest prices guaranteed.',
  keywords: [
    'GOtv payment Ghana',
    'pay GOTV online Ghana',
    'cheap GOTV subscription',
    'instant GOTV payment',
    'GOTV Ghana',
    'GOTV MoMo payment',
    'GOTV packages Ghana',
    'cable TV payment Ghana',
    'renew GOTV online',
    'GOTV Max',
    'GOTV Jolli',
  ],
  alternates: { canonical: 'https://topchart.store/gotv-payment-ghana' },
  openGraph: {
    title: 'GOtv Payment Ghana | Pay GOtv Online Cheap & Instant',
    description: 'Pay GOtv subscription online in Ghana at cheap prices. Instant GOtv payment via MoMo. All GOtv packages available.',
    url: 'https://topchart.store/gotv-payment-ghana',
    type: 'website',
  },
}

export default function GOTVLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-orange-600/10 px-4 py-2 text-sm font-semibold text-orange-600">
                <Tv className="mr-2 h-4 w-4" />
                GOtv Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                GOtv Payment Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Pay GOtv subscription online in Ghana at cheap prices. Instant GOtv payment via MTN MoMo, Telecel Cash, AirtelTigo Money. All GOtv packages including Max, Jolli, Plus available with lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/bills"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Pay GOtv Now
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600/20 to-orange-600/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Tv className="h-32 w-32 text-orange-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOtv Packages */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            GOtv Packages Available
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'GOtv Max',
                price: 'From GHS 30',
                features: ['Premium channels', 'Sports channels', 'Movies', 'HD channels'],
                popular: true,
              },
              {
                name: 'GOtv Jolli',
                price: 'From GHS 20',
                features: ['Great value', 'Entertainment', 'Local content', 'Sports highlights'],
              },
              {
                name: 'GOtv Plus',
                price: 'From GHS 40',
                features: ['More channels', 'Premium sports', 'International content', 'HD channels'],
              },
              {
                name: 'GOtv Smallie',
                price: 'From GHS 15',
                features: ['Affordable option', 'Basic channels', 'News', 'Kids channels'],
              },
              {
                name: 'GOtv Value',
                price: 'From GHS 25',
                features: ['Balanced package', 'Family friendly', 'Entertainment', 'Sports'],
              },
              {
                name: 'GOtv Supa',
                price: 'From GHS 50',
                features: ['All channels', 'Premium content', '4K Ultra HD', 'BoxOffice'],
                premium: true,
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm ${
                  pkg.premium ? 'border-orange-600 scale-105' : pkg.popular ? 'border-primary scale-105' : 'border-neutral-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}
                {pkg.premium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-4 py-1 text-sm font-semibold text-white">
                    Premium
                  </div>
                )}
                <h3 className="text-2xl font-bold text-neutral-900">{pkg.name}</h3>
                <p className="mt-4 text-3xl font-bold text-primary">{pkg.price}</p>
                <ul className="mt-6 space-y-3">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-neutral-600">
                      <CheckCircle className="mr-2 h-5 w-5 text-orange-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/bills"
                  className="mt-8 block w-full rounded-lg bg-orange-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Pay GOtv with Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Activation',
                description: 'Your GOtv subscription is activated instantly.',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money.',
              },
              {
                icon: Clock,
                title: '24/7 Service',
                description: 'Renew GOtv anytime, day or night.',
              },
              {
                icon: CheckCircle,
                title: 'No Extra Fees',
                description: 'Pay exactly what you see. No hidden charges.',
              },
              {
                icon: Tv,
                title: 'All Packages',
                description: 'GOtv Max, Jolli, Plus, Smallie, Value, Supa.',
              },
              {
                icon: CreditCard,
                title: 'Easy Process',
                description: 'Enter ICU number and pay. Simple and fast.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <feature.icon className="mb-4 h-12 w-12 text-orange-600" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 bg-orange-600">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Pay GOtv Subscription?
          </h2>
          <Link
            href="/dashboard/bills"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-orange-600 transition-colors hover:bg-neutral-100"
          >
            Pay GOtv Now
            <Tv className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
