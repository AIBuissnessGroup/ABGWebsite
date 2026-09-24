import { Suspense } from 'react';
import type { Metadata } from 'next';
import AttendanceConfirmedClient from '@/components/checkin/AttendanceConfirmedClient';

export const metadata: Metadata = {
  title: 'All Checked In | Attendance Confirmed',
  description: 'Simulated attendance check-in confirmation view.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckinConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000a17] text-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      }
    >
      <AttendanceConfirmedClient />
    </Suspense>
  );
}
