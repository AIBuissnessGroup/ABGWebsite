/**
 * Slack notification utilities
 * Send notifications to Slack when important events occur
 */

/**
 * Format file size in bytes to human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

interface SlackMessage {
  text?: string;
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
}

/**
 * Send a notification to Slack
 */
export async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured. Skipping notification.');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Slack notification:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Send a form submission notification to Slack
 */
export async function notifyFormSubmission(params: {
  formTitle: string;
  formSlug: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicationId?: string;
  responses?: Array<{
    questionTitle: string;
    value: any;
    questionId?: string;
  }>;
  submissionUrl?: string;
}): Promise<boolean> {
  const {
    formTitle,
    formSlug,
    applicantName,
    applicantEmail,
    applicantPhone,
    applicationId,
    responses = [],
    submissionUrl,
  } = params;

  const fields: SlackField[] = [
    {
      title: 'Name',
      value: applicantName,
      short: true,
    },
    {
      title: 'Email',
      value: applicantEmail,
      short: true,
    },
  ];

  if (applicantPhone) {
    fields.push({
      title: 'Phone',
      value: applicantPhone,
      short: true,
    });
  }

  // Track file attachments separately for special handling
  const fileAttachments: Array<{ fileName: string; fileUrl: string; questionTitle: string; fileSize?: number }> = [];

  // First, scan ALL responses to find files (not just preview ones)
  responses.forEach((response) => {
    if (typeof response.value === 'object' && response.value?.fileName && response.value?.fileData) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://abgumich.org';
      const fileUrl = `${baseUrl}/api/files/${applicationId}/${response.questionId}`;
      
      fileAttachments.push({
        fileName: response.value.fileName,
        fileUrl: fileUrl,
        questionTitle: response.questionTitle,
        fileSize: response.value.fileSize,
      });
    }
  });

  // Add first few responses as preview (limit to 5)
  const previewResponses = responses.slice(0, 5);
  previewResponses.forEach((response) => {
    let displayValue = response.value;
    
    // Format complex values
    if (typeof displayValue === 'object') {
      if (displayValue?.fileName && displayValue?.fileData) {
        // For file uploads, create a download link
        const baseUrl = process.env.NEXTAUTH_URL || 'https://abgumich.org';
        const fileUrl = `${baseUrl}/api/files/${applicationId}/${response.questionId}`;
        
        // Format file size if available
        const fileSize = displayValue.fileSize 
          ? ` (${formatFileSize(displayValue.fileSize)})` 
          : '';
        displayValue = `📎 <${fileUrl}|${displayValue.fileName}>${fileSize}`;
      } else if (Array.isArray(displayValue)) {
        displayValue = displayValue.join(', ');
      } else {
        displayValue = JSON.stringify(displayValue);
      }
    }

    // Truncate long values
    if (typeof displayValue === 'string' && displayValue.length > 100) {
      displayValue = displayValue.substring(0, 97) + '...';
    }

    fields.push({
      title: response.questionTitle,
      value: String(displayValue || '_No answer_'),
      short: false,
    });
  });

  if (responses.length > 5) {
    fields.push({
      title: 'Additional Responses',
      value: `_${responses.length - 5} more response(s)_`,
      short: false,
    });
  }

  // Add file summary if there are files
  if (fileAttachments.length > 0) {
    const fileList = fileAttachments
      .map(f => {
        const fileSize = f.fileSize ? ` (${formatFileSize(f.fileSize)})` : '';
        return `• <${f.fileUrl}|📥 Download ${f.fileName}>${fileSize}`;
      })
      .join('\n');
    
    fields.push({
      title: `📎 Attached Files (${fileAttachments.length})`,
      value: fileList,
      short: false,
    });
  }

  const message: SlackMessage = {
    text: `📝 New Form Submission: *${formTitle}*`,
    attachments: [
      {
        color: '#36a64f',
        fields,
        footer: submissionUrl ? `<${submissionUrl}|View Full Submission>` : `Form: ${formSlug}`,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
    username: 'ABG Forms',
    icon_emoji: ':clipboard:',
  };

  return sendSlackNotification(message);
}

/**
 * Send a generic notification to Slack
 */
export async function notifySlack(params: {
  title: string;
  message: string;
  color?: 'good' | 'warning' | 'danger' | string;
  fields?: SlackField[];
}): Promise<boolean> {
  const { title, message, color = 'good', fields = [] } = params;

  const slackMessage: SlackMessage = {
    text: title,
    attachments: [
      {
        color,
        text: message,
        fields,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  return sendSlackNotification(slackMessage);
}
