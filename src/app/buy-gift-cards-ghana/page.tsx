import { Metadata } from 'next'
import Link from 'next/link'
import { Gift, Zap, Shield, Clock, CheckCircle, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buy Gift Cards Ghana | Netflix, Spotify, Amazon Gift Cards Online',
  description: 'Buy digital gift cards in Ghana. Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, Airbnb gift cards available. Instant delivery.',
  keywords: [
    'buy gift cards Ghana',
    'Netflix gift card Ghana',
    'Spotify gift card Ghana',
    'Amazon gift card Ghana',
    'digital gift cards',
    'gift card deals Ghana',
    'buy Netflix voucher Ghana',
    'Spotify premium Ghana',
    'Steam gift card Ghana',
    'iTunes gift card Ghana',
    'PlayStation gift card',
    'Xbox gift card',
  ],
  alternates: { canonical: 'https://topchart.store/buy-gift-cards-ghana' },
  openGraph: {
    title: 'Buy Gift Cards Ghana | Netflix, Spotify, Amazon Gift Cards',
    description: 'Buy digital gift cards in Ghana. Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, Airbnb gift cards.',
    url: 'https://topchart.store/buy-gift-cards-ghana',
    type: 'website',
  },
}

export default function GiftCardsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <section className="relative overflow-hidden border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-pink-600/10 px-4 py-2 text-sm font-semibold text-pink-600">
                <Gift className="mr-2 h-4 w-4" />
                Digital Gift Cards
              </div>
              <h1 className="text-balance text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
                Buy Gift Cards Ghana
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 leading-relaxed">
                Buy digital gift cards in Ghana instantly. Netflix, Spotify, Amazon, Google Play, iTunes, Steam, PlayStation, Xbox, Uber, Airbnb gift cards available. Instant delivery via email. Lowest prices guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dashboard/giftcards"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Buy Gift Cards
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
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600/20 to-pink-600/5 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-32 w-32 text-pink-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            Popular Gift Cards
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Netflix',
                description: 'Streaming entertainment gift card',
                icon: '🎬',
              },
              {
                name: 'Spotify',
                description: 'Music streaming gift card',
                icon: '🎵',
              },
              {
                name: 'Amazon',
                description: 'Shopping gift card',
                icon: '📦',
              },
              {
                name: 'Google Play',
                description: 'Android apps and games',
                icon: '▶️',
              },
              {
                name: 'iTunes',
                description: 'Apple music and apps',
                icon: '🍎',
              },
              {
                name: 'Steam',
                description: 'PC gaming gift card',
                icon: '🎮',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="text-2xl font-bold text-neutral-900">{card.name}</h3>
                <p className="mt-3 text-neutral-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200/40 px-4 py-20 sm:px-6 bg-neutral-50">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
            More Gift Card Brands
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'PlayStation',
              'Xbox',
              'Uber',
              'Airbnb',
            ].map((brand, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 text-center font-semibold text-neutral-700">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 bg-pink-600">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Buy Gift Cards?
          </h2>
          <Link
            href="/dashboard/giftcards"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-semibold text-pink-600 transition-colors hover:bg-neutral-100"
          >
            Buy Gift Cards Now
            <Gift className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
