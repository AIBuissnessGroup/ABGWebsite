import { Metadata } from 'next';
import SXSWPageClient from '@/components/sxsw/SXSWPageClient';

export const metadata: Metadata = {
  title: 'Hail to the Innovators | University of Michigan @ SXSW 2026',
  description: 'Join us at SXSW 2026 for Hail to the Innovators - University of Michigan\'s flagship presence bringing together founders, innovators, creatives, students, and industry leaders for a day of conversation, discovery, and connection.',
  keywords: ['SXSW', 'University of Michigan', 'AI Business Group', 'Innovation', 'Austin', 'Technology', 'Entrepreneurship', 'Networking'],
  openGraph: {
    title: 'Hail to the Innovators | University of Michigan @ SXSW 2026',
    description: 'University of Michigan\'s flagship presence at SXSW 2026 - Panels on AI, Entrepreneurship, Live demos, and Innovation showcases.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hail to the Innovators | UMich at SXSW 2026',
    description: 'Join University of Michigan @ SXSW 2026 for panels on AI, entrepreneurship, live demos, and networking.',
  },
};

export default function SXSWPage() {
  return <SXSWPageClient />;
}
