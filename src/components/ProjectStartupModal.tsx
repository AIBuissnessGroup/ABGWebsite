'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectStartupChat from './ProjectStartupChat';

interface ProjectStartupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectStartupModal({ isOpen, onClose }: ProjectStartupModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-slate-900 rounded-2xl shadow-2xl z-[9999] overflow-hidden border border-blue-700/50"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 transition-colors backdrop-blur-sm border border-slate-600/50"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Chat Component */}
            <div className="w-full h-full">
              <ProjectStartupChat />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
