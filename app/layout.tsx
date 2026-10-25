import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tells Google what CotizaFlow is, who makes it, and that Elvis Teran founded it.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cotizaflow.com/#org",
      name: "CotizaFlow",
      url: "https://cotizaflow.com",
      logo: "https://cotizaflow.com/icon-512.png",
      founder: { "@id": "https://cotizaflow.com/about#elvis" },
    },
    {
      "@type": "Person",
      "@id": "https://cotizaflow.com/about#elvis",
      name: "Elvis Teran",
      jobTitle: "Founder",
      url: "https://cotizaflow.com/about",
      worksFor: [{ "@id": "https://cotizaflow.com/#org" }, { "@type": "Organization", name: "Gumers Landscaping", url: "https://gumerslandscape.com" }],
    },
    {
      "@type": "SoftwareApplication",
      name: "CotizaFlow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description: "Estimating and invoicing software for landscapers and the trades.",
      url: "https://cotizaflow.com",
      offers: { "@type": "Offer", price: "19.00", priceCurrency: "USD", description: "14-day free trial, then $19/month" },
      publisher: { "@id": "https://cotizaflow.com/#org" },
      author: { "@id": "https://cotizaflow.com/about#elvis" },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cotizaflow.com"),
  authors: [{ name: "Elvis Teran", url: "https://cotizaflow.com/about" }],
  creator: "Elvis Teran",
  title: "CotizaFlow - Estimating & Invoicing Software for Landscapers",
  description: "Create and send professional estimates and invoices to your clients in minutes by email or text. Track who's paid. Built by a landscaper in Chicago.",
  keywords: "estimating software, invoicing software, estimates, invoices, quotes, landscaping, contractors, small business",
  openGraph: {
    title: "CotizaFlow - Estimating & Invoicing Software for Landscapers",
    description: "Create and send professional estimates and invoices to your clients in minutes by email or text. Track who's paid. Built by a landscaper in Chicago.",
    url: "https://cotizaflow.com",
    siteName: "CotizaFlow",
    type: "website",
  },
  applicationName: "CotizaFlow",
  appleWebApp: {
    capable: true,
    title: "CotizaFlow",
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Older iPhones only open full screen from the home screen with this tag.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0d1f0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
