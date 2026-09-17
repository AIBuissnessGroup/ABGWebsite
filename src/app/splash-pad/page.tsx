import type { Metadata } from 'next';
import SplashPadClient from '@/components/SplashPadClient';

export const metadata: Metadata = {
  title: 'Splash Pad - AI Business Group',
  description: 'AIBG Recruitment Launch Pad',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SplashPadPage() {
  return <SplashPadClient />;
}
