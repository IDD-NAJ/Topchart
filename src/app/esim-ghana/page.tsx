import { Metadata } from 'next'
import Link from 'next/link'
import { Smartphone, Globe, Zap, Shield, CheckCircle, Plane } from 'lucide-react'

export const metadata: Metadata = {
  title: 'eSIM Ghana | Buy Travel eSIM & Digital SIM Cards Instant',
  description: 'Buy eSIM in Ghana for travel. Digital SIM cards for international data. US virtual numbers, travel eSIMs. Instant activation, lowest prices.',
  keywords: [
    'eSIM Ghana',
    'travel eSIM',
    'digital SIM card Ghana',
    'US virtual number',
    'international data eSIM',
    'eSIM for travel',
    'buy eSIM online Ghana',
    'virtual phone number Ghana',
    'travel data SIM',
    'eSIM activation',
    'global data eSIM',
    'roaming eSIM',
  ],
  alternates: { canonical: 'https://topchart.store/esim-ghana' },
  openGraph: {
    title: 'eSIM Ghana | Buy Travel eSIM & Digital SIM Cards',
    description: 'Buy eSIM in Ghana for travel. Digital SIM cards for international data. US virtual numbers, travel eSIMs at lowest prices.',
    url: 'https://topchart.store/esim-ghana',
    type: 'website',
  },
}

export default function ESIMLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-600">
                <Smartphone className="mr-2 h-4 w-4" />
                Digital SIM Technology
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                eSIM Ghana - Travel eSIM & Digital SIM Cards
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy eSIM in Ghana for international travel. Digital SIM cards for global connectivity with US virtual numbers and travel data eSIMs. Instant activation, no physical SIM needed. Lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/esim"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Get eSIM Now
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-200 px-8 py-3 font-semibold text-neutral-700 transition-colors hover:border-emerald-600 hover:text-emerald-600"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Smartphone className="h-32 w-32 text-emerald-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* eSIM Types */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            eSIM Types Available
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                icon: Globe,
                title: 'Travel Data eSIMs',
                description: 'International data eSIMs for 50+ countries including US, UK, UAE, Nigeria, Kenya, South Africa, India, and more. Perfect for travelers.',
                features: ['50+ countries', '7-30 day validity', '4G/5G speeds', 'No roaming fees'],
              },
              {
                icon: Smartphone,
                title: 'US Virtual Numbers',
                description: 'US phone numbers with voice, SMS, and data. Perfect for business, verification, and staying connected.',
                features: ['US phone number', 'Call forwarding', 'SMS receive', 'Voicemail'],
              },
            ].map((type, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <type.icon className="mb-4 h-12 w-12 text-emerald-600" />
                <h3 className="text-2xl font-bold text-neutral-900">{type.title}</h3>
                <p className="mt-3 text-neutral-600">{type.description}</p>
                <ul className="mt-6 space-y-2">
                  {type.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-neutral-600">
                      <CheckCircle className="mr-2 h-5 w-5 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Popular eSIM Destinations
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { country: 'United States', flag: '🇺🇸', data: '3GB-7D to 10GB-30D' },
              { country: 'United Kingdom', flag: '🇬🇧', data: '1GB-7D to 5GB-30D' },
              { country: 'Nigeria', flag: '🇳🇬', data: '2GB-7D to 5GB-30D' },
              { country: 'UAE', flag: '🇦🇪', data: '2GB-7D to 5GB-30D' },
              { country: 'South Africa', flag: '🇿🇦', data: '2GB-30D' },
              { country: 'Kenya', flag: '🇰🇪', data: '3GB-30D' },
              { country: 'India', flag: '🇮🇳', data: '3GB-30D' },
              { country: 'Ghana', flag: '🇬🇭', data: '1GB-7D to 5GB-30D' },
            ].map((dest, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <div className="text-4xl mb-2">{dest.flag}</div>
                <h3 className="font-bold text-neutral-900">{dest.country}</h3>
                <p className="mt-2 text-sm text-neutral-600">{dest.data}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Choose Topchart eSIM?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Activation',
                description: 'Activate your eSIM instantly after purchase. No waiting.',
              },
              {
                icon: Shield,
                title: 'No Physical SIM',
                description: 'Digital SIM means no physical card needed. Environmentally friendly.',
              },
              {
                icon: Plane,
                title: 'Travel Ready',
                description: 'Perfect for travelers. Works in 50+ countries worldwide.',
              },
              {
                icon: CheckCircle,
                title: 'Multiple Profiles',
                description: 'Store multiple eSIMs on one device. Easy switching.',
              },
              {
                icon: Globe,
                title: 'Global Coverage',
                description: 'Access to multiple networks in each country for best signal.',
              },
              {
                icon: Smartphone,
                title: 'Easy Setup',
                description: 'QR code activation. Scan and go. Simple process.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <feature.icon className="mb-4 h-12 w-12 text-emerald-600" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 bg-emerald-600">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Your eSIM?
          </h2>
          <Link
            href="/dashboard/esim"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-emerald-600 transition-colors hover:bg-neutral-100"
          >
            Get eSIM Now
            <Smartphone className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
