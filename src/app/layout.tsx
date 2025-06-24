import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Roboto } from 'next/font/google';
import Navbar from "../components/Navbar";
import Providers from "@/components/Providers";

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
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable} font-sans bg-[#00274c] text-white `}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
