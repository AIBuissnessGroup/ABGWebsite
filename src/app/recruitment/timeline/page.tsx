'use client';
import { useEffect, useState } from 'react';

export default function RecruitmentTimelinePage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/recruitment/timeline')
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  const openItems: string[] = content?.openItems || [];
  const closedItems: string[] = content?.closedItems || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="heading-primary text-4xl sm:text-5xl" style={{ color: 'white' }}>
            {content?.heroTitle || 'RECRUITMENT TIMELINE'}
          </h1>
        </header>

        <div className="glass-card p-6 sm:p-8 mb-6 text-center">
          <h2 className="font-bold mb-4" style={{ color: 'white' }}>– {content?.openRoundTitle || 'OPEN ROUND'} –</h2>
          <div className="space-y-4">
            {openItems.map((item, i) => (
              <p key={i} className="text-lg" style={{ color: 'white' }}>{item}</p>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 text-center">
          <h2 className="font-bold mb-4" style={{ color: 'white' }}>– {content?.closedRoundTitle || 'CLOSED ROUND'} –</h2>
          <div className="space-y-4">
            {closedItems.map((item, i) => (
              <p key={i} className="text-lg" style={{ color: 'white' }}>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


