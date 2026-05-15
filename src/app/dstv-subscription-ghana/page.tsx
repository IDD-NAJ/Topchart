import { Metadata } from 'next'
import Link from 'next/link'
import { Tv, Zap, Shield, Clock, CheckCircle, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'DSTV Subscription Ghana | Pay DSTV Online Cheap & Instant',
  description: 'Pay DSTV subscription online in Ghana at cheap prices. Instant DSTV renewal via MoMo. All DSTV packages available. Lowest prices guaranteed.',
  keywords: [
    'DSTV subscription Ghana',
    'pay DSTV online Ghana',
    'cheap DSTV renewal Ghana',
    'instant TV subscription Ghana',
    'renew DSTV online',
    'DSTV payment Ghana',
    'cable TV payment online',
    'DSTV Ghana',
    'DSTV MoMo payment',
    'DSTV packages Ghana',
    'DSTV compact',
    'DSTV premium',
  ],
  alternates: { canonical: 'https://topchart.store/dstv-subscription-ghana' },
  openGraph: {
    title: 'DSTV Subscription Ghana | Pay DSTV Online Cheap & Instant',
    description: 'Pay DSTV subscription online in Ghana at cheap prices. Instant DSTV renewal via MoMo. All DSTV packages available.',
    url: 'https://topchart.store/dstv-subscription-ghana',
    type: 'website',
  },
}

export default function DSTVLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-600">
                <Tv className="mr-2 h-4 w-4" />
                DSTV Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Pay DSTV Subscription Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Pay DSTV subscription online in Ghana at cheap prices. Instant DSTV renewal via MTN MoMo, Telecel Cash, AirtelTigo Money. All DSTV packages available with lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/bills"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Pay DSTV Now
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Tv className="h-32 w-32 text-blue-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Pay DSTV with Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Activation',
                description: 'Your DSTV subscription is activated instantly after payment. No waiting.',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money, or card.',
              },
              {
                icon: Clock,
                title: '24/7 Service',
                description: 'Renew DSTV anytime, day or night. Our service never sleeps.',
              },
              {
                icon: CreditCard,
                title: 'All Packages',
                description: 'DSTV Access, Family, Compact, Premium, and all other packages.',
              },
              {
                icon: CheckCircle,
                title: 'No Extra Fees',
                description: 'Pay exactly what you see. No hidden charges or extra fees.',
              },
              {
                icon: Tv,
                title: 'Easy Process',
                description: 'Just enter your smart card number and pay. Simple and fast.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <feature.icon className="mb-4 h-12 w-12 text-blue-600" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DSTV Packages */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            DSTV Packages Available
          </h2>
          <p className="mt-4 text-center text-lg text-neutral-600">
            All DSTV packages at the best prices in Ghana
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'DSTV Access',
                price: 'From GHS 25',
                features: ['Affordable entry package', 'Local channels', 'News channels', 'Kids channels'],
              },
              {
                name: 'DSTV Family',
                price: 'From GHS 50',
                features: ['Great for families', 'Sports channels', 'Entertainment', 'Documentaries'],
                popular: true,
              },
              {
                name: 'DSTV Compact',
                price: 'From GHS 75',
                features: ['Popular choice', 'Movie channels', 'Series', 'Sports highlights'],
              },
              {
                name: 'DSTV Compact Plus',
                price: 'From GHS 100',
                features: ['More channels', 'Premium sports', 'International content', 'HD channels'],
              },
              {
                name: 'DSTV Premium',
                price: 'From GHS 150',
                features: ['All channels', '4K Ultra HD', 'Premium sports', 'BoxOffice'],
                premium: true,
              },
              {
                name: 'French Plus',
                price: 'From GHS 60',
                features: ['French content', 'African channels', 'Entertainment', 'Sports'],
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm ${
                  pkg.premium ? 'border-blue-600 scale-105' : pkg.popular ? 'border-primary scale-105' : 'border-neutral-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}
                {pkg.premium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    Premium
                  </div>
                )}
                <h3 className="text-2xl font-bold text-neutral-900">{pkg.name}</h3>
                <p className="mt-4 text-3xl font-bold text-primary">{pkg.price}</p>
                <ul className="mt-6 space-y-3">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-neutral-600">
                      <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/bills"
                  className="mt-8 block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            How to Pay DSTV Subscription
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Enter Smart Card Number',
                description: 'Provide your DSTV smart card number for account identification.',
              },
              {
                step: '2',
                title: 'Select Package',
                description: 'Choose your preferred DSTV package and subscription duration.',
              },
              {
                step: '3',
                title: 'Make Payment',
                description: 'Pay securely via MTN MoMo, Telecel Cash, AirtelTigo Money, or card.',
              },
              {
                step: '4',
                title: 'Instant Activation',
                description: 'Your DSTV subscription is activated instantly. Watch immediately!',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{item.title}</h3>
                <p className="mt-3 text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 bg-blue-600">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Renew Your DSTV Subscription?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of Ghanaians paying DSTV on Topchart
          </p>
          <Link
            href="/dashboard/bills"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-blue-600 transition-colors hover:bg-neutral-100"
          >
            Pay DSTV Now
            <Tv className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
