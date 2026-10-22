import { Metadata } from 'next';
import ConferenceBackgroundClient from '@/components/conference/ConferenceBackgroundClient';

export const metadata: Metadata = {
  title: 'Conference Stage Backgrounds | AI Business Group',
  robots: { index: false, follow: false },
};

export default async function ConferenceBackgroundPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; demo?: string; from?: string; shot?: string }>;
}) {
  const { s, demo, from, shot } = await searchParams;
  return <ConferenceBackgroundClient sessionId={s} demo={demo === '1'} skipIntro={from === 'outro'} shot={shot === '1'} />;
}
