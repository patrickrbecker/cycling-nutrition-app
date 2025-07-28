import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Cycling Fuel Planner - Smart Nutrition Timing for Peak Performance",
  description: "Personalized cycling nutrition planner with real-time weather integration. Get smart fuel timing, electrolyte recommendations, and hydration schedules for optimal cycling performance.",
  keywords: ["cycling nutrition", "bike nutrition", "cycling fuel", "sports nutrition", "endurance nutrition", "cycling hydration", "electrolytes", "cycling performance", "nutrition planner", "cycling app"],
  authors: [{ name: "Cycling Fuel Planner" }],
  creator: "Cycling Fuel Planner",
  publisher: "Cycling Fuel Planner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cycling-nutrition-app.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Cycling Fuel Planner - Smart Nutrition Timing for Peak Performance",
    description: "Personalized cycling nutrition planner with real-time weather integration. Get smart fuel timing, electrolyte recommendations, and hydration schedules.",
    url: 'https://cycling-nutrition-app.vercel.app',
    siteName: 'Cycling Fuel Planner',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Cycling Fuel Planner - Smart Nutrition Timing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Cycling Fuel Planner - Smart Nutrition Timing",
    description: "Personalized cycling nutrition planner with real-time weather integration for optimal performance.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P468QE4SW7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P468QE4SW7');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
