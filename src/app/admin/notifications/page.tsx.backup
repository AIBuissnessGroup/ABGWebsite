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
  ArrowDownIcon
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
  type: 'text' | 'heading' | 'button' | 'divider' | 'image';
  content: string;
  buttonUrl?: string;
  imageUrl?: string;
}

interface ScheduledEmail {
  id: string;
  subject: string;
  recipients: string[];
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
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
      <img src="https://abgumich.org/email-signature.png" alt="ABG Logo" style="max-width: 500px; width: 100%; height: auto; border-radius: 10px;">
    </div>
    <div class="content">
      <p>Your content here...</p>
      
      <div class="signature">
        <img src="https://abgumich.org/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
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
        <img src="https://abgumich.org/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
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
        <img src="https://abgumich.org/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
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
        <img src="https://abgumich.org/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
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
        <img src="https://abgumich.org/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
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
  const [bannerGradient, setBannerGradient] = useState('');
  const [bannerGradientEnd, setBannerGradientEnd] = useState('#00509e');
  const [bannerGradientAngle, setBannerGradientAngle] = useState(135);
  const [bannerBackgroundImage, setBannerBackgroundImage] = useState('');
  const [showBannerShapes, setShowBannerShapes] = useState(false);
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
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Generate HTML from content sections
  const generateHtmlFromSections = () => {
    const sectionsHtml = contentSections.map(section => {
      switch (section.type) {
        case 'heading':
          return `<h2 style="color: #00274c; font-size: 24px; margin: 20px 0 10px 0;">${section.content}</h2>`;
        case 'text':
          return `<p style="margin: 10px 0; line-height: 1.6;">${section.content}</p>`;
        case 'button':
          return `<div style="margin: 20px 0; text-align: center;"><a href="${section.buttonUrl || '#'}" style="display: inline-block; padding: 12px 30px; background-color: #00274c; color: white; text-decoration: none; border-radius: 25px;">${section.content}</a></div>`;
        case 'divider':
          return `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;" />`;
        case 'image':
          return `<div style="margin: 20px 0; text-align: center;"><img src="${section.imageUrl || ''}" alt="${section.content}" style="max-width: 100%; height: auto; border-radius: 10px;" /></div>`;
        default:
          return '';
      }
    }).join('\n');

    let bannerStyle = '';
    if (bannerBackgroundImage) {
      bannerStyle = `background: url('${bannerBackgroundImage}') center/cover no-repeat${bannerGradient ? `, linear-gradient(${bannerGradientAngle}deg, ${bannerColor} 0%, ${bannerGradientEnd} 100%)` : ''}; background-blend-mode: overlay;`;
    } else if (bannerGradient) {
      bannerStyle = `background: linear-gradient(${bannerGradientAngle}deg, ${bannerColor} 0%, ${bannerGradientEnd} 100%);`;
    } else {
      bannerStyle = `background-color: ${bannerColor};`;
    }

    const shapesHtml = showBannerShapes ? `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.15;">
        <div style="position: absolute; top: 20%; left: 10%; width: 60px; height: 60px; border: 2px solid white; border-radius: 50%;"></div>
        <div style="position: absolute; top: 60%; right: 15%; width: 40px; height: 40px; border: 2px solid white; transform: rotate(45deg);"></div>
        <div style="position: absolute; bottom: 25%; left: 20%; width: 50px; height: 50px; border: 2px solid white; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>
        <div style="position: absolute; top: 40%; right: 25%; width: 45px; height: 45px; border: 2px solid white; border-radius: 50%;"></div>
        <div style="position: absolute; bottom: 40%; right: 10%; width: 35px; height: 35px; border: 2px solid white; transform: rotate(45deg);"></div>
      </div>
    ` : '';

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
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #00274c; }
    .signature img { max-width: 100%; height: auto; border-radius: 10px; }
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
      <div class="signature">
        <img src="https://abgumich.org/images/email-signature.png" alt="AI Business Group Signature" style="max-width: 100%; border-radius: 10px;">
      </div>
    </div>
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
  }, [contentSections, subject, emailTitle, bannerColor, bannerGradient, bannerGradientEnd, bannerGradientAngle, bannerBackgroundImage, showBannerShapes]);

  useEffect(() => {
    loadUsers();
    loadScheduledEmails();
  }, []);

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
          scheduledFor: scheduledFor.toISOString()
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
      content: type === 'heading' ? 'New Heading' : type === 'button' ? 'Click Here' : type === 'image' ? 'Image description' : type === 'divider' ? '' : 'New paragraph...',
      buttonUrl: type === 'button' ? 'https://abgumich.org' : undefined,
      imageUrl: type === 'image' ? 'https://abgumich.org/images/placeholder.png' : undefined
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
          htmlContent
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
            <Link 
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

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
        {/* Top Row - Email Content Builder & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Content Builder */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CodeBracketIcon className="w-5 h-5" />
                Email Content Builder
              </h2>
            </div>

            <div className="p-4 space-y-4">
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
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Banner Customization</h3>
                
                {/* Gradient Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useGradient"
                    checked={bannerGradient !== ''}
                    onChange={(e) => setBannerGradient(e.target.checked ? 'gradient' : '')}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="useGradient" className="text-sm font-medium text-gray-700">Use Gradient</label>
                </div>
                
                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{bannerGradient ? 'Start Color' : 'Banner Color'}</label>
                    <input
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  {bannerGradient && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Color</label>
                      <input
                        type="color"
                        value={bannerGradientEnd}
                        onChange={(e) => setBannerGradientEnd(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                
                {/* Gradient Angle */}
                {bannerGradient && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gradient Angle: {bannerGradientAngle}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={bannerGradientAngle}
                      onChange={(e) => setBannerGradientAngle(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Background Image */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Image URL (optional)</label>
                  <input
                    type="url"
                    value={bannerBackgroundImage}
                    onChange={(e) => setBannerBackgroundImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Show Shapes */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showShapes"
                    checked={showBannerShapes}
                    onChange={(e) => setShowBannerShapes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="showShapes" className="text-sm font-medium text-gray-700">Add Decorative Shapes</label>
                </div>
              </div>

              {/* Add Section Buttons */}
              <div className="flex gap-2 flex-wrap">
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
                  onClick={() => addSection('divider')}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Divider
                </button>
              </div>

              {/* Content Sections */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contentSections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {section.type}
                      </span>
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
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        rows={section.type === 'heading' ? 1 : 3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Enter ${section.type} content...`}
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
                      <input
                        type="url"
                        value={section.imageUrl || ''}
                        onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                        placeholder="Image URL (e.g., https://example.com/image.png)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                      />
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
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Mcommunity Groups & Recipients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mcommunity Groups Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Mcommunity Groups</h2>
            </div>
            <div className="p-4 space-y-3">
              {MCOMMUNITY_GROUPS.map(group => (
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

        </div>

        {/* Recipients Summary */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Total Recipients:</strong> {selectedMcommunityGroups.length} group{selectedMcommunityGroups.length !== 1 ? 's' : ''} + {selectedUsers.length} individual{selectedUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Third Row - Scheduled Emails */}
        <div>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CodeBracketIcon className="w-5 h-5" />
                Email Content Builder
              </h2>
            </div>

            <div className="p-4 space-y-4">
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

              {/* Banner Color/Gradient */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="useGradient"
                    checked={bannerGradient !== ''}
                    onChange={(e) => setBannerGradient(e.target.checked ? 'gradient' : '')}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="useGradient" className="text-sm font-medium text-gray-700">Use Gradient</label>
                </div>
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
              </div>

              {/* Add Section Buttons */}
              <div className="flex gap-2 flex-wrap">
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
                  onClick={() => addSection('divider')}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Divider
                </button>
              </div>

              {/* Content Sections */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contentSections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {section.type}
                      </span>
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
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        rows={section.type === 'heading' ? 1 : 3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Enter ${section.type} content...`}
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
                      <input
                        type="url"
                        value={section.imageUrl || ''}
                        onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                        placeholder="Image URL (e.g., https://example.com/image.png)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                      />
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
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                />
              </div>
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

      {/* Send Button */}
      <div className="mx-6 mt-6 pb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}