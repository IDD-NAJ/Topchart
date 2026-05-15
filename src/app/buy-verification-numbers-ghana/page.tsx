import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MessageCircle, Shield, Zap, Globe, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buy Verification Numbers Ghana | Cheap SMS & OTP Virtual Numbers',
  description: 'Buy cheap SMS verification numbers and OTP virtual numbers in Ghana. Get WhatsApp, Telegram, Facebook, Google verification numbers instantly. Lowest prices guaranteed.',
  keywords: [
    'buy verification numbers Ghana',
    'cheap SMS verification numbers',
    'virtual numbers for OTP',
    'WhatsApp verification number',
    'Telegram verification number',
    'temporary phone number',
    'online SMS verification',
    'cheap OTP numbers',
    'receive SMS online Ghana',
    'virtual phone number Ghana',
    'OTP verification service',
    'disposable phone number',
    'SMS receive service',
  ],
  alternates: { canonical: 'https://topchart.store/buy-verification-numbers-ghana' },
  openGraph: {
    title: 'Buy Verification Numbers Ghana | Cheap SMS & OTP Virtual Numbers',
    description: 'Get cheap SMS verification numbers and OTP virtual numbers for WhatsApp, Telegram, Facebook, Google. Instant delivery, lowest prices.',
    url: 'https://topchart.store/buy-verification-numbers-ghana',
    type: 'website',
  },
}

export default function VerificationNumbersLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Shield className="mr-2 h-4 w-4" />
                Secure & Private
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Buy Verification Numbers Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Get cheap SMS verification numbers and OTP virtual numbers for WhatsApp, Telegram, Facebook, Google, and 100+ platforms. Instant delivery, lowest prices in Ghana.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/verification"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Get Started
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

      {/* Features Section */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Choose Our Verification Numbers?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Delivery',
                description: 'Get your verification number instantly after purchase. No waiting, no delays.',
              },
              {
                icon: Globe,
                title: '100+ Platforms',
                description: 'Support for WhatsApp, Telegram, Facebook, Google, and 100+ more platforms.',
              },
              {
                icon: Shield,
                title: 'Private & Secure',
                description: 'Your privacy is protected. Numbers are disposable and not shared.',
              },
              {
                icon: MessageCircle,
                title: 'SMS Receive',
                description: 'Receive SMS messages directly on your verification number.',
              },
              {
                icon: CheckCircle,
                title: 'High Success Rate',
                description: '99.9% success rate for SMS verification across all platforms.',
              },
              {
                icon: Phone,
                title: 'Flexible Duration',
                description: 'Choose from short-term (1 hour) to long-term (30 days) rentals.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <feature.icon className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Supported Platforms
          </h2>
          <p className="mt-4 text-center text-lg text-neutral-600">
            Verification numbers for all major platforms
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'WhatsApp',
              'Telegram',
              'Facebook',
              'Instagram',
              'Twitter/X',
              'Google',
              'Microsoft',
              'LinkedIn',
              'PayPal',
              'Stripe',
              'Netflix',
              'Spotify',
              'Amazon',
              'Apple',
              'Steam',
              'Discord',
            ].map((platform, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 text-center font-semibold text-neutral-700">
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Affordable Pricing
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Short-term',
                duration: '1 Hour',
                price: 'From GHS 2',
                features: ['Perfect for quick verification', 'Auto-renewal available', 'SMS receive enabled'],
              },
              {
                name: 'Medium-term',
                duration: '3-7 Days',
                price: 'From GHS 5',
                features: ['Best value for most users', 'Multiple SMS allowed', 'Number reuse available'],
                popular: true,
              },
              {
                name: 'Long-term',
                duration: '14-30 Days',
                price: 'From GHS 15',
                features: ['Extended validity', 'Unlimited SMS', 'Priority support'],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm ${
                  plan.popular ? 'border-primary scale-105' : 'border-neutral-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-neutral-900">{plan.name}</h3>
                <p className="mt-2 text-neutral-600">{plan.duration}</p>
                <p className="mt-4 text-4xl font-bold text-primary">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-neutral-600">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/verification"
                  className="mt-8 block w-full rounded-lg bg-primary px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 bg-primary">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Your Verification Number?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of Ghanaians using Topchart for secure SMS verification
          </p>
          <Link
            href="/dashboard/verification"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-primary transition-colors hover:bg-neutral-100"
          >
            Get Your Number Now
            <Phone className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
