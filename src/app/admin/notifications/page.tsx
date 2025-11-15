'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { hasRole, isAdmin } from '@/lib/roles';
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
  BookmarkIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface User {
  email: string;
  name: string;
  roles: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

interface ContentSection {
  id: string;
  type: 'text' | 'heading' | 'button' | 'divider' | 'image' | 'text-image';
  content: string;
  buttonUrl?: string;
  imageUrl?: string;
  isBold?: boolean;
  imageWidth?: number;
  imagePosition?: 'left' | 'right' | 'center';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
}

interface ScheduledEmail {
  id: string;
  subject: string;
  recipients: string[];
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
}

interface EmailDraft {
  _id: string;
  name: string;
  subject: string;
  emailTitle: string;
  contentSections: ContentSection[];
  selectedUsers: string[];
  selectedMcommunityGroups: string[];
  bannerSettings: any;
  bottomBannerSettings: any;
  signatureSize?: 'small' | 'medium' | 'large';
  signatureStyle?: 'white' | 'black';
  attachments?: Array<{ filename: string; content: string; encoding: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const MCOMMUNITY_GROUPS = [
  { label: 'ABG Contact', email: 'ABGContact@umich.edu' },
  { label: 'ABG Partnerships', email: 'ABGPartnerships@umich.edu' },
  { label: 'ABG Recruitment', email: 'ABGRecruitment@umich.edu' },
  { label: 'ABG Project Advisors', email: 'ABGProjectAdvisors@umich.edu' },
  { label: 'ABG Project Leads', email: 'ABGProjectLeads@umich.edu' },
  { label: 'ABG Resources', email: 'ABGResources@umich.edu' },
  { label: 'AI Business Group eBoard', email: 'ABGEBoard@umich.edu' },
  { label: 'AI Business Group Project Teams', email: 'ABGProjectTeams@umich.edu' },
  { label: 'AI Business Group Tech Committee', email: 'ABGTechCommittee@umich.edu' },
  { label: 'AI Business Group', email: 'aibusinessgroup@umich.edu' },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Template',
    subject: '',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #00274c; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background-color: #ffffff; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://abgumich.org/white-abg-email-signature.png" alt="ABG Logo" style="max-width: 500px; width: 100%; height: auto; border-radius: 10px;">
    </div>
    <div class="content">
      <p>Your content here...</p>
      
      <div class="signature">
        <img src="https://abgumich.org/white-abg-email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'announcement',
    name: 'Announcement',
    subject: 'Important Announcement from ABG',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #00274c 0%, #00509e 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #00274c; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">📢 Announcement</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">AI Business Group</p>
    </div>
    <div class="content">
      <h2 style="color: #00274c;">Hello Team,</h2>
      <p>We're excited to share some important news with you!</p>
      <p>[Your announcement content here...]</p>
      <center><a href="#" class="button">Learn More</a></center>
      
      <div class="signature">
        <img src="https://abgumich.org/white-abg-email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'event',
    name: 'Event Invitation',
    subject: 'You\'re Invited to Our Upcoming Event',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00274c 0%, #5e6472 100%); color: white; padding: 40px 20px; text-align: center; }
    .event-details { background-color: #f0f8ff; padding: 20px; margin: 20px; border-radius: 15px; border-left: 4px solid #00274c; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #00274c; }
    .content { padding: 30px; }
    .button { display: inline-block; padding: 15px 40px; background-color: #00274c; color: white !important; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🎉 You're Invited!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">AI Business Group Event</p>
    </div>
    <div class="content">
      <h2 style="color: #00274c;">Join Us for [Event Name]</h2>
      <p>Hello Team,</p>
      <p>We're thrilled to invite you to our upcoming event!</p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">📅 Date:</span> [Event Date]
        </div>
        <div class="detail-row">
          <span class="detail-label">🕒 Time:</span> [Event Time]
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Location:</span> [Event Location]
        </div>
      </div>
      
      <p>[Event description and details...]</p>
      
      <center>
        <a href="#" class="button">Register Now</a>
      </center>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        We look forward to seeing you there!
      </p>
      
      <div class="signature">
        <img src="https://abgumich.org/white-abg-email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    subject: 'ABG Newsletter - [Month Year]',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 15px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #00274c 0%, #00509e 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px; }
    .section { margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 15px; }
    .section-title { color: #00274c; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">📰 Newsletter</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">[Month Year]</p>
    </div>
    <div class="content">
      <p>Hello Team,</p>
      <p>Here's what's happening at ABG this month!</p>
      
      <div class="section">
        <div class="section-title">🎯 Upcoming Events</div>
        <p>[Event details here...]</p>
      </div>
      
      <div class="section">
        <div class="section-title">🚀 Project Updates</div>
        <p>[Project updates here...]</p>
      </div>
      
      <div class="section">
        <div class="section-title">🎉 Member Spotlight</div>
        <p>[Member spotlight here...]</p>
      </div>
      
      <div class="signature">
        <img src="https://abgumich.org/white-abg-email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'reminder',
    name: 'Reminder',
    subject: 'Reminder: [Event/Action]',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 15px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff9900 0%, #ffcc00 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px; }
    .highlight-box { background-color: #fff3cd; border-left: 4px solid #ff9900; padding: 20px; margin: 20px 0; border-radius: 10px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #00274c; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">⏰ Reminder</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget!</p>
    </div>
    <div class="content">
      <p>Hello Team,</p>
      <p>This is a friendly reminder about:</p>
      
      <div class="highlight-box">
        <strong>[What you're reminding about]</strong><br>
        <p style="margin: 10px 0;">[Details here...]</p>
      </div>
      
      <p>[Additional information...]</p>
      
      <center><a href="#" class="button">Take Action</a></center>
      
      <div class="signature">
        <img src="https://abgumich.org/white-abg-email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
  </div>
</body>
</html>`
  }
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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
  const [bottomBannerText, setBottomBannerText] = useState('Thank you!');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMcommunityGroups, setSelectedMcommunityGroups] = useState<string[]>([]);
  const [contentSections, setContentSections] = useState<ContentSection[]>([
    { id: '1', type: 'text', content: 'Hello Team,' }
  ]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [signatureSize, setSignatureSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [signatureStyle, setSignatureStyle] = useState<'white' | 'black'>('white');
  const [attachments, setAttachments] = useState<Array<{ filename: string; content: string; encoding: string }>>([]);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Generate HTML from content sections
  const generateHtmlFromSections = () => {
    const formatText = (text: string, isBold?: boolean) => {
      // Replace Discord-style links: <text>(url) becomes <a href="url">text</a>
      let formatted = text.replace(/<([^>]+)>\(([^)]+)\)/g, '<a href="$2" style="color: #00274c; text-decoration: underline;">$1</a>');
      // Replace line breaks with <br> tags
      formatted = formatted.replace(/\n/g, '<br>');
      // Apply bold if needed
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
          return `<div style="margin: 20px 0; ${alignStyle}"><img src="${section.imageUrl || ''}" alt="${section.content}" style="${getImageSizeStyle(section.imageSize)} height: auto; border-radius: 10px;" /></div>`;
        case 'text-image':
          const imageFloat = section.imagePosition === 'left' ? 'float: left; margin: 0 20px 10px 0;' : 'float: right; margin: 0 0 10px 20px;';
          return `<div style="margin: 20px 0; overflow: auto;"><img src="${section.imageUrl || ''}" alt="Image" style="${imageFloat} ${getImageSizeStyle(section.imageSize)} height: auto; border-radius: 10px;" /><div style="line-height: 1.6;">${formatText(section.content, section.isBold)}</div></div>`;
        default:
          return '';
      }
    }).join('\n');

    let bannerStyle = '';
    if (bannerBackgroundImage) {
      const overlayOpacity = bannerGradientOpacity * 0.7;
      bannerStyle = `background: linear-gradient(rgba(0, 39, 76, ${overlayOpacity}), rgba(0, 39, 76, ${overlayOpacity})), url('${bannerBackgroundImage}'); background-size: cover; background-position: center;`;
    } else if (bannerGradient) {
      // Convert hex to rgba with opacity
      const colorWithOpacity = (hex: string, opacity: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };
      bannerStyle = `background: linear-gradient(135deg, ${colorWithOpacity(bannerColor, bannerGradientOpacity)} 0%, ${colorWithOpacity(bannerGradientEnd, bannerGradientOpacity)} 100%);`;
    } else {
      bannerStyle = `background-color: ${bannerColor};`;
    }
    
    const shapesHtml = bannerShapes ? `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
        <div style="position: absolute; width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; top: 20%; left: 10%;"></div>
        <div style="position: absolute; width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.2); top: 60%; left: 80%; transform: rotate(45deg);"></div>
        <div style="position: absolute; width: 50px; height: 50px; border: 2px solid rgba(255,255,255,0.25); border-radius: 50%; top: 70%; left: 15%;"></div>
        <div style="position: absolute; width: 35px; height: 35px; border: 2px solid rgba(255,255,255,0.2); top: 30%; left: 85%; transform: rotate(45deg);"></div>
        <div style="position: absolute; width: 25px; height: 25px; border: 2px solid rgba(255,255,255,0.3); top: 80%; left: 70%; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>
        <div style="position: absolute; width: 45px; height: 45px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; top: 15%; left: 70%;"></div>
      </div>` : '';

    // Bottom banner generation
    let bottomBannerStyle = '';
    if (bottomBannerEnabled) {
      if (bottomBannerBackgroundImage) {
        const overlayOpacity = bottomBannerGradientOpacity * 0.7;
        bottomBannerStyle = `background: linear-gradient(rgba(0, 39, 76, ${overlayOpacity}), rgba(0, 39, 76, ${overlayOpacity})), url('${bottomBannerBackgroundImage}'); background-size: cover; background-position: center;`;
      } else if (bottomBannerGradient) {
        const colorWithOpacity = (hex: string, opacity: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };
        bottomBannerStyle = `background: linear-gradient(135deg, ${colorWithOpacity(bottomBannerColor, bottomBannerGradientOpacity)} 0%, ${colorWithOpacity(bottomBannerGradientEnd, bottomBannerGradientOpacity)} 100%);`;
      } else {
        bottomBannerStyle = `background-color: ${bottomBannerColor};`;
      }
    }

    const bottomShapesHtml = (bottomBannerEnabled && bottomBannerShapes) ? `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
        <div style="position: absolute; width: 35px; height: 35px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; top: 30%; left: 15%;"></div>
        <div style="position: absolute; width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.2); top: 50%; left: 75%; transform: rotate(45deg);"></div>
        <div style="position: absolute; width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.25); border-radius: 50%; top: 60%; left: 20%;"></div>
        <div style="position: absolute; width: 45px; height: 45px; border: 2px solid rgba(255,255,255,0.2); top: 20%; left: 80%;"></div>
      </div>` : '';

    const signatureUrl = signatureStyle === 'white' ? 'https://abgumich.org/white-abg-email-signature.png' : 'https://abgumich.org/black-abg-email-signature.png';

    const bottomBannerHtml = bottomBannerEnabled ? `
      <div class="bottom-banner" style="${bottomBannerStyle} color: white; padding: 20px; text-align: center; position: relative;">
        ${bottomShapesHtml}
        <p style="margin: 0 0 15px 0; font-size: 18px; position: relative; z-index: 2;">${bottomBannerText}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.3); position: relative; z-index: 2;">
          <img src="${signatureUrl}" alt="AI Business Group Signature" style="max-width: ${signatureSize === 'small' ? '300px' : signatureSize === 'large' ? '600px' : '450px'}; width: 100%; border-radius: 10px; display: block; margin: 0 auto;">
        </div>
      </div>` : `
      <div class="signature-section" style="padding: 20px; text-align: center; background-color: white;">
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #00274c;">
          <img src="${signatureUrl}" alt="AI Business Group Signature" style="max-width: ${signatureSize === 'small' ? '300px' : signatureSize === 'large' ? '600px' : '450px'}; width: 100%; border-radius: 10px; display: block; margin: 0 auto;">
        </div>
      </div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { ${bannerStyle} color: white; padding: 30px 20px; text-align: center; position: relative; }
    .content { padding: 30px 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${shapesHtml}
      <h1 style="margin: 0; font-size: 28px; position: relative; z-index: 1;">${emailTitle}</h1>
    </div>
    <div class="content">
      ${sectionsHtml}
    </div>
    ${bottomBannerHtml}
  </div>
</body>
</html>`;
  };

  // Update preview iframe whenever content sections or subject changes (live preview)
  useEffect(() => {
    const generatedHtml = generateHtmlFromSections();
    setHtmlContent(generatedHtml);
    
    if (previewRef.current) {
      const iframe = previewRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatedHtml);
        doc.close();
      }
    }
  }, [contentSections, subject, emailTitle, bannerColor, bannerGradient, bannerGradientEnd, bannerGradientOpacity, bannerBackgroundImage, bannerShapes, bottomBannerEnabled, bottomBannerColor, bottomBannerGradient, bottomBannerGradientEnd, bottomBannerGradientOpacity, bottomBannerBackgroundImage, bottomBannerShapes, bottomBannerText, signatureSize, signatureStyle]);

  useEffect(() => {
    loadUsers();
    loadScheduledEmails();
    loadDrafts();
  }, []);

  // Auto-save draft when content changes
  useEffect(() => {
    // Only auto-save if there's a current draft and draft name
    if (!currentDraftId || !draftName.trim()) return;

    const autoSave = async () => {
      try {
        const bannerSettings = {
          bannerColor,
          bannerGradient,
          bannerGradientEnd,
          bannerGradientOpacity,
          bannerBackgroundImage,
          bannerShapes
        };

        const bottomBannerSettings = {
          bottomBannerEnabled,
          bottomBannerColor,
          bottomBannerGradient,
          bottomBannerGradientEnd,
          bottomBannerGradientOpacity,
          bottomBannerBackgroundImage,
          bottomBannerShapes,
          bottomBannerText
        };

        const draftData = {
          name: draftName,
          subject,
          emailTitle,
          contentSections,
          selectedUsers,
          selectedMcommunityGroups,
          bannerSettings,
          bottomBannerSettings,
          signatureSize,
          signatureStyle,
          attachments
        };

        await fetch('/api/admin/notifications/drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...draftData, id: currentDraftId })
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    autoSave();
  }, [currentDraftId, draftName, subject, emailTitle, contentSections, selectedUsers, selectedMcommunityGroups, 
      bannerColor, bannerGradient, bannerGradientEnd, bannerGradientOpacity, bannerBackgroundImage, bannerShapes,
      bottomBannerEnabled, bottomBannerColor, bottomBannerGradient, bottomBannerGradientEnd, bottomBannerGradientOpacity,
      bottomBannerBackgroundImage, bottomBannerShapes, bottomBannerText, signatureSize, signatureStyle, attachments]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledEmails = async () => {
    try {
      const response = await fetch('/api/admin/notifications/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled emails:', error);
    }
  };

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/admin/notifications/drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Array<{ filename: string; content: string; encoding: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64.split(',')[1];
        newAttachments.push({
          filename: file.name,
          content: base64Content,
          encoding: 'base64'
        });

        if (newAttachments.length === files.length) {
          setAttachments([...attachments, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a draft name' });
      return;
    }

    try {
      const bannerSettings = {
        bannerColor,
        bannerGradient,
        bannerGradientEnd,
        bannerGradientOpacity,
        bannerBackgroundImage,
        bannerShapes
      };

      const bottomBannerSettings = {
        bottomBannerEnabled,
        bottomBannerColor,
        bottomBannerGradient,
        bottomBannerGradientEnd,
        bottomBannerGradientOpacity,
        bottomBannerBackgroundImage,
        bottomBannerShapes,
        bottomBannerText
      };

      const draftData = {
        name: draftName,
        subject,
        emailTitle,
        contentSections,
        selectedUsers,
        selectedMcommunityGroups,
        bannerSettings,
        bottomBannerSettings,
        signatureSize,
        signatureStyle,
        attachments
      };

      let response;
      if (currentDraftId) {
        // Update existing draft
        response = await fetch('/api/admin/notifications/drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...draftData, id: currentDraftId })
        });
      } else {
        // Create new draft
        response = await fetch('/api/admin/notifications/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData)
        });
      }

      if (response.ok) {
        setMessage({ type: 'success', text: `Draft ${currentDraftId ? 'saved' : 'created'}! Auto-save is now active.` });
        loadDrafts();
        if (!currentDraftId) {
          const data = await response.json();
          setCurrentDraftId(data.draft._id);
        }
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      setMessage({ type: 'error', text: 'Failed to save draft' });
    }
  };

  const handleLoadDraft = (draft: EmailDraft) => {
    setCurrentDraftId(draft._id);
    setDraftName(draft.name);
    setSubject(draft.subject);
    setEmailTitle(draft.emailTitle);
    setContentSections(draft.contentSections);
    setSelectedUsers(draft.selectedUsers || []);
    setSelectedMcommunityGroups(draft.selectedMcommunityGroups || []);
    
    if (draft.bannerSettings) {
      setBannerColor(draft.bannerSettings.bannerColor || '#00274c');
      setBannerGradient(draft.bannerSettings.bannerGradient || false);
      setBannerGradientEnd(draft.bannerSettings.bannerGradientEnd || '#00509e');
      setBannerGradientOpacity(draft.bannerSettings.bannerGradientOpacity || 1);
      setBannerBackgroundImage(draft.bannerSettings.bannerBackgroundImage || '');
      setBannerShapes(draft.bannerSettings.bannerShapes || false);
    }
    
    if (draft.bottomBannerSettings) {
      setBottomBannerEnabled(draft.bottomBannerSettings.bottomBannerEnabled || false);
      setBottomBannerColor(draft.bottomBannerSettings.bottomBannerColor || '#00274c');
      setBottomBannerGradient(draft.bottomBannerSettings.bottomBannerGradient || false);
      setBottomBannerGradientEnd(draft.bottomBannerSettings.bottomBannerGradientEnd || '#00509e');
      setBottomBannerGradientOpacity(draft.bottomBannerSettings.bottomBannerGradientOpacity || 1);
      setBottomBannerBackgroundImage(draft.bottomBannerSettings.bottomBannerBackgroundImage || '');
      setBottomBannerShapes(draft.bottomBannerSettings.bottomBannerShapes || false);
      setBottomBannerText(draft.bottomBannerSettings.bottomBannerText || 'Thank you!');
    }
    
    if (draft.signatureSize) {
      setSignatureSize(draft.signatureSize);
    }
    if (draft.signatureStyle) {
      setSignatureStyle(draft.signatureStyle);
    }
    
    setAttachments(draft.attachments || []);
    
    setShowDrafts(false);
    setMessage({ type: 'success', text: 'Draft loaded! Auto-save is active.' });
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      const response = await fetch(`/api/admin/notifications/drafts?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Draft deleted successfully!' });
        loadDrafts();
        if (currentDraftId === id) {
          handleNewDraft();
        }
      } else {
        throw new Error('Failed to delete draft');
      }
    } catch (error) {
      console.error('Delete draft error:', error);
      setMessage({ type: 'error', text: 'Failed to delete draft' });
    }
  };

  const handleNewDraft = () => {
    setCurrentDraftId(null);
    setDraftName('');
    setSubject('');
    setEmailTitle('Email from ABG');
    setContentSections([{ id: '1', type: 'text', content: 'Hello Team,' }]);
    setSelectedUsers([]);
    setSelectedMcommunityGroups([]);
    setBannerColor('#00274c');
    setBannerGradient(false);
    setBannerGradientEnd('#00509e');
    setBannerGradientOpacity(1);
    setBannerBackgroundImage('');
    setBannerShapes(false);
    setBottomBannerEnabled(false);
    setBottomBannerColor('#00274c');
    setBottomBannerGradient(false);
    setBottomBannerGradientEnd('#00509e');
    setBottomBannerGradientOpacity(1);
    setBottomBannerBackgroundImage('');
    setBottomBannerShapes(false);
    setBottomBannerText('Thank you!');
    setSignatureSize('medium');
    setSignatureStyle('white');
    setAttachments([]);
    setMessage(null);
  };

  const handleScheduledSend = async () => {
    if (!scheduleDate || !scheduleTime) {
      setMessage({ type: 'error', text: 'Please select a date and time for scheduling' });
      return;
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledFor <= new Date()) {
      setMessage({ type: 'error', text: 'Scheduled time must be in the future' });
      return;
    }

    const allRecipients = [...selectedMcommunityGroups, ...selectedUsers];
    if (allRecipients.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one recipient' });
      return;
    }
    if (!subject.trim() || contentSections.length === 0) {
      setMessage({ type: 'error', text: 'Please complete the email content' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/notifications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: allRecipients,
          subject,
          htmlContent,
          scheduledFor: scheduledFor.toISOString(),
          attachments
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email scheduled successfully!' });
        loadScheduledEmails();
        setScheduleDate('');
        setScheduleTime('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule email');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to schedule email' 
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.email));
    }
  };

  const handleToggleUser = (email: string) => {
    setSelectedUsers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectByRole = (role: string) => {
    const usersWithRole = users.filter(u => u.roles.includes(role));
    setSelectedUsers(usersWithRole.map(u => u.email));
  };

  // Content section handlers
  const addSection = (type: ContentSection['type']) => {
    const newSection: ContentSection = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'New Heading' : type === 'button' ? 'Click Here' : type === 'image' ? 'Image description' : type === 'text-image' ? 'Your text here...' : type === 'divider' ? '' : 'New paragraph...',
      buttonUrl: type === 'button' ? 'https://abgumich.org' : undefined,
      imageUrl: (type === 'image' || type === 'text-image') ? 'https://abgumich.org/images/placeholder.png' : undefined,
      imagePosition: (type === 'image' || type === 'text-image') ? 'left' : undefined,
      imageSize: (type === 'image' || type === 'text-image') ? 'medium' : undefined
    };
    setContentSections([...contentSections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    setContentSections(contentSections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (id: string) => {
    setContentSections(contentSections.filter(section => section.id !== id));
  };

  const moveSectionUp = (id: string) => {
    const index = contentSections.findIndex(s => s.id === id);
    if (index > 0) {
      const newSections = [...contentSections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      setContentSections(newSections);
    }
  };

  const moveSectionDown = (id: string) => {
    const index = contentSections.findIndex(s => s.id === id);
    if (index < contentSections.length - 1) {
      const newSections = [...contentSections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setContentSections(newSections);
    }
  };

  const handleSendEmails = async () => {
    // Combine mcommunity groups FIRST, then individual users
    const allRecipients = [...selectedMcommunityGroups, ...selectedUsers];
    
    if (allRecipients.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one recipient or mcommunity group' });
      return;
    }
    if (!subject.trim()) {
      setMessage({ type: 'error', text: 'Please enter a subject' });
      return;
    }
    if (contentSections.length === 0) {
      setMessage({ type: 'error', text: 'Please add content sections' });
      return;
    }
    if (!htmlContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter email content' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: allRecipients,
          subject,
          htmlContent,
          attachments
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Successfully sent ${data.sent} email(s)${data.failed > 0 ? `, ${data.failed} failed` : ''}` 
        });
        setSelectedUsers([]);
        setSelectedMcommunityGroups([]);
        setContentSections([{ id: '1', type: 'text', content: 'Hello Team,' }]);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send emails' 
      });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session?.user || !isAdmin(session.user.roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
              <p className="text-gray-600 text-sm">Send custom HTML emails to users</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FolderIcon className="w-5 h-5" />
                Drafts ({drafts.length})
              </button>
              <Link 
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Drafts Panel */}
      {showDrafts && (
        <div className="mx-6 mb-6 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Saved Drafts</h2>
            <button
              onClick={handleNewDraft}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Draft
            </button>
          </div>
          <div className="p-4">
            {drafts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No saved drafts</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                  <div
                    key={draft._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      currentDraftId === draft._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1">{draft.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDraft(draft._id);
                        }}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{draft.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Updated: {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleLoadDraft(draft)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Load Draft
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircleIcon className="w-5 h-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="px-6 space-y-6">
        {/* Row 1: Email Content Builder | Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Content Builder */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CodeBracketIcon className="w-5 h-5" />
                Email Content Builder
              </h2>
              <button
                onClick={() => setShowDrafts(true)}
                className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
              >
                <FolderIcon className="w-4 h-4" />
                View Drafts
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Draft Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draft Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Enter draft name to save..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={handleSaveDraft}
                    disabled={!draftName.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    {currentDraftId ? 'Update' : 'Save'}
                  </button>
                </div>
                {currentDraftId && (
                  <p className="text-xs text-green-600 mt-1">✓ Auto-save active for: {draftName}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Banner Title</label>
                <input
                  type="text"
                  value={emailTitle}
                  onChange={(e) => setEmailTitle(e.target.value)}
                  placeholder="Email from ABG"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Banner Customization */}
              <div className="space-y-3 border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700">Banner Customization</h3>
                
                {/* Use Gradient Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useGradient"
                    checked={bannerGradient}
                    onChange={(e) => setBannerGradient(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="useGradient" className="text-sm font-medium text-gray-700">Use Gradient</label>
                </div>
                
                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{bannerGradient ? 'Start Color' : 'Banner Color'}</label>
                    <input
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  {bannerGradient && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Color</label>
                      <input
                        type="color"
                        value={bannerGradientEnd}
                        onChange={(e) => setBannerGradientEnd(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                
                {/* Gradient Opacity */}
                {(bannerGradient || bannerBackgroundImage) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Opacity: {Math.round(bannerGradientOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={bannerGradientOpacity}
                      onChange={(e) => setBannerGradientOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL (Optional)</label>
                  <input
                    type="url"
                    value={bannerBackgroundImage}
                    onChange={(e) => setBannerBackgroundImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                {/* Add Shapes Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bannerShapes"
                    checked={bannerShapes}
                    onChange={(e) => setBannerShapes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="bannerShapes" className="text-sm font-medium text-gray-700">Add Decorative Shapes</label>
                </div>
              </div>

              {/* Bottom Banner Customization */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bottomBannerEnabled"
                    checked={bottomBannerEnabled}
                    onChange={(e) => setBottomBannerEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="bottomBannerEnabled" className="text-sm font-semibold text-gray-700">Add Bottom Banner</label>
                </div>

                {bottomBannerEnabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                    {/* Bottom Banner Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Banner Text</label>
                      <input
                        type="text"
                        value={bottomBannerText}
                        onChange={(e) => setBottomBannerText(e.target.value)}
                        placeholder="Thank you!"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    {/* Bottom Banner Gradient Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bottomBannerGradient"
                        checked={bottomBannerGradient}
                        onChange={(e) => setBottomBannerGradient(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="bottomBannerGradient" className="text-sm font-medium text-gray-700">Use Gradient</label>
                    </div>

                    {/* Bottom Banner Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{bottomBannerGradient ? 'Start Color' : 'Banner Color'}</label>
                        <input
                          type="color"
                          value={bottomBannerColor}
                          onChange={(e) => setBottomBannerColor(e.target.value)}
                          className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                      </div>
                      {bottomBannerGradient && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Color</label>
                          <input
                            type="color"
                            value={bottomBannerGradientEnd}
                            onChange={(e) => setBottomBannerGradientEnd(e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bottom Banner Opacity */}
                    {(bottomBannerGradient || bottomBannerBackgroundImage) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Opacity: {Math.round(bottomBannerGradientOpacity * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={bottomBannerGradientOpacity}
                          onChange={(e) => setBottomBannerGradientOpacity(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Bottom Banner Background Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL (Optional)</label>
                      <input
                        type="url"
                        value={bottomBannerBackgroundImage}
                        onChange={(e) => setBottomBannerBackgroundImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    {/* Bottom Banner Shapes */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bottomBannerShapes"
                        checked={bottomBannerShapes}
                        onChange={(e) => setBottomBannerShapes(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="bottomBannerShapes" className="text-sm font-medium text-gray-700">Add Decorative Shapes</label>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature Size Control */}
              <div className="space-y-3 border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700">Signature Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Style</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSignatureStyle('white')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        signatureStyle === 'white'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      White Background
                    </button>
                    <button
                      onClick={() => setSignatureStyle('black')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        signatureStyle === 'black'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Black Background
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Size</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSignatureSize('small')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        signatureSize === 'small'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => setSignatureSize('medium')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        signatureSize === 'medium'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setSignatureSize('large')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        signatureSize === 'large'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-3 border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700">File Attachments</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600">Attached files:</p>
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{attachment.filename}</span>
                          <button
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Section Buttons */}
              <div className="flex gap-2 flex-wrap border-t pt-3">
                <button
                  onClick={() => addSection('heading')}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Heading
                </button>
                <button
                  onClick={() => addSection('text')}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Text
                </button>
                <button
                  onClick={() => addSection('button')}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Button
                </button>
                <button
                  onClick={() => addSection('image')}
                  className="px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Image
                </button>
                <button
                  onClick={() => addSection('text-image')}
                  className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Text + Image
                </button>
                <button
                  onClick={() => addSection('divider')}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Divider
                </button>
              </div>

              {/* Content Sections */}
              <div className="space-y-3">
                {contentSections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {section.type === 'text-image' ? 'Text + Image' : section.type}
                        </span>
                        {(section.type === 'text' || section.type === 'heading' || section.type === 'text-image') && (
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={section.isBold || false}
                              onChange={(e) => updateSection(section.id, { isBold: e.target.checked })}
                              className="w-3 h-3 rounded border-gray-300"
                            />
                            <strong>Bold</strong>
                          </label>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveSectionUp(section.id)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSectionDown(section.id)}
                          disabled={index === contentSections.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {section.type !== 'divider' && (
                      <textarea
                        value={section.content}
                        onChange={(e) => {
                          updateSection(section.id, { content: e.target.value });
                          // Auto-expand textarea
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={section.type === 'heading' ? 1 : 3}
                        style={{ overflow: 'hidden', resize: 'none' }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Enter ${section.type} content... (Press Enter for new lines)`}
                      />
                    )}
                    
                    {section.type === 'button' && (
                      <input
                        type="url"
                        value={section.buttonUrl || ''}
                        onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
                        placeholder="Button URL (e.g., https://abgumich.org)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                      />
                    )}
                    
                    {section.type === 'image' && (
                      <>
                        <input
                          type="url"
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                          placeholder="Image URL (e.g., https://example.com/image.png)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                        />
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Image Size</label>
                            <div className="flex gap-1">
                              {['small', 'medium', 'large', 'full'].map(size => (
                                <button
                                  key={size}
                                  onClick={() => updateSection(section.id, { imageSize: size as any })}
                                  className={`flex-1 px-2 py-1 rounded text-xs ${
                                    section.imageSize === size
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {size.charAt(0).toUpperCase() + size.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                            <div className="flex gap-1">
                              {['left', 'center', 'right'].map(pos => (
                                <button
                                  key={pos}
                                  onClick={() => updateSection(section.id, { imagePosition: pos as any })}
                                  className={`flex-1 px-2 py-1 rounded text-xs ${
                                    section.imagePosition === pos
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {section.type === 'text-image' && (
                      <>
                        <input
                          type="url"
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                          placeholder="Image URL (e.g., https://example.com/image.png)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                        />
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Image Size</label>
                            <div className="flex gap-1">
                              {['small', 'medium', 'large'].map(size => (
                                <button
                                  key={size}
                                  onClick={() => updateSection(section.id, { imageSize: size as any })}
                                  className={`flex-1 px-2 py-1 rounded text-xs ${
                                    section.imageSize === size
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {size.charAt(0).toUpperCase() + size.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Image Position</label>
                            <div className="flex gap-1">
                              {['left', 'right'].map(pos => (
                                <button
                                  key={pos}
                                  onClick={() => updateSection(section.id, { imagePosition: pos as any })}
                                  className={`flex-1 px-2 py-1 rounded text-xs ${
                                    section.imagePosition === pos
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                Live Preview
              </h2>
            </div>
            <div className="p-4">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  ref={previewRef}
                  className="w-full h-[750px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Mcommunity Groups | Recipients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mcommunity Groups Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mcommunity Groups</h2>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">{MCOMMUNITY_GROUPS.map(group => (
                <label key={group.email} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMcommunityGroups.includes(group.email)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMcommunityGroups([...selectedMcommunityGroups, group.email]);
                      } else {
                        setSelectedMcommunityGroups(selectedMcommunityGroups.filter(email => email !== group.email));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{group.label}</div>
                    <div className="text-xs text-gray-500">{group.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Recipients Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                Recipients ({selectedUsers.length})
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Quick Select by Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select by Role</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectByRole('ADMIN')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                  >
                    All Admins
                  </button>
                  <button
                    onClick={() => handleSelectByRole('GENERAL_MEMBER')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    General Members
                  </button>
                  <button
                    onClick={() => handleSelectByRole('PROJECT_TEAM_MEMBER')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                  >
                    Project Team
                  </button>
                </div>
              </div>

              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label className="text-sm text-gray-700 cursor-pointer" onClick={handleSelectAll}>
                  Select All ({filteredUsers.length})
                </label>
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                  <label key={user.email} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.email)}
                      onChange={() => handleToggleUser(user.email)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Summary */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Total Recipients:</strong> {selectedMcommunityGroups.length} group{selectedMcommunityGroups.length !== 1 ? 's' : ''} + {selectedUsers.length} individual{selectedUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Row 3: Send Buttons & Scheduled Emails */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Buttons */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="space-y-4">
              {/* Immediate Send */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Send Now</h3>
                <button
                  onClick={handleSendEmails}
                  disabled={sending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      Send Emails
                    </>
                  )}
                </button>
              </div>

              {/* Scheduled Send */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Schedule Send</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  onClick={handleScheduledSend}
                  disabled={sending}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {sending ? (
                    <>Scheduling...</>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      Schedule Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Scheduled Emails */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Scheduled Emails</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {scheduledEmails.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No scheduled emails</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scheduledEmails.map(email => (
                      <div key={email.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-900 truncate">{email.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(email.scheduledFor).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {email.recipients.length} recipient(s)
                        </div>
                        <div className={`text-xs mt-1 font-medium ${
                          email.status === 'pending' ? 'text-blue-600' : 
                          email.status === 'sent' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {email.status.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}