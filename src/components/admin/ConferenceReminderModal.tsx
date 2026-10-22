'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CodeBracketIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { ConferenceTicket } from '@/types/conference-ticket';

interface ContentSection {
  id: string;
  type: 'text' | 'heading' | 'button' | 'divider' | 'image' | 'text-image';
  content: string;
  buttonUrl?: string;
  imageUrl?: string;
  isBold?: boolean;
  imagePosition?: 'left' | 'right' | 'center';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
}

interface ConferenceReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: ConferenceTicket[];
}

const PRESET_TEMPLATES = [
  {
    id: 'conference_reminder',
    name: 'Michigan AI Conference Reminder (Recommended)',
    subject: 'Important Reminder: Michigan AI Business Conference Details & Check-In',
    emailTitle: 'Michigan AI Business Conference 2026',
    emailTitleColor: '#ffffff',
    bannerColor: '#00274c',
    bannerGradient: true,
    bannerGradientEnd: '#00509e',
    bannerShapes: true,
    bottomBannerEnabled: true,
    bottomBannerText: 'See you at Ross! • University of Michigan AI Business Group',
    bottomBannerColor: '#00274c',
    bottomBannerGradient: true,
    bottomBannerGradientEnd: '#FF6700',
    bottomBannerShapes: true,
    signatureSize: 'medium' as const,
    signatureStyle: 'white' as const,
    emailBackgroundColor: '#f4f4f4',
    sections: [
      {
        id: '1',
        type: 'heading' as const,
        content: 'Welcome to the Michigan AI Business Conference!',
        isBold: true,
      },
      {
        id: '2',
        type: 'text' as const,
        content:
          'Hello,\n\nWe are looking forward to welcoming you to the **Michigan AI Business Conference 2026** hosted by the University of Michigan AI Business Group! Below are essential details regarding venue access, schedule, and check-in procedures.',
        isBold: false,
      },
      {
        id: '3',
        type: 'text' as const,
        content:
          '📍 **Venue:** Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109\n🏢 **Check-In Desk:** Stewart Lobby\n📅 **Date:** Friday, October 23, 2026\n⏰ **Registration & Breakfast:** 8:30 AM EDT\n🎤 **Opening Keynote:** 9:00 AM EDT',
        isBold: false,
      },
      {
        id: '4',
        type: 'heading' as const,
        content: 'Check-In & Ticket QR Pass',
        isBold: true,
      },
      {
        id: '5',
        type: 'text' as const,
        content:
          'Please have your digital pass or confirmation email ready on your phone when arriving at the Stewart Lobby registration table. If you were issued a complimentary or guest pass, our staff will check you in directly by name.',
        isBold: false,
      },
      {
        id: '6',
        type: 'button' as const,
        content: 'View Full Conference Schedule & Details',
        buttonUrl: 'https://abgumich.org/conference',
      },
      {
        id: '7',
        type: 'divider' as const,
        content: '',
      },
      {
        id: '8',
        type: 'text' as const,
        content:
          'Questions or dietary accommodations? Feel free to reply directly to this email or contact us at <ABGcontact@umich.edu>(mailto:ABGcontact@umich.edu).\n\nGo Blue!',
        isBold: false,
      },
    ],
  },
  {
    id: 'general_reminder',
    name: 'General Reminder',
    subject: 'Reminder: Upcoming Conference Information',
    emailTitle: 'Reminder from AI Business Group',
    emailTitleColor: '#ffffff',
    bannerColor: '#ff9900',
    bannerGradient: true,
    bannerGradientEnd: '#ffcc00',
    bannerShapes: true,
    bottomBannerEnabled: false,
    bottomBannerText: 'Thank you!',
    bottomBannerColor: '#00274c',
    bottomBannerGradient: false,
    bottomBannerGradientEnd: '#00509e',
    bottomBannerShapes: false,
    signatureSize: 'medium' as const,
    signatureStyle: 'white' as const,
    emailBackgroundColor: '#f4f4f4',
    sections: [
      {
        id: '1',
        type: 'heading' as const,
        content: 'Friendly Reminder',
        isBold: true,
      },
      {
        id: '2',
        type: 'text' as const,
        content: 'This is a friendly reminder regarding your upcoming conference attendance.',
        isBold: false,
      },
      {
        id: '3',
        type: 'button' as const,
        content: 'View Details',
        buttonUrl: 'https://abgumich.org/conference',
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    subject: '',
    emailTitle: 'AI Business Group',
    emailTitleColor: '#ffffff',
    bannerColor: '#00274c',
    bannerGradient: false,
    bannerGradientEnd: '#00509e',
    bannerShapes: false,
    bottomBannerEnabled: false,
    bottomBannerText: 'Thank you!',
    bottomBannerColor: '#00274c',
    bottomBannerGradient: false,
    bottomBannerGradientEnd: '#00509e',
    bottomBannerShapes: false,
    signatureSize: 'medium' as const,
    signatureStyle: 'white' as const,
    emailBackgroundColor: '#f4f4f4',
    sections: [
      {
        id: '1',
        type: 'text' as const,
        content: 'Hello,\n\nEnter your custom reminder message here...',
        isBold: false,
      },
    ],
  },
];

export default function ConferenceReminderModal({
  isOpen,
  onClose,
  tickets = [],
}: ConferenceReminderModalProps) {
  // Primary email settings
  const [primaryTo, setPrimaryTo] = useState('ABGcontact@umich.edu');
  const [replyTo, setReplyTo] = useState('ABGcontact@umich.edu');

  // BCC Recipients selection
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'confirmed' | 'unchecked' | 'checked'>('all');

  // Email styling & content
  const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
  const [emailTitle, setEmailTitle] = useState(PRESET_TEMPLATES[0].emailTitle);
  const [emailTitleColor, setEmailTitleColor] = useState(PRESET_TEMPLATES[0].emailTitleColor);
  const [bannerColor, setBannerColor] = useState(PRESET_TEMPLATES[0].bannerColor);
  const [bannerGradient, setBannerGradient] = useState(PRESET_TEMPLATES[0].bannerGradient);
  const [bannerGradientEnd, setBannerGradientEnd] = useState(PRESET_TEMPLATES[0].bannerGradientEnd);
  const [bannerShapes, setBannerShapes] = useState(PRESET_TEMPLATES[0].bannerShapes);
  const [bottomBannerEnabled, setBottomBannerEnabled] = useState(PRESET_TEMPLATES[0].bottomBannerEnabled);
  const [bottomBannerText, setBottomBannerText] = useState(PRESET_TEMPLATES[0].bottomBannerText);
  const [bottomBannerColor, setBottomBannerColor] = useState(PRESET_TEMPLATES[0].bottomBannerColor);
  const [bottomBannerGradient, setBottomBannerGradient] = useState(PRESET_TEMPLATES[0].bottomBannerGradient);
  const [bottomBannerGradientEnd, setBottomBannerGradientEnd] = useState(PRESET_TEMPLATES[0].bottomBannerGradientEnd);
  const [bottomBannerShapes, setBottomBannerShapes] = useState(PRESET_TEMPLATES[0].bottomBannerShapes);
  const [signatureSize, setSignatureSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [signatureStyle, setSignatureStyle] = useState<'white' | 'black'>('white');
  const [emailBackgroundColor, setEmailBackgroundColor] = useState('#f4f4f4');
  const [contentSections, setContentSections] = useState<ContentSection[]>(PRESET_TEMPLATES[0].sections);

  // UI tabs & states
  const [activeTab, setActiveTab] = useState<'designer' | 'recipients' | 'preview'>('designer');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('conference_reminder');

  // Escape key listener to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmModal, onClose]);

  // Initialize selected emails to all valid ticket holders when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialEmails = (tickets || [])
        .filter((t) => t.status === 'confirmed' && t.attendeeEmail && t.attendeeEmail.includes('@'))
        .map((t) => t.attendeeEmail.toLowerCase().trim());
      setSelectedEmails(Array.from(new Set(initialEmails)));
    }
  }, [isOpen, tickets]);

  // Generate HTML from content sections (identical to Notification Center)
  const previewHtml = useMemo(() => {
    const formatText = (text: string, isBold?: boolean) => {
      if (!text) return '';
      let formatted = text.replace(
        /<([^>]+)>\(([^)]+)\)/g,
        '<a href="$2" style="color: #00274c; text-decoration: underline; font-weight: 600;">$1</a>'
      );
      // Markdown-like **bold** support
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\n/g, '<br>');
      if (isBold) {
        formatted = `<strong>${formatted}</strong>`;
      }
      return formatted;
    };

    const sectionsHtml = (contentSections || [])
      .map((section) => {
        const getImageSizeStyle = (size?: string) => {
          switch (size) {
            case 'small':
              return 'max-width: 150px;';
            case 'medium':
              return 'max-width: 300px;';
            case 'large':
              return 'max-width: 450px;';
            case 'full':
            default:
              return 'max-width: 100%;';
          }
        };

        switch (section.type) {
          case 'heading':
            return `<h2 style="color: #00274c; font-size: 22px; font-weight: 700; margin: 24px 0 12px 0;">${formatText(
              section.content || '',
              section.isBold
            )}</h2>`;
          case 'text':
            return `<div style="margin: 12px 0; line-height: 1.65; color: #374151; font-size: 15px;">${formatText(
              section.content || '',
              section.isBold
            )}</div>`;
          case 'button':
            return `<div style="margin: 24px 0; text-align: center;"><a href="${
              section.buttonUrl || '#'
            }" style="display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #00274c 0%, #003b75 100%); color: #ffffff !important; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,39,76,0.25);">${
              section.content || 'Click Here'
            }</a></div>`;
          case 'divider':
            return `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;" />`;
          case 'image':
            const alignStyle =
              section.imagePosition === 'left'
                ? 'text-align: left;'
                : section.imagePosition === 'right'
                ? 'text-align: right;'
                : 'text-align: center;';
            return `<div style="margin: 20px 0; ${alignStyle}"><img src="${
              section.imageUrl || ''
            }" alt="${section.content || ''}" style="${getImageSizeStyle(
              section.imageSize
            )} height: auto; border-radius: 12px; display: inline-block;" /></div>`;
          case 'text-image':
            const imageFloat =
              section.imagePosition === 'left'
                ? 'float: left; margin: 0 20px 12px 0;'
                : 'float: right; margin: 0 0 12px 20px;';
            return `<div style="margin: 20px 0; overflow: auto;"><img src="${
              section.imageUrl || ''
            }" alt="Image" style="${imageFloat} ${getImageSizeStyle(
              section.imageSize
            )} height: auto; border-radius: 10px;" /><div style="line-height: 1.65; color: #374151;">${formatText(
              section.content || '',
              section.isBold
            )}</div></div>`;
          default:
            return '';
        }
      })
      .join('\n');

    // Shapes overlay
    const shapesOverlay = bannerShapes
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200'%3E%3Ccircle cx='60' cy='40' r='20' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Crect x='480' y='120' width='15' height='15' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 487.5 127.5)'/%3E%3Ccircle cx='90' cy='140' r='25' fill='none' stroke='rgba(255,255,255,0.25)' stroke-width='2'/%3E%3Crect x='510' y='60' width='17.5' height='17.5' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 518.75 68.75)'/%3E%3Cpolygon points='420,160 407.5,172.5 432.5,172.5' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Ccircle cx='420' cy='30' r='22.5' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3C/svg%3E"), `
      : '';

    let topBannerStyle = '';
    if (bannerGradient) {
      topBannerStyle = `background-image: ${shapesOverlay}linear-gradient(135deg, ${bannerColor} 0%, ${bannerGradientEnd} 100%);`;
    } else {
      topBannerStyle = bannerShapes
        ? `background-color: ${bannerColor}; background-image: ${shapesOverlay.slice(0, -2)};`
        : `background-color: ${bannerColor};`;
    }

    const bottomShapesOverlay = bottomBannerShapes
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='150'%3E%3Ccircle cx='90' cy='45' r='17.5' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Crect x='450' y='75' width='20' height='20' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 460 85)'/%3E%3C/svg%3E"), `
      : '';

    let bottomBannerStyle = '';
    if (bottomBannerGradient) {
      bottomBannerStyle = `background-image: ${bottomShapesOverlay}linear-gradient(135deg, ${bottomBannerColor} 0%, ${bottomBannerGradientEnd} 100%);`;
    } else {
      bottomBannerStyle = bottomBannerShapes
        ? `background-color: ${bottomBannerColor}; background-image: ${bottomShapesOverlay.slice(0, -2)};`
        : `background-color: ${bottomBannerColor};`;
    }

    const signatureUrl =
      signatureStyle === 'white'
        ? 'https://abgumich.org/white-abg-email-signature.png'
        : 'https://abgumich.org/black-abg-email-signature.png';

    const signatureMaxWidth =
      signatureSize === 'small' ? '280px' : signatureSize === 'large' ? '550px' : '420px';

    const bottomBannerHtml = bottomBannerEnabled
      ? `
      <div style="${bottomBannerStyle} color: white; padding: 24px 20px; text-align: center; border-radius: 0 0 16px 16px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: white;">${bottomBannerText}</p>
        <div style="padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.25);">
          <img src="${signatureUrl}" alt="AI Business Group" style="max-width: ${signatureMaxWidth}; width: 100%; border-radius: 8px; display: block; margin: 0 auto;">
        </div>
      </div>`
      : `
      <div style="padding: 24px 20px; text-align: center; background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f3f4f6;">
        <img src="${signatureUrl}" alt="AI Business Group" style="max-width: ${signatureMaxWidth}; width: 100%; border-radius: 8px; display: block; margin: 0 auto;">
      </div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Conference Reminder'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 24px; background-color: ${emailBackgroundColor}; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { ${topBannerStyle} color: white; padding: 36px 24px; text-align: center; position: relative; }
    .content { padding: 32px 28px; background-color: #ffffff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: ${emailTitleColor};">${emailTitle}</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; color: ${emailTitleColor};">University of Michigan • AI Business Group</p>
    </div>
    <div class="content">
      ${sectionsHtml}
    </div>
    ${bottomBannerHtml}
  </div>
</body>
</html>`;
  }, [
    contentSections,
    subject,
    emailTitle,
    emailTitleColor,
    bannerColor,
    bannerGradient,
    bannerGradientEnd,
    bannerShapes,
    bottomBannerEnabled,
    bottomBannerText,
    bottomBannerColor,
    bottomBannerGradient,
    bottomBannerGradientEnd,
    bottomBannerShapes,
    signatureSize,
    signatureStyle,
    emailBackgroundColor,
  ]);

  // Load Template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSubject(tmpl.subject);
    setEmailTitle(tmpl.emailTitle);
    setEmailTitleColor(tmpl.emailTitleColor);
    setBannerColor(tmpl.bannerColor);
    setBannerGradient(tmpl.bannerGradient);
    setBannerGradientEnd(tmpl.bannerGradientEnd);
    setBannerShapes(tmpl.bannerShapes);
    setBottomBannerEnabled(tmpl.bottomBannerEnabled);
    setBottomBannerText(tmpl.bottomBannerText);
    setBottomBannerColor(tmpl.bottomBannerColor);
    setBottomBannerGradient(tmpl.bottomBannerGradient);
    setBottomBannerGradientEnd(tmpl.bottomBannerGradientEnd);
    setBottomBannerShapes(tmpl.bottomBannerShapes);
    setSignatureSize(tmpl.signatureSize);
    setSignatureStyle(tmpl.signatureStyle);
    setEmailBackgroundColor(tmpl.emailBackgroundColor);
    setContentSections(tmpl.sections);
    toast.success(`Loaded "${tmpl.name}" template`);
  };

  // Section manipulation
  const addSection = (type: ContentSection['type']) => {
    const id = Date.now().toString();
    const newSection: ContentSection = {
      id,
      type,
      content:
        type === 'heading'
          ? 'New Section Title'
          : type === 'button'
          ? 'Take Action'
          : type === 'divider'
          ? ''
          : 'Enter your content here...',
      buttonUrl: type === 'button' ? 'https://abgumich.org/conference' : undefined,
      isBold: false,
      imageSize: 'medium',
      imagePosition: 'center',
    };
    setContentSections((prev) => [...prev, newSection]);
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    setContentSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSection = (id: string) => {
    setContentSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentSections.length) return;
    const updated = [...contentSections];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setContentSections(updated);
  };

  // Filter tickets for BCC selection
  const eligibleTickets = (tickets || []).filter((t) => {
    if (t.status !== 'confirmed') return false;
    if (recipientFilter === 'checked') return t.checkedIn;
    if (recipientFilter === 'unchecked') return !t.checkedIn;
    return true;
  });

  const searchedTickets = eligibleTickets.filter((t) => {
    if (!recipientSearch.trim()) return true;
    const query = recipientSearch.toLowerCase();
    return (
      (t.attendeeName && t.attendeeName.toLowerCase().includes(query)) ||
      (t.attendeeEmail && t.attendeeEmail.toLowerCase().includes(query)) ||
      (t.ticketCode && t.ticketCode.toLowerCase().includes(query)) ||
      (t.affiliation && t.affiliation.toLowerCase().includes(query))
    );
  });

  // Ticket holders who have a valid email address
  const ticketHoldersWithEmail = searchedTickets.filter(
    (t) => t.attendeeEmail && t.attendeeEmail.trim().length > 3 && t.attendeeEmail.includes('@')
  );

  const toggleSelectEmail = (email: string) => {
    const normalized = email.toLowerCase().trim();
    setSelectedEmails((prev) =>
      prev.includes(normalized) ? prev.filter((e) => e !== normalized) : [...prev, normalized]
    );
  };

  const handleSelectAll = () => {
    const allEmailsInView = ticketHoldersWithEmail.map((t) => t.attendeeEmail.toLowerCase().trim());
    setSelectedEmails((prev) => Array.from(new Set([...prev, ...allEmailsInView])));
    toast.success(`Selected ${allEmailsInView.length} ticket holders`);
  };

  const handleDeselectAll = () => {
    setSelectedEmails([]);
    toast.success('Cleared all selected recipients');
  };

  // Validation before opening confirm modal
  const handleOpenConfirm = () => {
    if (!primaryTo.trim() || !primaryTo.includes('@')) {
      toast.error('Please enter a valid Primary "To" email address');
      return;
    }
    if (selectedEmails.length === 0) {
      toast.error('Please select at least one ticket holder in BCC');
      setActiveTab('recipients');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      setActiveTab('designer');
      return;
    }
    if (contentSections.length === 0) {
      toast.error('Please include at least one content section');
      setActiveTab('designer');
      return;
    }

    setShowConfirmModal(true);
  };

  // Send execution
  const handleSendReminder = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/admin/conference/tickets/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: primaryTo.trim(),
          bcc: selectedEmails,
          subject: subject.trim(),
          htmlContent: previewHtml,
          replyTo: replyTo.trim() || 'ABGcontact@umich.edu',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Reminder dispatched successfully to ${data.sentCount} attendees (${data.batchesSent} batch via BCC)!`,
          { duration: 5000 }
        );
        setShowConfirmModal(false);
        onClose();
      } else {
        toast.error(data.error || 'Failed to send reminder email');
      }
    } catch (err: any) {
      console.error('Error sending reminder:', err);
      toast.error('Network error sending reminder email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-7xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00274c] text-white flex items-center justify-center shadow-md">
              <EnvelopeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Send Conference Reminder</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#00274c]">
                  BCC Token Protected
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Custom HTML reminder sent to primary email with {selectedEmails.length} attendee(s) in BCC
              </p>
            </div>
          </div>

          {/* Action Navigation & Send */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-gray-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('designer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'designer'
                    ? 'bg-white text-[#00274c] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CodeBracketIcon className="w-4 h-4" />
                <span>Designer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('recipients')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'recipients'
                    ? 'bg-white text-[#00274c] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="w-4 h-4" />
                <span>Recipients ({selectedEmails.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-[#00274c] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <EyeIcon className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6700] hover:bg-[#FF5500] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <EnvelopeIcon className="w-4 h-4" />
              <span>Send Reminder</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── BODY SPLIT VIEW ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT 7 COLS: Controls (Designer or Recipients) */}
          <div
            className={`lg:col-span-7 h-full overflow-y-auto p-6 space-y-6 border-r border-gray-200 bg-white ${
              activeTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {activeTab === 'recipients' ? (
              /* ── RECIPIENTS VIEW ── */
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-gray-900">Email Routing & BCC List</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    The reminder is delivered to the Primary address, and all selected ticket holders receive it in BCC.
                  </p>
                </div>

                {/* Primary & Reply-To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Primary &quot;To:&quot; Address
                    </label>
                    <input
                      type="email"
                      value={primaryTo}
                      onChange={(e) => setPrimaryTo(e.target.value)}
                      placeholder="ABGcontact@umich.edu"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c] focus:border-[#00274c]"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Pre-filled with official ABG contact address</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Reply-To Address
                    </label>
                    <input
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="ABGcontact@umich.edu"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c] focus:border-[#00274c]"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Replies from attendees will go to this address</p>
                  </div>
                </div>

                {/* BCC Recipient Selector Toolbar */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">BCC Ticket Holders:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00274c] text-white">
                        {selectedEmails.length} selected
                      </span>
                      <span className="text-xs text-gray-400">
                        ({ticketHoldersWithEmail.length} with valid email)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#00274c] hover:bg-blue-100 text-xs font-bold transition-colors"
                      >
                        Select All ({ticketHoldersWithEmail.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search attendee by name, email, or code..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                      {(['all', 'confirmed', 'unchecked', 'checked'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setRecipientFilter(filter)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                            recipientFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                          }`}
                        >
                          {filter === 'unchecked' ? 'Pending' : filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attendee Checkbox List */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                  {searchedTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">
                      No matching ticket holders found for this filter.
                    </div>
                  ) : (
                    searchedTickets.map((ticket) => {
                      const hasEmail = Boolean(ticket.attendeeEmail && ticket.attendeeEmail.includes('@'));
                      const isSelected = hasEmail && selectedEmails.includes(ticket.attendeeEmail.toLowerCase().trim());

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => {
                            if (hasEmail) toggleSelectEmail(ticket.attendeeEmail);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            !hasEmail
                              ? 'bg-gray-50/60 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50/60 hover:bg-blue-50 cursor-pointer'
                              : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!hasEmail}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-[#00274c] focus:ring-[#00274c] border-gray-300"
                            />
                            <div className="truncate">
                              <p className="font-bold text-gray-900 truncate">{ticket.attendeeName}</p>
                              <p className="text-[11px] text-gray-500 font-mono truncate">
                                {hasEmail ? ticket.attendeeEmail : '(No email on file - guest pass)'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {ticket.ticketCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ticket.tier === 'Complimentary'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {ticket.tier}
                            </span>
                            {ticket.checkedIn ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                Checked In
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                Unchecked
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* ── DESIGNER VIEW (Identical to Notifications Page) ── */
              <div className="space-y-6">
                {/* Template Selector */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#00274c] flex items-center gap-1.5">
                      <SparklesIcon className="w-4 h-4 text-[#FF6700]" />
                      Email Template
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">Choose a pre-built design or start blank</p>
                  </div>

                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-white border border-blue-200 text-[#00274c] focus:ring-2 focus:ring-[#00274c]"
                  >
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject line..."
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>

                {/* Top Banner Customizer */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900">Header Banner Styling</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Text Color:</span>
                      <input
                        type="color"
                        value={emailTitleColor}
                        onChange={(e) => setEmailTitleColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                        title="Banner Text Color"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={emailTitle}
                      onChange={(e) => setEmailTitle(e.target.value)}
                      placeholder="Michigan AI Business Conference 2026"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>

                  {/* Colors & Gradient */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Banner Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bannerColor}
                          onChange={(e) => setBannerColor(e.target.value)}
                          className="w-9 h-9 rounded-xl border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bannerColor}
                          onChange={(e) => setBannerColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={emailBackgroundColor}
                          onChange={(e) => setEmailBackgroundColor(e.target.value)}
                          className="w-9 h-9 rounded-xl border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={emailBackgroundColor}
                          onChange={(e) => setEmailBackgroundColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={bannerGradient}
                        onChange={(e) => setBannerGradient(e.target.checked)}
                        className="w-4 h-4 rounded text-[#00274c] focus:ring-[#00274c] border-gray-300"
                      />
                      <span>Enable Color Gradient</span>
                    </label>

                    {bannerGradient && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Gradient End:</span>
                        <input
                          type="color"
                          value={bannerGradientEnd}
                          onChange={(e) => setBannerGradientEnd(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                        />
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={bannerShapes}
                        onChange={(e) => setBannerShapes(e.target.checked)}
                        className="w-4 h-4 rounded text-[#00274c] focus:ring-[#00274c] border-gray-300"
                      />
                      <span>Geometric Shapes Overlay</span>
                    </label>
                  </div>
                </div>

                {/* Content Sections Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Email Body Sections</h4>
                      <p className="text-xs text-gray-500">
                        Use markdown &quot;**bold**&quot; or links &quot;&lt;text&gt;(https://url)&quot; in text blocks
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addSection('heading')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        + Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => addSection('text')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        + Text
                      </button>
                      <button
                        type="button"
                        onClick={() => addSection('button')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        + Button
                      </button>
                      <button
                        type="button"
                        onClick={() => addSection('divider')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        + Divider
                      </button>
                    </div>
                  </div>

                  {/* Section cards */}
                  <div className="space-y-3">
                    {contentSections.map((section, idx) => (
                      <div
                        key={section.id}
                        className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-wider text-[#00274c] bg-blue-50 px-2 py-0.5 rounded-md">
                            Section {idx + 1}: {section.type}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUpIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'down')}
                              disabled={idx === contentSections.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDownIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSection(section.id)}
                              className="p-1 text-red-500 hover:text-red-700 ml-1"
                              title="Delete Section"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {section.type === 'heading' && (
                          <input
                            type="text"
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Heading text..."
                            className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                          />
                        )}

                        {section.type === 'text' && (
                          <textarea
                            rows={3}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Enter text or markdown..."
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                          />
                        )}

                        {section.type === 'button' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={section.content}
                              onChange={(e) => updateSection(section.id, { content: e.target.value })}
                              placeholder="Button Label (e.g. View Schedule)"
                              className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                            />
                            <input
                              type="url"
                              value={section.buttonUrl || ''}
                              onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
                              placeholder="https://abgumich.org/conference"
                              className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00274c]"
                            />
                          </div>
                        )}

                        {section.type === 'divider' && (
                          <div className="py-2">
                            <hr className="border-t-2 border-gray-200" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Banner & Signature */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900">Bottom Banner & Signature</h4>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={bottomBannerEnabled}
                        onChange={(e) => setBottomBannerEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#00274c] focus:ring-[#00274c] border-gray-300"
                      />
                      <span>Enable Bottom Banner</span>
                    </label>
                  </div>

                  {bottomBannerEnabled && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bottom Banner Text</label>
                        <input
                          type="text"
                          value={bottomBannerText}
                          onChange={(e) => setBottomBannerText(e.target.value)}
                          placeholder="See you at Ross! • University of Michigan AI Business Group"
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Banner Color</label>
                          <input
                            type="color"
                            value={bottomBannerColor}
                            onChange={(e) => setBottomBannerColor(e.target.value)}
                            className="w-full h-8 rounded-lg cursor-pointer border border-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Gradient End</label>
                          <input
                            type="color"
                            value={bottomBannerGradientEnd}
                            onChange={(e) => setBottomBannerGradientEnd(e.target.value)}
                            className="w-full h-8 rounded-lg cursor-pointer border border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature style & size */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Signature Logo Style</label>
                      <select
                        value={signatureStyle}
                        onChange={(e) => setSignatureStyle(e.target.value as 'white' | 'black')}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                      >
                        <option value="white">White ABG Logo</option>
                        <option value="black">Black ABG Logo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Signature Size</label>
                      <select
                        value={signatureSize}
                        onChange={(e) => setSignatureSize(e.target.value as 'small' | 'medium' | 'large')}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: Sticky Live HTML Preview */}
          <div
            className={`lg:col-span-5 h-full flex flex-col bg-gray-100 ${
              activeTab === 'preview' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Preview Toolbar */}
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Live Email Preview</span>
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === 'desktop' ? 'bg-white text-[#00274c] shadow-sm' : 'text-gray-400'
                  }`}
                  title="Desktop View"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === 'mobile' ? 'bg-white text-[#00274c] shadow-sm' : 'text-gray-400'
                  }`}
                  title="Mobile View"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* IFrame Container */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-auto min-h-0">
              <div
                className={`h-full transition-all duration-200 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-300 ${
                  previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'
                }`}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Live Email Preview"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SAFETY CONFIRMATION DIALOG ── */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-5 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6700] flex items-center justify-center flex-shrink-0">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Confirm Reminder Dispatch</h4>
                  <p className="text-xs text-gray-500">Please review dispatch details before sending</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Primary &quot;To:&quot;</span>
                  <span className="font-bold text-gray-900 font-mono">{primaryTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">BCC Recipients:</span>
                  <span className="font-bold text-[#00274c] bg-blue-50 px-2 py-0.5 rounded">
                    {selectedEmails.length} ticket holders
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Subject:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[260px]">{subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Reply-To:</span>
                  <span className="font-mono text-gray-700">{replyTo}</span>
                </div>
              </div>

              {/* Token Quota Safety Callout */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Email Token Quota Protected</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    This reminder is sent in a single email with all attendees in BCC. It only uses 1 message against
                    your daily Gmail API quota.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={sending}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors"
                >
                  Cancel & Edit
                </button>

                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-[#FF6700] hover:bg-[#FF5500] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Sending Reminder...</span>
                    </>
                  ) : (
                    <>
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>Confirm & Send Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
