import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, Zap, Shield, Clock, CheckCircle, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'WAEC Result Checker Ghana | Buy WAEC Checker Online Instant',
  description: 'Buy WAEC result checker online in Ghana instantly. Cheap WAEC checker vouchers for WASSCE results. Instant PIN delivery via MoMo.',
  keywords: [
    'WAEC result checker Ghana',
    'buy WAEC checker online',
    'WASSCE result checker',
    'WAEC checker voucher',
    'cheap WAEC checker',
    'instant WAEC result checker',
    'WAEC PIN Ghana',
    'buy result checker Ghana',
    'WASSCE checker online',
    'exam result voucher',
    'WAEC verification',
  ],
  alternates: { canonical: 'https://topchart.store/waec-result-checker-ghana' },
  openGraph: {
    title: 'WAEC Result Checker Ghana | Buy WAEC Checker Online Instant',
    description: 'Buy WAEC result checker online in Ghana instantly. Cheap WAEC checker vouchers for WASSCE results.',
    url: 'https://topchart.store/waec-result-checker-ghana',
    type: 'website',
  },
}

export default function WAECCheckerLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <GraduationCap className="mr-2 h-4 w-4" />
                WAEC Ghana
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                WAEC Result Checker Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy WAEC result checker online in Ghana instantly. Cheap WAEC checker vouchers for WASSCE and BECE results. Instant PIN and serial number delivery via MoMo. Lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/result-checkers"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy WAEC Checker
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
                <GraduationCap className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Types */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Result Checkers Available
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                name: 'WAEC WASSCE',
                description: 'West African Senior School Certificate Examination checker.',
                icon: GraduationCap,
              },
              {
                name: 'BECE',
                description: 'Basic Education Certificate Examination checker.',
                icon: FileText,
              },
              {
                name: 'NOVDEC',
                description: 'November/December private candidates checker.',
                icon: FileText,
              },
            ].map((exam, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <exam.icon className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">{exam.name}</h3>
                <p className="mt-3 text-neutral-600">{exam.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Buy WAEC Checker from Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant PIN Delivery',
                description: 'Get your WAEC checker PIN instantly after payment.',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money.',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Buy result checker anytime, day or night.',
              },
              {
                icon: CheckCircle,
                title: 'Valid PINs',
                description: 'All PINs are valid and verified from WAEC.',
              },
              {
                icon: FileText,
                title: 'Serial Number Included',
                description: 'Get both PIN and serial number for complete access.',
              },
              {
                icon: GraduationCap,
                title: 'Wholesale for Resellers',
                description: 'Resellers get wholesale prices on bulk purchases.',
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

      {/* How It Works */}
      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            How to Check Your Results
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Buy Checker',
                description: 'Purchase WAEC result checker voucher from Topchart.',
              },
              {
                step: '2',
                title: 'Get PIN',
                description: 'Receive instant PIN and serial number after payment.',
              },
              {
                step: '3',
                title: 'Visit WAEC Portal',
                description: 'Go to WAEC result checking portal with your details.',
              },
              {
                step: '4',
                title: 'Check Results',
                description: 'Enter PIN and serial number to view your results.',
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
            Ready to Check Your WAEC Results?
          </h2>
          <Link
            href="/dashboard/result-checkers"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-primary transition-colors hover:bg-neutral-100"
          >
            Buy WAEC Checker
            <GraduationCap className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
