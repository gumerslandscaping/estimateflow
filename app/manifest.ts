import type { MetadataRoute } from 'next'

// Makes CotizaFlow installable ("Add to Home Screen") with its own icon and full-screen window.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CotizaFlow',
    short_name: 'CotizaFlow',
    description: 'Estimates and invoices for landscapers and trades.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d1f0d',
    theme_color: '#0d1f0d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
