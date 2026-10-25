import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://cotizaflow.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://cotizaflow.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
