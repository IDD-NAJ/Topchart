import { Metadata } from 'next'
import Link from 'next/link'
import { Store, TrendingUp, Users, Zap, Shield, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Reseller Ghana | Become a Data Reseller & Earn Daily',
  description: 'Become a data reseller in Ghana and earn daily commissions. Join Topchart reseller programme. White-label platform, automated delivery, wholesale prices.',
  keywords: [
    'data reseller Ghana',
    'become a data reseller',
    'cheap reseller bundles Ghana',
    'reseller platform Ghana',
    'make money selling data',
    'automated reseller platform',
    'data bundle business Ghana',
    'MTN reseller Ghana',
    'Telecel reseller',
    'AirtelTigo reseller',
    'start data business Ghana',
    'wholesale data Ghana',
  ],
  alternates: { canonical: 'https://topchart.store/data-reseller-ghana' },
  openGraph: {
    title: 'Data Reseller Ghana | Become a Data Reseller & Earn Daily',
    description: 'Become a data reseller in Ghana. Join Topchart reseller programme with white-label platform and automated delivery.',
    url: 'https://topchart.store/data-reseller-ghana',
    type: 'website',
  },
}

export default function ResellerLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Store className="mr-2 h-4 w-4" />
                Reseller Programme
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Become a Data Reseller in Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Join Topchart reseller programme and earn daily commissions selling cheap data bundles, airtime, Foreign Numbers, and digital services. White-label platform, automated delivery, wholesale prices.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/reseller"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Start Reselling
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
                <Store className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Become a Topchart Reseller?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: 'Daily Commissions',
                description: 'Earn daily commissions on every sale. Withdraw your earnings anytime.',
              },
              {
                icon: Shield,
                title: 'White-Label Platform',
                description: 'Launch your own branded storefront with your logo and branding.',
              },
              {
                icon: Zap,
                title: 'Automated Delivery',
                description: 'All products delivered automatically. No manual work required.',
              },
              {
                icon: Users,
                title: '500+ Resellers',
                description: 'Join 500+ active resellers already earning with Topchart.',
              },
              {
                icon: CheckCircle,
                title: 'Wholesale Prices',
                description: 'Get products at wholesale prices and sell at your own markup.',
              },
              {
                icon: Store,
                title: 'All Services',
                description: 'Resell data, airtime, Foreign Numbers, eSIM, gift cards, bills.',
              },
            ].map((benefit, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <benefit.icon className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">{benefit.title}</h3>
                <p className="mt-3 text-neutral-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            How to Start Your Reseller Business
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your free reseller account on Topchart.',
              },
              {
                step: '2',
                title: 'Fund Wallet',
                description: 'Add funds to your wallet via MoMo or card.',
              },
              {
                step: '3',
                title: 'Set Prices',
                description: 'Set your own prices and profit margins.',
              },
              {
                step: '4',
                title: 'Start Selling',
                description: 'Start selling and earn daily commissions.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{item.title}</h3>
                <p className="mt-3 text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 bg-primary">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Your Reseller Business?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join 500+ resellers earning daily with Topchart
          </p>
          <Link
            href="/dashboard/reseller"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-primary transition-colors hover:bg-neutral-100"
          >
            Become a Reseller
            <Store className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
