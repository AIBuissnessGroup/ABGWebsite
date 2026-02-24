'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ClipboardIcon, CheckIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Overlay configuration types
interface OverlayConfig {
  id: string;
  name: string;
  description: string;
  route: string;
  params: ParamConfig[];
}

interface ParamConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  defaultValue: string;
  placeholder?: string;
}

// All available overlays
const overlays: OverlayConfig[] = [
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    description: 'Pre-show countdown with schedule',
    route: '/sxsw/overlay/soft-opening',
    params: [
      { key: 'title', label: 'Event Title', type: 'text', defaultValue: 'HAIL TO THE INNOVATORS' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'University of Michigan @ SXSW' },
      { key: 'minutes', label: 'Countdown Minutes', type: 'number', defaultValue: '14' },
      { key: 'seconds', label: 'Countdown Seconds', type: 'number', defaultValue: '32' },
      { key: 'upnext', label: 'Up Next Event (0-3)', type: 'number', defaultValue: '0', placeholder: '0 = first item highlighted' },
      { key: 'e1_title', label: 'Event 1 Title', type: 'text', defaultValue: 'Preshow & Networking' },
      { key: 'e1_time', label: 'Event 1 Time', type: 'text', defaultValue: '10:30 AM' },
      { key: 'e1_desc', label: 'Event 1 Description', type: 'text', defaultValue: '', placeholder: 'Short description' },
      { key: 'e2_title', label: 'Event 2 Title', type: 'text', defaultValue: 'Panel 1: AI Transformation' },
      { key: 'e2_time', label: 'Event 2 Time', type: 'text', defaultValue: '11:00 AM' },
      { key: 'e2_desc', label: 'Event 2 Description', type: 'text', defaultValue: '', placeholder: 'Short description' },
      { key: 'e3_title', label: 'Event 3 Title', type: 'text', defaultValue: 'Panel 2: Student Builders' },
      { key: 'e3_time', label: 'Event 3 Time', type: 'text', defaultValue: '12:00 PM' },
      { key: 'e3_desc', label: 'Event 3 Description', type: 'text', defaultValue: '', placeholder: 'Short description' },
      { key: 'e4_title', label: 'Event 4 Title', type: 'text', defaultValue: 'Lunch & Demos' },
      { key: 'e4_time', label: 'Event 4 Time', type: 'text', defaultValue: '1:00 PM' },
      { key: 'e4_desc', label: 'Event 4 Description', type: 'text', defaultValue: '', placeholder: 'Short description' },
    ]
  },
  {
    id: 'lower-third',
    name: 'Panel Lower Third',
    description: 'Speaker identification overlay',
    route: '/sxsw/overlay/lower-third',
    params: [
      { key: 'panel', label: 'Panel Number', type: 'text', defaultValue: '1' },
      { key: 'title', label: 'Panel Title', type: 'text', defaultValue: 'The AI Transformation' },
      { key: 'mod_name', label: 'Moderator Name', type: 'text', defaultValue: 'Jane Doe' },
      { key: 'mod_role', label: 'Moderator Role', type: 'text', defaultValue: 'ABG President' },
      { key: 'mod_image', label: 'Moderator Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 's1_name', label: 'Speaker 1 Name', type: 'text', defaultValue: 'John Smith' },
      { key: 's1_role', label: 'Speaker 1 Role', type: 'text', defaultValue: 'Partner, DVP' },
      { key: 's1_image', label: 'Speaker 1 Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 's2_name', label: 'Speaker 2 Name', type: 'text', defaultValue: 'Sarah Chen' },
      { key: 's2_role', label: 'Speaker 2 Role', type: 'text', defaultValue: 'CEO, TechCo' },
      { key: 's2_image', label: 'Speaker 2 Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 's3_name', label: 'Speaker 3 Name', type: 'text', defaultValue: 'Mike Johnson' },
      { key: 's3_role', label: 'Speaker 3 Role', type: 'text', defaultValue: 'Founder, AIStart' },
      { key: 's3_image', label: 'Speaker 3 Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 's4_name', label: 'Speaker 4 Name', type: 'text', defaultValue: 'Lisa Park' },
      { key: 's4_role', label: 'Speaker 4 Role', type: 'text', defaultValue: 'VP, Google' },
      { key: 's4_image', label: 'Speaker 4 Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
    ]
  },
  {
    id: 'panel-title',
    name: 'Panel Title Slide',
    description: 'Full-screen panel introduction',
    route: '/sxsw/overlay/panel-title',
    params: [
      { key: 'panel', label: 'Panel Number', type: 'text', defaultValue: '1' },
      { key: 'title', label: 'Panel Title', type: 'text', defaultValue: 'The AI Transformation' },
      { key: 'description', label: 'Description', type: 'textarea', defaultValue: 'How students, founders, and operators are building in the age of AI' },
      { key: 'time', label: 'Time Slot', type: 'text', defaultValue: '11:00 – 11:50 AM CT' },
    ]
  },
  {
    id: 'student-spotlight',
    name: 'Student Spotlight',
    description: 'Student interview intro screen',
    route: '/sxsw/overlay/student-spotlight',
    params: [
      { key: 'name', label: 'Student Name', type: 'text', defaultValue: 'Alex Rodriguez' },
      { key: 'major', label: 'Major & Class', type: 'text', defaultValue: 'Computer Science, Class of 2027' },
      { key: 'school', label: 'School', type: 'text', defaultValue: 'University of Michigan' },
      { key: 'role', label: 'ABG Role', type: 'text', defaultValue: 'Project Lead, AI Business Group' },
      { key: 'image', label: 'Profile Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 'bio', label: 'Short Bio/Quote', type: 'text', defaultValue: 'Building the future of AI at SXSW 2026' },
    ]
  },
  {
    id: 'student-spotlight-video',
    name: 'Student Spotlight Video',
    description: 'Lower-third overlay for student video',
    route: '/sxsw/overlay/student-spotlight-video',
    params: [
      { key: 'name', label: 'Student Name', type: 'text', defaultValue: 'Alex Rodriguez' },
      { key: 'major', label: 'Major & Class', type: 'text', defaultValue: 'Computer Science, Class of 2027' },
      { key: 'school', label: 'School', type: 'text', defaultValue: 'University of Michigan' },
      { key: 'role', label: 'ABG Role', type: 'text', defaultValue: 'Project Lead, AI Business Group' },
      { key: 'image', label: 'Profile Image URL', type: 'text', defaultValue: '', placeholder: 'https://...' },
      { key: 'autoHide', label: 'Auto-hide (seconds)', type: 'number', defaultValue: '', placeholder: 'Leave empty to stay visible' },
    ]
  },
  {
    id: 'workshop',
    name: 'AI Workshop Intro',
    description: 'Workshop introduction screen',
    route: '/sxsw/overlay/workshop',
    params: [
      { key: 'title', label: 'Workshop Title', type: 'text', defaultValue: 'AI in Action Workshop' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Hands-on with cutting-edge AI tools' },
      { key: 'instructor', label: 'Instructor/Leader', type: 'text', defaultValue: 'ABG Tech Committee' },
      { key: 'time', label: 'Time Slot', type: 'text', defaultValue: '2:00 – 3:30 PM CT' },
      { key: 'topic', label: 'Topic Badge', type: 'text', defaultValue: 'Building with LLMs' },
    ]
  },
  {
    id: 'workshop-live',
    name: 'Workshop Live Overlay',
    description: 'Transparent overlay during workshop',
    route: '/sxsw/overlay/workshop-live',
    params: [
      { key: 'title', label: 'Workshop Title', type: 'text', defaultValue: 'AI in Action: From Prompt to Prototype' },
      { key: 'presenter', label: 'Presenter Name', type: 'text', defaultValue: 'Alex Chen' },
      { key: 'role', label: 'Presenter Role', type: 'text', defaultValue: 'AI Developer, ABG' },
      { key: 'status', label: 'Status Text', type: 'text', defaultValue: 'Real-time AI build in progress...' },
      { key: 'tool', label: 'Tool Name', type: 'text', defaultValue: 'Code Editor / AI Tool' },
      { key: 'showStatus', label: 'Show Center Placeholder', type: 'text', defaultValue: 'true', placeholder: 'true or false' },
    ]
  },
  {
    id: 'transition',
    name: 'Transition Bumper',
    description: 'Brand transition screen',
    route: '/sxsw/overlay/transition',
    params: [
      { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'AI SHAPES' },
      { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'BUSINESS.' },
      { key: 'accent', label: 'Accent Line', type: 'text', defaultValue: 'WE BUILD AI SOLUTIONS' },
      { key: 'slogan', label: 'Slogan', type: 'text', defaultValue: 'HAIL TO THE INNOVATORS' },
    ]
  },
  {
    id: 'ending',
    name: 'Ending Screen',
    description: 'Thank you and call-to-action',
    route: '/sxsw/overlay/ending',
    params: [
      { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'THANK YOU FOR JOINING US' },
      { key: 'website', label: 'Website', type: 'text', defaultValue: 'abgumich.org' },
      { key: 'social', label: 'Social Handle', type: 'text', defaultValue: '@abgumich' },
    ]
  },
];

export default function OverlayControlPanel() {
  const [selectedOverlay, setSelectedOverlay] = useState<string>('soft-opening');
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://abgumich.org');

  const currentOverlay = overlays.find(o => o.id === selectedOverlay);

  // Get current param values for an overlay
  const getParamValue = (overlayId: string, paramKey: string, defaultValue: string) => {
    return paramValues[overlayId]?.[paramKey] ?? defaultValue;
  };

  // Set param value
  const setParamValue = (overlayId: string, paramKey: string, value: string) => {
    setParamValues(prev => ({
      ...prev,
      [overlayId]: {
        ...prev[overlayId],
        [paramKey]: value
      }
    }));
  };

  // Generate URL with parameters
  const generateUrl = (overlay: OverlayConfig, includeBase = true) => {
    const params = new URLSearchParams();
    overlay.params.forEach(param => {
      const value = getParamValue(overlay.id, param.key, param.defaultValue);
      if (value !== param.defaultValue) {
        params.set(param.key, value);
      }
    });
    
    const queryString = params.toString();
    const path = overlay.route + (queryString ? `?${queryString}` : '');
    return includeBase ? `${baseUrl}${path}` : path;
  };

  // Copy URL to clipboard
  const copyUrl = (overlay: OverlayConfig) => {
    const url = generateUrl(overlay);
    navigator.clipboard.writeText(url);
    setCopiedUrl(overlay.id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Reset params to defaults
  const resetParams = (overlayId: string) => {
    setParamValues(prev => {
      const newValues = { ...prev };
      delete newValues[overlayId];
      return newValues;
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1C2D]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/prodscreens" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Wireframes</span>
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-2">vMix Overlay Control Panel</h1>
          <p className="text-white/60">
            Configure and copy overlay URLs for use in vMix browser inputs
          </p>
        </div>

        {/* Base URL Setting */}
        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="block text-white/60 text-sm mb-2">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#bf5a36]"
            placeholder="https://your-domain.com"
          />
          <p className="text-white/40 text-xs mt-2">
            For local testing, use: http://localhost:3001
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Overlay List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Overlays</h2>
            <div className="space-y-2">
              {overlays.map(overlay => (
                <button
                  key={overlay.id}
                  onClick={() => setSelectedOverlay(overlay.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedOverlay === overlay.id
                      ? 'bg-[#bf5a36]/20 border-[#bf5a36]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className={`font-semibold ${selectedOverlay === overlay.id ? 'text-[#bf5a36]' : 'text-white'}`}>
                    {overlay.name}
                  </p>
                  <p className="text-white/50 text-sm">{overlay.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            {currentOverlay && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentOverlay.name}</h2>
                    <p className="text-white/50">{currentOverlay.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetParams(currentOverlay.id)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                      title="Reset to defaults"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <a
                      href={generateUrl(currentOverlay, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                      title="Preview overlay"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Parameters */}
                <div className="space-y-4 mb-6">
                  {currentOverlay.params.map(param => (
                    <div key={param.key}>
                      <label className="block text-white/60 text-sm mb-2">{param.label}</label>
                      {param.type === 'textarea' ? (
                        <textarea
                          value={getParamValue(currentOverlay.id, param.key, param.defaultValue)}
                          onChange={(e) => setParamValue(currentOverlay.id, param.key, e.target.value)}
                          placeholder={param.placeholder || param.defaultValue}
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#bf5a36] resize-none"
                        />
                      ) : (
                        <input
                          type={param.type}
                          value={getParamValue(currentOverlay.id, param.key, param.defaultValue)}
                          onChange={(e) => setParamValue(currentOverlay.id, param.key, e.target.value)}
                          placeholder={param.placeholder || param.defaultValue}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#bf5a36]"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Generated URL */}
                <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/60 text-sm font-medium">vMix Browser URL</p>
                    <button
                      onClick={() => copyUrl(currentOverlay)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                        copiedUrl === currentOverlay.id
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[#bf5a36]/20 text-[#bf5a36] hover:bg-[#bf5a36]/30'
                      }`}
                    >
                      {copiedUrl === currentOverlay.id ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="w-4 h-4" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block text-sm text-white/80 break-all font-mono">
                    {generateUrl(currentOverlay)}
                  </code>
                </div>

                {/* vMix Instructions */}
                <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-white font-semibold mb-2">vMix Setup Instructions</h3>
                  <ol className="text-white/60 text-sm space-y-2">
                    <li>1. Click <strong className="text-white">Add Input</strong> → <strong className="text-white">Web Browser</strong></li>
                    <li>2. Paste the URL above</li>
                    <li>3. Set resolution to <strong className="text-white">1920x1080</strong></li>
                    <li>4. For transparent overlays (lower-third), enable <strong className="text-white">Transparent Background</strong></li>
                    <li>5. The overlay will update in real-time if you change the URL parameters</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">All Overlay URLs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overlays.map(overlay => (
              <div key={overlay.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">{overlay.name}</p>
                  <button
                    onClick={() => copyUrl(overlay)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                  >
                    {copiedUrl === overlay.id ? (
                      <CheckIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <ClipboardIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <code className="text-xs text-white/50 break-all">{overlay.route}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
