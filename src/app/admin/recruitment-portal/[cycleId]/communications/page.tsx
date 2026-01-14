'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  EnvelopeIcon, 
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useCycle } from '../layout';

export default function CycleCommunicationsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  
  // Email state
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [subject, setSubject] = useState('Application Update - ABG');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const previewRef = useRef<HTMLIFrameElement>(null);

  const portalUrl = 'https://abgumich.org/portal';

  // Generate the styled HTML email
  const generateEmailHtml = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #00274c 0%, #00509e 100%); padding: 50px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Application Update</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="color: #333333; font-size: 18px; line-height: 1.8; margin: 0 0 30px 0; text-align: center;">
                There's been an update on your application.
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0; text-align: center;">
                Please check the Applicant Portal to view your latest status and any next steps.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${portalUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #00274c 0%, #00509e 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(0, 39, 76, 0.3);">
                  View Portal
                </a>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 40px 0 0 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${portalUrl}" style="color: #00274c; text-decoration: underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">AI Business Group</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">University of Michigan</p>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer Text -->
        <p style="color: #999999; font-size: 12px; margin-top: 30px; text-align: center;">
          You're receiving this email because you applied to ABG.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Update preview
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcdoc = generateEmailHtml();
    }
  }, []);

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const handleSendEmail = async () => {
    const validRecipients = recipients.filter(r => r.trim());
    
    if (validRecipients.length === 0) {
      toast.error('Please enter at least one recipient');
      return;
    }
    
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    if (!confirm(`Send email to ${validRecipients.length} recipient(s)?`)) {
      return;
    }
    
    try {
      setSending(true);
      setMessage(null);
      
      const html = generateEmailHtml();
      
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validRecipients,
          subject,
          htmlContent: html,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
      
      setMessage({ type: 'success', text: `Email sent successfully to ${validRecipients.length} recipient(s)!` });
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send email' });
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Application Update</h1>
        <p className="text-gray-500 text-sm mt-1">
          Notify applicants that there's an update on their application
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5" />
            Email Details
          </h2>
          
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients (MCommunity groups or emails)
            </label>
            <div className="space-y-2">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="e.g., abg-applicants@umich.edu or name@umich.edu"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addRecipient}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add another recipient
            </button>
          </div>
          
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Email Content:</strong> This will send a styled notification email letting recipients know there's been an update on their application and directing them to check the portal.
            </p>
          </div>
          
          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
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
          
          {/* Send Button */}
          <button
            onClick={handleSendEmail}
            disabled={sending || recipients.every(r => !r.trim())}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
        
        {/* Right: Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <EyeIcon className="w-5 h-5" />
            Email Preview
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <iframe
              ref={previewRef}
              title="Email Preview"
              className="w-full h-full"
              style={{ backgroundColor: '#f4f4f4' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
