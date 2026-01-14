'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  PaperAirplaneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState, AdminEmptyState } from '@/components/admin/ui';
import { TRACK_FILTER_OPTIONS } from '@/lib/tracks';
import type { ApplicationStage, ApplicationTrack, EmailLog } from '@/types/recruitment';

const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'draft', label: 'Draft' },
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

const EMAIL_TEMPLATES = [
  { id: 'custom', name: 'Custom Email', subject: '', body: '' },
  { id: 'application_received', name: 'Application Received', subject: 'Application Received - ABG', body: `Hi {{name}},

Thank you for submitting your application to ABG! We've received your application and will review it shortly.

What's next:
- Our team will review all applications
- You'll receive updates about your application status
- Keep an eye on your email for next steps

If you have any questions, please don't hesitate to reach out.

Best,
ABG Recruitment Team` },
  { id: 'coffee_chat_invite', name: 'Coffee Chat Invitation', subject: 'Coffee Chat Invitation - ABG', body: `Hi {{name}},

Congratulations! We were impressed by your application and would like to invite you to schedule a coffee chat with one of our members.

Please visit your applicant portal to book a time slot that works for you.

Looking forward to meeting you!

Best,
ABG Recruitment Team` },
  { id: 'interview_invite', name: 'Interview Invitation', subject: 'Interview Invitation - ABG', body: `Hi {{name}},

Great news! We'd like to invite you to interview for ABG.

Please visit your applicant portal to view available interview slots and book a time.

Best,
ABG Recruitment Team` },
  { id: 'acceptance', name: 'Acceptance', subject: 'Welcome to ABG!', body: `Hi {{name}},

Congratulations! 🎉

We are thrilled to offer you a position with ABG. Your application stood out among many impressive candidates, and we're excited to have you join our team.

You'll receive a follow-up email shortly with next steps for onboarding.

Welcome to ABG!

Best,
ABG Recruitment Team` },
  { id: 'rejection', name: 'Rejection', subject: 'Application Update - ABG', body: `Hi {{name}},

Thank you for your interest in ABG and for taking the time to apply.

After careful consideration, we've decided not to move forward with your application at this time. This was a highly competitive cycle with many strong candidates.

We encourage you to apply again in future recruitment cycles. Thank you for your interest in ABG!

Best,
ABG Recruitment Team` },
];

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  stage: ApplicationStage;
  track: ApplicationTrack;
}

export default function CycleCommunicationsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, post } = useAdminApi();
  
  const [loading, setLoading] = useState(true);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  
  // Compose form
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [filterStage, setFilterStage] = useState<ApplicationStage | ''>('');
  const [filterTrack, setFilterTrack] = useState<ApplicationTrack | ''>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState<EmailRecipient | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load email logs
      // Note: We'd need an email logs API endpoint - for now just show empty
      // const logsData = await get<EmailLog[]>(`/api/admin/recruitment/email-logs?cycleId=${cycleId}`);
      // setEmailLogs(logsData);
      
      // Load applications as potential recipients
      // The API returns: { _id, name, email, track, stage, ... }
      const apps = await get<any[]>(`/api/admin/recruitment/applications?cycleId=${cycleId}`);
      console.log('Loaded applications for emails:', apps.length);
      
      const recipientsList: EmailRecipient[] = apps
        .filter(app => app.email && app.email !== 'unknown@umich.edu')
        .map(app => ({
          id: app._id,
          name: app.name || 'Unknown',
          email: app.email,
          stage: app.stage,
          track: app.track,
        }));
      
      console.log('Valid recipients:', recipientsList.length);
      setRecipients(recipientsList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadData();
    }
  }, [cycleId]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (filterStage && r.stage !== filterStage) return false;
    if (filterTrack && r.track !== filterTrack) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
  };

  const handleToggleRecipient = (id: string) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };

  const renderPreview = (text: string, recipient: EmailRecipient): string => {
    return text
      .replace(/\{\{name\}\}/g, recipient.name)
      .replace(/\{\{email\}\}/g, recipient.email)
      .replace(/\{\{track\}\}/g, recipient.track)
      .replace(/\{\{stage\}\}/g, recipient.stage);
  };

  const handleSendEmails = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Please fill in subject and body');
      return;
    }
    
    if (!confirm(`Send email to ${selectedRecipients.length} recipient(s)?`)) return;
    
    try {
      setSending(true);
      
      // Send emails
      await post('/api/admin/recruitment/send-emails', {
        cycleId,
        recipientIds: selectedRecipients,
        subject: emailSubject,
        body: emailBody,
        templateId: selectedTemplate,
      }, {
        successMessage: `Email sent to ${selectedRecipients.length} recipient(s)`,
      });
      
      // Reset form
      setShowCompose(false);
      setSelectedRecipients([]);
      setEmailSubject('');
      setEmailBody('');
      setSelectedTemplate('custom');
      loadData();
    } catch (error) {
      console.error('Error sending emails:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading communications..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send emails to applicants
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <EnvelopeIcon className="w-5 h-5" />
          Compose Email
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{recipients.length}</p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{emailLogs.filter(e => e.status === 'sent').length}</p>
              <p className="text-sm text-gray-500">Emails Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{emailLogs.filter(e => e.status === 'pending').length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{emailLogs.filter(e => e.status === 'failed').length}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Email Activity - Placeholder */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Recent Email Activity</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <EnvelopeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No emails sent yet for this cycle</p>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Compose Email</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Recipients */}
              <div className="w-80 border-r flex flex-col">
                <div className="p-4 space-y-3 border-b">
                  <div className="flex gap-2">
                    <select
                      value={filterStage}
                      onChange={(e) => setFilterStage(e.target.value as ApplicationStage | '')}
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="">All Stages</option>
                      {STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>{stage.label}</option>
                      ))}
                    </select>
                    <select
                      value={filterTrack}
                      onChange={(e) => setFilterTrack(e.target.value as ApplicationTrack | '')}
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    >
                      {TRACK_FILTER_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedRecipients.length === filteredRecipients.length
                      ? 'Deselect All'
                      : `Select All (${filteredRecipients.length})`}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y">
                  {filteredRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => handleToggleRecipient(recipient.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{recipient.name}</p>
                        <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
                  {selectedRecipients.length} selected
                </div>
              </div>

              {/* Right: Email Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 space-y-4 overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {EMAIL_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={10}
                      placeholder="Email body... Use {{name}} for personalization"
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Available variables: {'{{name}}, {{email}}, {{track}}, {{stage}}'}
                    </p>
                  </div>

                  {/* Preview */}
                  {selectedRecipients.length > 0 && emailBody && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm">
                        <p className="font-medium text-gray-900 mb-2">
                          To: {recipients.find(r => r.id === selectedRecipients[0])?.name}
                        </p>
                        <p className="font-medium text-gray-900 mb-2">
                          Subject: {emailSubject}
                        </p>
                        <hr className="my-2" />
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {renderPreview(
                            emailBody,
                            recipients.find(r => r.id === selectedRecipients[0])!
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmails}
                    disabled={sending || selectedRecipients.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    {sending ? 'Sending...' : `Send to ${selectedRecipients.length} recipient(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
