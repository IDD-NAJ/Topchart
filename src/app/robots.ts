import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/dashboard/settings',
          '/dashboard/history',
          '/dashboard/wallet',
          '/dashboard/tickets',
          '/admin',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/dashboard/settings',
          '/dashboard/history',
          '/dashboard/wallet',
          '/dashboard/tickets',
          '/admin',
        ],
      },
    ],
    sitemap: 'https://topchart.store/sitemap.xml',
    host: 'https://topchart.store',
  }
}
