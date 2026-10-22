import { Metadata } from 'next';
import ConferenceCheckinClient from '@/components/conference/ConferenceCheckinClient';

export const metadata: Metadata = {
  title: 'Conference Check-in | AI Business Group',
  robots: { index: false, follow: false },
};

export default function ConferenceCheckinPage() {
  return <ConferenceCheckinClient />;
}
