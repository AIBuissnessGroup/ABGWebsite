'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  EnvelopeIcon, 
  AcademicCapIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecruitmentConnect } from '@/types/recruitment';

interface RecruitmentConnectsProps {
  connects: RecruitmentConnect[];
}

export default function RecruitmentConnects({ connects }: RecruitmentConnectsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!connects || connects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-[#00274C] to-[#1e3a5f] hover:from-[#001d3d] hover:to-[#152f4f] transition-all"
        style={{ color: '#ffffff' }}
      >
        <div className="flex items-center gap-2" style={{ color: '#ffffff' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffffff" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Recruitment Connects</span>
        </div>
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffffff" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffffff" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Anonymity Notice - Always visible when expanded */}
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">🔒 You will remain anonymous!</span>
              </div>
              <p className="text-xs text-amber-700">
                These contacts will <strong>never</strong> share what you ask with anyone reviewing 
                applications. Feel free to ask any question - even ones you think are &quot;dumb&quot;. 
                Your curiosity won&apos;t affect your application!
              </p>
            </div>

            {/* Connects List */}
            <div className="divide-y divide-gray-100">
              {connects.map((connect, index) => (
                <div 
                  key={`${connect.email}-${index}`}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Photo */}
                    {connect.photo ? (
                      <Image
                        src={connect.photo}
                        alt={connect.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00274C] to-[#1e3a5f] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                        {connect.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{connect.name}</h4>
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                        <AcademicCapIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{connect.major}</span>
                      </div>

                      {connect.roleLastSemester && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {connect.roleLastSemester}
                        </p>
                      )}

                      {/* Email Button */}
                      <a
                        href={`mailto:${connect.email}?subject=Question about ABG Recruitment`}
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <EnvelopeIcon className="w-3.5 h-3.5" />
                        Email Me
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tech Support */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                  🛠️
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">Tech Support</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Website issues or technical problems
                  </p>
                  <a
                    href="mailto:abgtech@umich.edu?subject=ABG Portal - Tech Support"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <EnvelopeIcon className="w-3.5 h-3.5" />
                    abgtech@umich.edu
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Have questions? Reach out! We&apos;re here to help. 💬
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
