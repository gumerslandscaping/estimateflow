import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Elvis Teran | Founder of CotizaFlow & Owner of Gumers Landscaping',
  description:
    'Elvis Teran is the owner of Gumers Landscaping in the Chicago area and the founder of CotizaFlow, estimating and invoicing software built for landscapers and the trades.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Elvis Teran | Founder of CotizaFlow',
    description: 'Landscaper, business owner, and founder of CotizaFlow, estimating and invoicing software for the trades.',
    url: 'https://cotizaflow.com/about',
    type: 'profile',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Gumers Landscaping logo' }],
  },
}

const GOLD = '#f5a623'
const BG = '#0d1f0d'
const CARD = '#152615'
const BORDER = '#2a4a2a'
const TEXT = '#e8f5e8'
const MUTED = '#8fb08f'

// Tells Google who Elvis is and how he's connected to CotizaFlow and Gumers Landscaping.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: 'Elvis Teran',
    alternateName: 'E',
    jobTitle: 'Founder & Owner',
    url: 'https://cotizaflow.com/about',
    image: 'https://cotizaflow.com/icon-512.png',
    homeLocation: { '@type': 'Place', name: 'Chicago, Illinois' },
    worksFor: [
      { '@type': 'Organization', name: 'Gumers Landscaping', url: 'https://gumerslandscape.com' },
      { '@type': 'Organization', name: 'CotizaFlow', url: 'https://cotizaflow.com' },
    ],
    knowsAbout: ['Landscaping', 'Hardscaping', 'Snow removal', 'Estimating software', 'Invoicing software', 'Small business'],
  },
}

export default function AboutPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, gap: 12, flexWrap: 'wrap' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: TEXT }}>
          <Image src="/logo.png" alt="CotizaFlow" width={36} height={36} style={{ borderRadius: 8, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 18 }}>CotizaFlow</span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/" style={{ color: MUTED, textDecoration: 'none', fontSize: 14 }}>Home</a>
          <a href="/login" style={{ color: '#000', background: GOLD, padding: '8px 16px', borderRadius: 8, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Sign In</a>
        </div>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>About the Founder</div>
        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 24px' }}>
          Elvis Teran
        </h1>
        <p style={{ fontSize: 18, color: GOLD, fontWeight: 600, margin: '0 0 32px' }}>
          Owner of Gumers Landscaping · Founder of CotizaFlow · Chicago, IL
        </p>

        <div style={{ display: 'grid', gap: 18, fontSize: 17, lineHeight: 1.8, color: MUTED }}>
          <p style={{ margin: 0 }}>
            Elvis Teran is the owner of <strong style={{ color: TEXT }}>Gumers Landscaping</strong>, a landscaping company serving the Chicago area since 2023. The company provides landscaping, hardscaping, lawn care, and snow removal for homeowners and properties across the northwest suburbs.
          </p>
          <p style={{ margin: 0 }}>
            Running the business day to day showed him how much time contractors lose to paperwork. Estimates were written by hand, invoices were built one at a time, and keeping track of payments took far too long. So Elvis built his own solution: <strong style={{ color: TEXT }}>CotizaFlow</strong>, estimating and invoicing software designed for landscapers and the trades.
          </p>
          <p style={{ margin: 0 }}>
            With CotizaFlow, contractors can send professional estimates and invoices in minutes from their phone, turn an estimate into an invoice with one tap, and see who has paid at a glance. Elvis uses it every day at Gumers Landscaping, and he built it to help other hardworking business owners do the same.
          </p>
        </div>

        <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/#signup" style={{ background: GOLD, color: '#000', padding: '14px 26px', borderRadius: 10, fontWeight: 900, textDecoration: 'none' }}>Try CotizaFlow Free →</a>
          <a href="https://gumerslandscape.com" style={{ border: `1px solid ${BORDER}`, background: CARD, color: TEXT, padding: '14px 26px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Visit Gumers Landscaping</a>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
        © 2026 CotizaFlow · Built by Elvis Teran in Chicago
      </footer>
    </div>
  )
}
