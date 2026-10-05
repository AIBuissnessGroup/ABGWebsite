import { Suspense } from 'react';
import type { Metadata } from 'next';
import MeetingCheckinClient from '@/components/checkin/MeetingCheckinClient';

export const metadata: Metadata = {
  title: 'Meeting Attendance Check-In | AI Business Group',
  description: 'Fast attendance check-in for ABG meetings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MeetingCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000a17] text-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      }
    >
      <MeetingCheckinClient meetingId={id} />
    </Suspense>
  );
}
