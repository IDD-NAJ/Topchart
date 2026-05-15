import { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Shield, Clock, CheckCircle, CreditCard, Bolt } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ECG Payment Ghana | Pay Electricity Bill Online Cheap & Instant',
  description: 'Pay ECG electricity bill online in Ghana at cheap prices. Instant ECG prepaid and postpaid payment via MoMo. Lowest prices guaranteed.',
  keywords: [
    'ECG payment Ghana',
    'pay electricity bill Ghana',
    'ECG prepaid Ghana',
    'ECG postpaid payment',
    'cheap electricity Ghana',
    'instant ECG payment',
    'ECG bill payment online',
    'pay ECG via MoMo',
    'electricity bill Ghana',
    'utility bill payment',
  ],
  alternates: { canonical: 'https://topchart.store/ecg-payment-ghana' },
  openGraph: {
    title: 'ECG Payment Ghana | Pay Electricity Bill Online',
    description: 'Pay ECG electricity bill online in Ghana at cheap prices. Instant ECG prepaid and postpaid payment via MoMo.',
    url: 'https://topchart.store/ecg-payment-ghana',
    type: 'website',
  },
}

export default function ECGPaymentLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-yellow-600/10 px-4 py-2 text-sm font-semibold text-yellow-600">
                <Bolt className="mr-2 h-4 w-4" />
                Electricity Payment
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                ECG Payment Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Pay ECG electricity bill online in Ghana at cheap prices. Instant ECG prepaid and postpaid payment via MTN MoMo, Telecel Cash, AirtelTigo Money. No extra fees, lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/bills"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Pay ECG Bill
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Bolt className="h-32 w-32 text-yellow-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            ECG Payment Options
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                name: 'ECG Prepaid',
                description: 'Pay for ECG prepaid meters. Enter your meter number and top up instantly.',
                icon: Bolt,
              },
              {
                name: 'ECG Postpaid',
                description: 'Pay ECG postpaid bills. Enter your account number and settle your bill instantly.',
                icon: CreditCard,
              },
            ].map((option, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <option.icon className="mb-4 h-12 w-12 text-yellow-600" />
                <h3 className="text-2xl font-bold text-neutral-900">{option.name}</h3>
                <p className="mt-3 text-neutral-600">{option.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Why Pay ECG with Topchart?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Processing',
                description: 'Your ECG payment is processed instantly after payment.',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money.',
              },
              {
                icon: Clock,
                title: '24/7 Service',
                description: 'Pay ECG anytime, day or night.',
              },
              {
                icon: CheckCircle,
                title: 'No Extra Fees',
                description: 'Pay exactly what you see. No hidden charges.',
              },
              {
                icon: Bolt,
                title: 'Both Prepaid & Postpaid',
                description: 'Support for both ECG prepaid meters and postpaid accounts.',
              },
              {
                icon: CreditCard,
                title: 'Easy Process',
                description: 'Enter meter/account number, select amount, pay. Done.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <feature.icon className="mb-4 h-12 w-12 text-yellow-600" />
                <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 bg-yellow-600">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Pay Your ECG Bill?
          </h2>
          <Link
            href="/dashboard/bills"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-yellow-600 transition-colors hover:bg-neutral-100"
          >
            Pay ECG Now
            <Bolt className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
