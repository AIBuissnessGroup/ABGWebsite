import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Roboto } from 'next/font/google';
import Script from 'next/script';
import Navbar from "../components/Navbar";
import Providers from "@/components/Providers";

// Import production logging configuration
import "@/lib/production-logging";

const roboto = Roboto({
  subsets: ['latin'],
  weight: '700', // This loads Roboto Bold
  variable: '--font-roboto',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Business Group | University of Michigan",
  description: "Shaping the future of AI in business — one project at a time. Join ABG's mission to bridge artificial intelligence and real-world business impact at the University of Michigan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable} font-sans bg-[#00274c] text-white `}>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}

        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
