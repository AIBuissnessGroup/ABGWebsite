'use client';
import { useEffect, useState } from 'react';

export default function MemberLevelsPage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch('/api/recruitment/member-levels')
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  const generalBullets: string[] = content?.generalBullets || [];
  const projectBullets: string[] = content?.projectBullets || [];
  const footerLines: string[] = content?.footerLines || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="heading-primary text-4xl sm:text-5xl" style={{ color: 'white' }}>
            {content?.heroTitle || 'RECRUITMENT – MEMBER LEVELS'}
          </h1>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'white' }}>{content?.generalTitle || 'General Member:'}</h2>
            <ul className="space-y-3 list-disc pl-5">
              {generalBullets.map((b, i) => (
                <li key={i} style={{ color: '#BBBBBB' }}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4" style={{ color: 'white' }}>{content?.projectTitle || 'Project Team Member:'}</h2>
            <ul className="space-y-3 list-disc pl-5">
              {projectBullets.map((b, i) => (
                <li key={i} style={{ color: '#BBBBBB' }}>{b}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-card p-6">
          {footerLines.map((line, i) => (
            <p key={i} className="mb-3" style={{ color: '#BBBBBB' }}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}


