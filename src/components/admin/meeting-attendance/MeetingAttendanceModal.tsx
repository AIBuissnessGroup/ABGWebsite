'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CalendarDaysIcon, 
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import MeetingsTab from './MeetingsTab';
import AttendanceTab from './AttendanceTab';

interface MeetingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'meetings' | 'attendance';
}

export default function MeetingAttendanceModal({
  isOpen,
  onClose,
  defaultTab = 'meetings',
}: MeetingAttendanceModalProps) {
  const [activeTab, setActiveTab] = useState<'meetings' | 'attendance'>(defaultTab);

  // Sync default tab if it changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-gray-50/95 w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200/80 px-6 py-5 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00274c] to-blue-700 text-white flex items-center justify-center shadow-md">
              <CalendarDaysIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">Meeting Attendance</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Admin Tool
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage general & education meetings, generate live QR check-ins, and track member attendance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            title="Close Dashboard (Esc)"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white border-b border-gray-200/80 px-6 pt-2 flex items-center justify-between">
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

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fast QR check-in active</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {activeTab === 'meetings' ? <MeetingsTab /> : <AttendanceTab />}
        </div>
      </div>
    </div>
  );
}
