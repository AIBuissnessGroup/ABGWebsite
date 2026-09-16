import { Metadata } from 'next';
import ConferencePageClient from '@/components/conference/ConferencePageClient';

export const metadata: Metadata = {
  title: 'Michigan AI Business Conference 2026 | University of Michigan',
  description: "The Michigan AI Business Conference, hosted by the University of Michigan's AI Business Group, is a full-day event bringing together students, faculty, and industry leaders to explore AI's impact across finance, venture capital, and business strategy on Friday, October 23, 2026 at the Stephen M. Ross School of Business.",
  keywords: [
    'Michigan AI Business Conference',
    'University of Michigan',
    'AI Business Group',
    'Ross School of Business',
    'AI Finance',
    'Venture Capital',
    'Business Strategy',
    'Ann Arbor AI Event',
    'Artificial Intelligence Conference',
  ],
  openGraph: {
    title: 'Michigan AI Business Conference 2026',
    description: "Full-day conference exploring AI's impact across finance, venture capital, and business strategy at the Stephen M. Ross School of Business.",
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Michigan AI Business Conference',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Michigan AI Business Conference 2026 | UMich ABG',
    description: "Join us Friday, Oct 23, 2026 at Ross School of Business for keynote speakers, expert panels, and 300+ attendees.",
  },
};

export default function ConferencePage() {
  return <ConferencePageClient />;
}
