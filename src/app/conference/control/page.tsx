import { Metadata } from 'next';
import ConferenceStageControlClient from '@/components/conference/ConferenceStageControlClient';

export const metadata: Metadata = {
  title: 'Stage Remote | AI Business Group',
  robots: { index: false, follow: false },
};

export default function ConferenceStageControlPage() {
  return <ConferenceStageControlClient />;
}
