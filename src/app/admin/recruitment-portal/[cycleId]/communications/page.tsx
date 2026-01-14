'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  EnvelopeIcon, 
  UserGroupIcon, 
  EyeIcon,
  CodeBracketIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClipboardDocumentIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { TRACK_FILTER_OPTIONS } from '@/lib/tracks';
import type { ApplicationStage, ApplicationTrack } from '@/types/recruitment';

interface ContentSection {
  id: string;
  type: 'text' | 'heading' | 'button' | 'divider' | 'image' | 'text-image';
  content: string;
  buttonUrl?: string;
  imageUrl?: string;
  imageData?: string;
  isBold?: boolean;
  imageWidth?: number;
  imagePosition?: 'left' | 'right' | 'center';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
}

interface Applicant {
  _id: string;
  name: string;
  email: string;
  stage: string;
  track: string;
}

type PhaseFilter = 'accepted' | 'rejected' | 'all' | ApplicationStage;

const STAGES: { value: ApplicationStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'coffee_chat', label: 'Coffee Chat' },
  { value: 'interview_round1', label: 'Interview R1' },
  { value: 'interview_round2', label: 'Interview R2' },
  { value: 'final_review', label: 'Final Review' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function CycleCommunicationsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get } = useAdminApi();
  
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<PhaseFilter>('accepted');
  const [copiedEmails, setCopiedEmails] = useState(false);
  
  // Email builder state
  const [mcommunityGroup, setMcommunityGroup] = useState('');
  const [subject, setSubject] = useState('');
  const [emailTitle, setEmailTitle] = useState('Email from ABG');
  const [bannerColor, setBannerColor] = useState('#00274c');
  const [bannerGradient, setBannerGradient] = useState(false);
  const [bannerGradientEnd, setBannerGradientEnd] = useState('#00509e');
  const [bannerGradientOpacity, setBannerGradientOpacity] = useState(1);
  const [bannerBackgroundImage, setBannerBackgroundImage] = useState('');
  const [bannerShapes, setBannerShapes] = useState(false);
  const [bottomBannerEnabled, setBottomBannerEnabled] = useState(false);
  const [bottomBannerColor, setBottomBannerColor] = useState('#00274c');
  const [bottomBannerGradient, setBottomBannerGradient] = useState(false);
  const [bottomBannerGradientEnd, setBottomBannerGradientEnd] = useState('#00509e');
  const [bottomBannerGradientOpacity, setBottomBannerGradientOpacity] = useState(1);
  const [bottomBannerBackgroundImage, setBottomBannerBackgroundImage] = useState('');
  const [bottomBannerShapes, setBottomBannerShapes] = useState(false);
  const [emailBackgroundColor, setEmailBackgroundColor] = useState('#f4f4f4');
  const [bottomBannerText, setBottomBannerText] = useState('Thank you!');
  const [signatureSize, setSignatureSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [signatureStyle, setSignatureStyle] = useState<'white' | 'black'>('white');
  const [contentSections, setContentSections] = useState<ContentSection[]>([
    { id: '1', type: 'text', content: 'Hello,' }
  ]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Load applicants data
  useEffect(() => {
    loadApplicants();
  }, [cycleId]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      
      if (!cycleId) {
        setApplicants([]);
        return;
      }

      // Get applications for this cycle
      const apps = await get<Applicant[]>(`/api/admin/recruitment/applications?cycleId=${cycleId}`);
      
      setApplicants(apps.filter((app: Applicant) => app.email && app.email !== 'unknown@umich.edu'));
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  // Filter applicants by phase
  const filteredApplicants = applicants.filter(app => {
    if (selectedPhase === 'all') return true;
    return app.stage === selectedPhase;
  });

  // Get emails for copying
  const getEmailsForCopy = () => {
    return filteredApplicants.map(a => a.email).join(', ');
  };

  const handleCopyEmails = async () => {
    const emails = getEmailsForCopy();
    if (!emails) {
      toast.error('No emails to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedEmails(true);
      toast.success(`Copied ${filteredApplicants.length} email(s) to clipboard!`);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch (err) {
      toast.error('Failed to copy emails');
    }
  };

  // Generate HTML from content sections
  const generateHtmlFromSections = () => {
    const formatText = (text: string, isBold?: boolean) => {
      let formatted = text.replace(/<([^>]+)>\(([^)]+)\)/g, '<a href="$2" style="color: #00274c; text-decoration: underline;">$1</a>');
      formatted = formatted.replace(/\n/g, '<br>');
      if (isBold) {
        formatted = `<strong>${formatted}</strong>`;
      }
      return formatted;
    };

    const sectionsHtml = contentSections.map(section => {
      const getImageSizeStyle = (size?: string) => {
        switch (size) {
          case 'small': return 'max-width: 150px;';
          case 'medium': return 'max-width: 300px;';
          case 'large': return 'max-width: 450px;';
          case 'full': return 'max-width: 100%;';
          default: return 'max-width: 100%;';
        }
      };

      switch (section.type) {
        case 'heading':
          return `<h2 style="color: #00274c; font-size: 24px; margin: 20px 0 10px 0;">${formatText(section.content, section.isBold)}</h2>`;
        case 'text':
          return `<p style="margin: 10px 0; line-height: 1.6;">${formatText(section.content, section.isBold)}</p>`;
        case 'button':
          return `<div style="margin: 20px 0; text-align: center;"><a href="${section.buttonUrl || '#'}" style="display: inline-block; padding: 12px 30px; background-color: #00274c; color: white; text-decoration: none; border-radius: 25px;">${section.content}</a></div>`;
        case 'divider':
          return `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;" />`;
        case 'image':
          const alignStyle = section.imagePosition === 'left' ? 'text-align: left;' : section.imagePosition === 'right' ? 'text-align: right;' : 'text-align: center;';
          const imageSrc = section.imageUrl || section.imageData || '';
          return `<div style="margin: 20px 0; ${alignStyle}"><img src="${imageSrc}" alt="${section.content}" style="${getImageSizeStyle(section.imageSize)} height: auto; border-radius: 10px;" /></div>`;
        case 'text-image':
          const imageFloat = section.imagePosition === 'left' ? 'float: left; margin: 0 20px 10px 0;' : 'float: right; margin: 0 0 10px 20px;';
          const textImageSrc = section.imageUrl || section.imageData || '';
          return `<div style="margin: 20px 0; overflow: auto;"><img src="${textImageSrc}" alt="Image" style="${imageFloat} ${getImageSizeStyle(section.imageSize)} height: auto; border-radius: 10px;" /><div style="line-height: 1.6;">${formatText(section.content, section.isBold)}</div></div>`;
        default:
          return '';
      }
    }).join('\n');

    const shapesOverlay = bannerShapes ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200'%3E%3Ccircle cx='60' cy='40' r='20' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Crect x='480' y='120' width='15' height='15' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 487.5 127.5)'/%3E%3Ccircle cx='90' cy='140' r='25' fill='none' stroke='rgba(255,255,255,0.25)' stroke-width='2'/%3E%3Crect x='510' y='60' width='17.5' height='17.5' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 518.75 68.75)'/%3E%3Cpolygon points='420,160 407.5,172.5 432.5,172.5' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Ccircle cx='420' cy='30' r='22.5' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3C/svg%3E"), ` : '';
    
    let bannerStyleWithShapes = '';
    if (bannerBackgroundImage) {
      const overlayOpacity = bannerGradientOpacity * 0.7;
      const fullImageUrl = bannerBackgroundImage.startsWith('http') ? bannerBackgroundImage : `https://abgumich.org${bannerBackgroundImage}`;
      if (bannerShapes) {
        bannerStyleWithShapes = `background-image: ${shapesOverlay}linear-gradient(rgba(0, 39, 76, ${overlayOpacity}), rgba(0, 39, 76, ${overlayOpacity})), url('${fullImageUrl}'); background-size: auto, auto, cover; background-position: center, center, center; background-repeat: no-repeat, no-repeat, no-repeat;`;
      } else {
        bannerStyleWithShapes = `background-image: linear-gradient(rgba(0, 39, 76, ${overlayOpacity}), rgba(0, 39, 76, ${overlayOpacity})), url('${fullImageUrl}'); background-size: auto, cover; background-position: center, center; background-repeat: no-repeat, no-repeat;`;
      }
    } else if (bannerGradient) {
      if (bannerShapes) {
        bannerStyleWithShapes = `background-image: ${shapesOverlay}linear-gradient(135deg, ${bannerColor}, ${bannerGradientEnd}); background-size: auto, auto; background-position: center, center; background-repeat: no-repeat, no-repeat;`;
      } else {
        bannerStyleWithShapes = `background: linear-gradient(135deg, ${bannerColor}, ${bannerGradientEnd});`;
      }
    } else {
      if (bannerShapes) {
        bannerStyleWithShapes = `background-image: ${shapesOverlay}none; background-color: ${bannerColor}; background-size: auto; background-position: center; background-repeat: no-repeat;`;
      } else {
        bannerStyleWithShapes = `background-color: ${bannerColor};`;
      }
    }

    // Bottom banner styles
    const bottomShapesOverlay = bottomBannerShapes ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200'%3E%3Ccircle cx='60' cy='40' r='20' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3Crect x='480' y='120' width='15' height='15' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2' transform='rotate(45 487.5 127.5)'/%3E%3Ccircle cx='90' cy='140' r='25' fill='none' stroke='rgba(255,255,255,0.25)' stroke-width='2'/%3E%3C/svg%3E"), ` : '';
    
    let bottomBannerStyle = '';
    if (bottomBannerEnabled) {
      if (bottomBannerBackgroundImage) {
        const overlayOpacity = bottomBannerGradientOpacity * 0.7;
        const fullImageUrl = bottomBannerBackgroundImage.startsWith('http') ? bottomBannerBackgroundImage : `https://abgumich.org${bottomBannerBackgroundImage}`;
        bottomBannerStyle = `background-image: ${bottomShapesOverlay}linear-gradient(rgba(0, 39, 76, ${overlayOpacity}), rgba(0, 39, 76, ${overlayOpacity})), url('${fullImageUrl}'); background-size: auto, auto, cover; background-position: center, center, center; background-repeat: no-repeat, no-repeat, no-repeat;`;
      } else if (bottomBannerGradient) {
        bottomBannerStyle = `background-image: ${bottomShapesOverlay}linear-gradient(135deg, ${bottomBannerColor}, ${bottomBannerGradientEnd});`;
      } else {
        bottomBannerStyle = `background-color: ${bottomBannerColor};`;
      }
    }

    const signatureSizeMap = {
      small: '80px',
      medium: '120px',
      large: '160px',
    };

    const signatureUrl = signatureStyle === 'white' 
      ? 'https://abgumich.org/emailImages/ABG_white_logo.png'
      : 'https://abgumich.org/emailImages/ABG_black_logo.png';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: ${emailBackgroundColor};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${emailBackgroundColor};">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 40px 30px; ${bannerStyleWithShapes}">
              <h1 style="color: white; margin: 0; font-size: 28px; text-align: center;">${emailTitle}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; color: #333;">
              ${sectionsHtml}
            </td>
          </tr>
          
          ${bottomBannerEnabled ? `
          <!-- Bottom Banner -->
          <tr>
            <td style="padding: 30px; ${bottomBannerStyle}">
              <p style="color: white; margin: 0; text-align: center; font-size: 18px;">${bottomBannerText}</p>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer with Logo -->
          <tr>
            <td style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <img src="${signatureUrl}" alt="ABG Logo" style="width: ${signatureSizeMap[signatureSize]}; height: auto;" />
              <p style="color: #666; font-size: 12px; margin-top: 10px;">AI Business Group | University of Michigan</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Update preview
  useEffect(() => {
    if (previewRef.current) {
      const html = generateHtmlFromSections();
      previewRef.current.srcdoc = html;
    }
  }, [contentSections, emailTitle, bannerColor, bannerGradient, bannerGradientEnd, bannerBackgroundImage, bannerShapes, bottomBannerEnabled, bottomBannerColor, bottomBannerText, emailBackgroundColor, signatureSize, signatureStyle, bottomBannerGradient, bottomBannerGradientEnd, bottomBannerBackgroundImage, bottomBannerShapes, bannerGradientOpacity, bottomBannerGradientOpacity]);

  const addSection = (type: ContentSection['type']) => {
    const newSection: ContentSection = {
      id: Date.now().toString(),
      type,
      content: type === 'divider' ? '' : type === 'button' ? 'Click Here' : '',
      buttonUrl: type === 'button' ? 'https://' : undefined,
      imagePosition: 'center',
      imageSize: 'medium',
    };
    setContentSections([...contentSections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    setContentSections(contentSections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const deleteSection = (id: string) => {
    setContentSections(contentSections.filter(s => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = contentSections.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentSections.length) return;
    
    const newSections = [...contentSections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setContentSections(newSections);
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/notifications/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      updateSection(sectionId, { imageUrl: url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    const recipientEmails = mcommunityGroup.trim() 
      ? [mcommunityGroup.trim()] 
      : filteredApplicants.map(a => a.email);
    
    if (recipientEmails.length === 0) {
      toast.error('No recipients selected');
      return;
    }
    
    if (!confirm(`Send email to ${recipientEmails.length} recipient(s)?`)) {
      return;
    }
    
    try {
      setSending(true);
      setMessage(null);
      
      const html = generateHtmlFromSections();
      
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmails,
          subject,
          html,
          cycleId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
      
      setMessage({ type: 'success', text: `Email sent successfully to ${recipientEmails.length} recipient(s)!` });
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const copyHtmlToClipboard = async () => {
    const html = generateHtmlFromSections();
    try {
      await navigator.clipboard.writeText(html);
      toast.success('HTML copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy HTML');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-500 text-sm mt-1">
            View applicant emails by phase and send custom HTML emails
          </p>
        </div>
      </div>

      {/* Email Lists by Phase */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Applicant Emails</h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as PhaseFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            <button
              onClick={handleCopyEmails}
              disabled={filteredApplicants.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                copiedEmails 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copiedEmails ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Copy Emails ({filteredApplicants.length})
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
          {filteredApplicants.length > 0 ? (
            <p className="text-sm text-gray-600 break-all">
              {filteredApplicants.map(a => a.email).join(', ')}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">No applicants in this phase</p>
          )}
        </div>
      </div>

      {/* Email Builder */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Builder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5" />
            Email Builder
          </h2>
          
          {/* MCommunity Group (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MCommunity Group (optional)
            </label>
            <input
              type="text"
              value={mcommunityGroup}
              onChange={(e) => setMcommunityGroup(e.target.value)}
              placeholder="e.g., abg-members@umich.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to send to filtered applicants above
            </p>
          </div>
          
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Email Title (Banner) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Title (Banner)</label>
            <input
              type="text"
              value={emailTitle}
              onChange={(e) => setEmailTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Banner Settings */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">Banner Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Banner Color</label>
                <input
                  type="color"
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Background</label>
                <input
                  type="color"
                  value={emailBackgroundColor}
                  onChange={(e) => setEmailBackgroundColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bannerGradient}
                  onChange={(e) => setBannerGradient(e.target.checked)}
                  className="rounded"
                />
                Gradient
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bannerShapes}
                  onChange={(e) => setBannerShapes(e.target.checked)}
                  className="rounded"
                />
                Shapes
              </label>
            </div>
            {bannerGradient && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gradient End Color</label>
                <input
                  type="color"
                  value={bannerGradientEnd}
                  onChange={(e) => setBannerGradientEnd(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Banner Background Image URL</label>
              <input
                type="text"
                value={bannerBackgroundImage}
                onChange={(e) => setBannerBackgroundImage(e.target.value)}
                placeholder="/emailImages/banner.jpg"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
          
          {/* Content Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Content Sections</h3>
              <div className="flex gap-1">
                <button onClick={() => addSection('text')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+ Text</button>
                <button onClick={() => addSection('heading')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+ Heading</button>
                <button onClick={() => addSection('button')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+ Button</button>
                <button onClick={() => addSection('divider')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+ Divider</button>
                <button onClick={() => addSection('image')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+ Image</button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contentSections.map((section, index) => (
                <div key={section.id} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === contentSections.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowDownIcon className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">{section.type}</span>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={section.isBold || false}
                          onChange={(e) => updateSection(section.id, { isBold: e.target.checked })}
                          className="rounded"
                        />
                        Bold
                      </label>
                    </div>
                    
                    {section.type !== 'divider' && (
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder={section.type === 'button' ? 'Button text...' : 'Enter content...'}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    )}
                    
                    {section.type === 'button' && (
                      <input
                        type="text"
                        value={section.buttonUrl || ''}
                        onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    )}
                    
                    {(section.type === 'image' || section.type === 'text-image') && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                          placeholder="Image URL or upload below..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(section.id, file);
                          }}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <select
                            value={section.imagePosition || 'center'}
                            onChange={(e) => updateSection(section.id, { imagePosition: e.target.value as 'left' | 'right' | 'center' })}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                          <select
                            value={section.imageSize || 'medium'}
                            onChange={(e) => updateSection(section.id, { imageSize: e.target.value as 'small' | 'medium' | 'large' | 'full' })}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="full">Full</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom Banner Settings */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={bottomBannerEnabled}
                onChange={(e) => setBottomBannerEnabled(e.target.checked)}
                className="rounded"
              />
              Bottom Banner
            </label>
            {bottomBannerEnabled && (
              <>
                <input
                  type="text"
                  value={bottomBannerText}
                  onChange={(e) => setBottomBannerText(e.target.value)}
                  placeholder="Bottom banner text..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bottomBannerColor}
                    onChange={(e) => setBottomBannerColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={bottomBannerGradient}
                      onChange={(e) => setBottomBannerGradient(e.target.checked)}
                      className="rounded"
                    />
                    Gradient
                  </label>
                </div>
              </>
            )}
          </div>
          
          {/* Signature Settings */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">Signature</h3>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Size</label>
                <select
                  value={signatureSize}
                  onChange={(e) => setSignatureSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Style</label>
                <select
                  value={signatureStyle}
                  onChange={(e) => setSignatureStyle(e.target.value as 'white' | 'black')}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="white">White Logo</option>
                  <option value="black">Black Logo</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <XCircleIcon className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={copyHtmlToClipboard}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <CodeBracketIcon className="w-4 h-4" />
              Copy HTML
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sending || !subject.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
        
        {/* Right: Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <EyeIcon className="w-5 h-5" />
            Preview
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
            <iframe
              ref={previewRef}
              title="Email Preview"
              className="w-full h-full"
              style={{ backgroundColor: emailBackgroundColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
