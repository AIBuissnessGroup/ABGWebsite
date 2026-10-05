'use client';

import { useState } from 'react';
import { CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import MeetingsTab from '@/components/admin/meeting-attendance/MeetingsTab';
import AttendanceTab from '@/components/admin/meeting-attendance/AttendanceTab';

export default function AdminMeetingsPage() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'attendance'>('meetings');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meeting Attendance</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Tool
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">
            Track General & Education meetings, generate check-in QR codes, and view member attendance history.
          </p>
        </div>
      </div>

      {/* Tabs Switcher Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'meetings'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span>Meetings</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span>Attendance</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'meetings' ? <MeetingsTab /> : <AttendanceTab />}
        </div>
      </div>
    </div>
  );
}
