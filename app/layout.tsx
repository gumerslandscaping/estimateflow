import type { Metadata } from "next";
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
  title: "CotizaFlow - Send Estimates to Clients",
  description: "Create and send professional estimates and quotes to your clients instantly via email or text.",
  keywords: "estimates, quotes, landscaping, invoicing, small business",
  openGraph: {
    title: "CotizaFlow - Send Estimates to Clients",
    description: "Create and send professional estimates and quotes to your clients instantly via email or text.",
    url: "https://cotizaflow.com",
    siteName: "CotizaFlow",
    type: "website",
  },
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
