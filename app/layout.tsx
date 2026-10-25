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

export const metadata: Metadata = {
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
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
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
        {children}
      </body>
    </html>
  );
}
