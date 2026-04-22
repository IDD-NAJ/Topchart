import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/seo/json-ld'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  const isProgrammatic = slug.startsWith('buy-') || slug.startsWith('pay-') || slug.startsWith('instant-') || slug.startsWith('cheap-') || slug.startsWith('fast-') || slug.startsWith('secure-') || slug.startsWith('virtual-') || slug.startsWith('dstv-') || slug.startsWith('vodafone-') || slug.startsWith('airtel-')
  
  if (!isProgrammatic) {
    return {}
  }

  const titleFormat = `${slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - Instant & Secure | Topchart Ghana`
  const description = `Get the best deals on ${slug.replace(/-/g, ' ')}. Fast, secure, and reliable digital services platform in Ghana with an active API available.`

  return {
    title: titleFormat,
    description: description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: titleFormat,
      description: description,
      url: `https://topchart.store/${slug}`,
    }
  }
}

export default async function ProgrammaticPage({ params }: Props) {
  const { slug } = await params

  // Verify slug format to avoid catching random invalid paths
  const isProgrammatic = slug.startsWith('buy-') || slug.startsWith('pay-') || slug.startsWith('instant-') || slug.startsWith('cheap-') || slug.startsWith('fast-') || slug.startsWith('secure-') || slug.startsWith('virtual-') || slug.startsWith('dstv-') || slug.startsWith('vodafone-') || slug.startsWith('airtel-')

  if (!isProgrammatic) {
    notFound()
  }

  const formattedTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: formattedTitle,
    description: `Instant and secure digital services platform providing ${formattedTitle}.`,
    brand: {
      '@type': 'Brand',
      name: 'Topchart'
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'GHS',
      lowPrice: '5.00',
      highPrice: '500.00',
      offerCount: '10'
    }
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://topchart.store'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: formattedTitle,
        item: `https://topchart.store/${slug}`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How to ${slug.replace(/-/g, ' ')}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can instantly ${slug.replace(/-/g, ' ')} directly on our dashboard. Simply create an account, open the relevant top-up or payment section, enter your details, and checkout via Mobile Money or API.`
        }
      },
      {
        '@type': 'Question',
        name: `Is the delivery for ${formattedTitle} instant?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Our platform processes your request within seconds.`
        }
      }
    ]
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <main className="flex-1 pt-[72px]">
        {/* HERO SECTION */}
        <section className="bg-[#0d1627] text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              {formattedTitle}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Looking for fast, cheap, and secure <strong>{slug.replace(/-/g, ' ')}</strong>? You are in the right place. Log in or connect to our API to get started in seconds.
            </p>
            <div className="mt-8">
              <a href="/register" className="inline-block bg-primary text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Get Started Instantly
              </a>
            </div>
          </div>
        </section>

        {/* CONTENT & INTERNAL LINKS */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Why choose us for {formattedTitle}?</h2>
              <p className="text-gray-700 leading-relaxed">
                When you process requests for {slug.replace(/-/g, ' ')}, you need an infrastructure-first platform that guarantees uptime. We provide the lowest latency, explicit success callbacks, and cheap bulk pricing for our digital endpoints.
              </p>
            </div>

            {/* FAQs */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="bg-white p-6 justify-center rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-lg">How to {slug.replace(/-/g, ' ')}?</h3>
                  <p className="text-gray-600 mt-2">You can instantly purchase this directly on our dashboard. Create a free account or use our API directly.</p>
                </div>
                <div className="bg-white p-6 justify-center rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-lg">Is the delivery instant?</h3>
                  <p className="text-gray-600 mt-2">Yes! We prioritize speed and process your request within seconds.</p>
                </div>
              </div>
            </div>

            {/* INTERNAL LINKING / SILO */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
              <h3 className="font-semibold text-blue-900 mb-4">Quick Links to Related Services</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-700">
                <li><a href="/buy-airtime-online-ghana" className="hover:underline">buy airtime now</a></li>
                <li><a href="/cheap-mobile-data-ghana" className="hover:underline">get instant data bundle</a></li>
                <li><a href="/pay-electricity-bill-online-ghana" className="hover:underline">pay your bills online</a></li>
                <li><a href="/buy-usa-phone-number-online" className="hover:underline">purchase usa number</a></li>
                <li><a href="/buy-residential-proxies-africa" className="hover:underline">access premium proxies</a></li>
                <li><a href="/buy-amazon-gift-card-usa" className="hover:underline">buy gift cards instantly</a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
