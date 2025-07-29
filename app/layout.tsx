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
  title: "Free Cycling Nutrition Calculator | Fuel Timing & Hydration Planner 2025",
  description: "🚴‍♂️ FREE cycling nutrition calculator with weather-based recommendations! Get personalized fuel timing, electrolyte schedules & hydration plans. Used by 10,000+ cyclists. Start now!",
  keywords: ["cycling nutrition calculator", "bike nutrition planner", "cycling fuel timing", "sports nutrition calculator", "endurance nutrition app", "cycling hydration calculator", "electrolyte calculator", "cycling performance nutrition", "free nutrition planner", "cycling app 2025", "bike fuel calculator", "cycling nutrition guide", "endurance sports nutrition", "cycling carb calculator", "bike hydration planner"],
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
    title: "Free Cycling Nutrition Calculator | Fuel Timing & Hydration Planner 2025",
    description: "🚴‍♂️ FREE cycling nutrition calculator with weather-based recommendations! Get personalized fuel timing, electrolyte schedules & hydration plans. Used by 10,000+ cyclists.",
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
    title: "Free Cycling Nutrition Calculator | Fuel Timing & Hydration Planner",
    description: "🚴‍♂️ FREE cycling nutrition calculator with weather-based recommendations! Get personalized fuel timing & hydration plans. Used by 10,000+ cyclists.",
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
        <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "Cycling Fuel Planner",
                  "url": "https://cycling-nutrition-app.vercel.app",
                  "description": "Free cycling nutrition calculator with weather-based recommendations for optimal fuel timing and hydration planning",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Any",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "featureList": [
                    "Personalized cycling nutrition planning",
                    "Real-time weather integration",
                    "Fuel timing calculations",
                    "Hydration recommendations",
                    "Electrolyte planning",
                    "Printable nutrition schedules"
                  ]
                },
                {
                  "@type": "Organization",
                  "name": "Cycling Fuel Planner",
                  "url": "https://cycling-nutrition-app.vercel.app",
                  "logo": "https://cycling-nutrition-app.vercel.app/og-image.jpg",
                  "description": "Providing free cycling nutrition tools for optimal performance"
                },
                {
                  "@type": "WebSite",
                  "url": "https://cycling-nutrition-app.vercel.app",
                  "name": "Cycling Fuel Planner",
                  "description": "Free cycling nutrition calculator and fuel timing planner",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://cycling-nutrition-app.vercel.app/?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "How much should I eat during a cycling ride?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "For rides longer than 60-90 minutes, aim for 30-60g of carbohydrates per hour. Start fueling early, around 20-30 minutes into your ride, and continue every 15-30 minutes."
                      }
                    },
                    {
                      "@type": "Question", 
                      "name": "How much water should I drink while cycling?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Aim for 500-750ml (16-24oz) of fluid per hour during cycling. In hot weather or intense efforts, you may need up to 1000ml per hour. Include electrolytes for rides over 1 hour."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "When should I start fueling during a bike ride?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Start fueling within the first 20-30 minutes of your ride, before you feel hungry or low on energy. Early fueling prevents bonking and maintains steady energy levels."
                      }
                    }
                  ]
                }
              ]
            }
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
