import { MetadataRoute } from 'next'

// Lets Google crawl the public pages and points it to the sitemap; keeps app pages out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/doc', '/api/'] },
    sitemap: 'https://cotizaflow.com/sitemap.xml',
  }
}
