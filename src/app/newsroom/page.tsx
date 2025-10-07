import NewsroomClient from '@/components/newsroom/NewsroomClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Newsroom | AI Business Group',
  description: 'Stay updated with the latest news, insights, and stories from the AI Business Group at the University of Michigan.',
  openGraph: {
    title: 'Newsroom | AI Business Group',
    description: 'Stay updated with the latest news, insights, and stories from the AI Business Group at the University of Michigan.',
    type: 'website',
    url: '/newsroom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Newsroom | AI Business Group',
    description: 'Stay updated with the latest news, insights, and stories from the AI Business Group at the University of Michigan.',
  },
};

export default function NewsroomPage() {
  return <NewsroomClient />;
}