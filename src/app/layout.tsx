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
  title: "🔥 Extreme Load Testing - SSR + CSR",
  description: "Heavy load testing page with Server-Side Rendering and Client-Side Rendering capabilities",
  keywords: ["load testing", "performance", "SSR", "CSR", "Next.js", "heavy", "stress test"],
  authors: [{ name: "Load Test Suite" }],
  openGraph: {
    title: "🔥 Extreme Load Testing Page",
    description: "Heavy load testing page with SSR and CSR capabilities",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "🔥 Extreme Load Testing Page",
    description: "Heavy load testing page with SSR and CSR capabilities",
  },
  robots: {
    index: false, // Don't index load testing pages
    follow: false,
  },
  other: {
    "load-test": "true",
    "performance-heavy": "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for load testing */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="load-test-page" content="true" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Performance monitoring script placeholder */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring for load testing
              if (typeof window !== 'undefined') {
                window.loadTestMetrics = {
                  startTime: performance.now(),
                  renderType: 'SSR+CSR'
                };
                console.log('🔥 Load test page initialized:', window.loadTestMetrics);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
