import type { FormNotificationConfig, SlackTargetOption } from '@/types/forms';

/**
 * Slack notification utilities
 * Send notifications to Slack when important events occur
 */

type SlackField = {
  title: string;
  value: string;
  short?: boolean;
};

type SlackAttachment = {
  color?: string;
  title?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
};

type SlackMessage = {
  text?: string;
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
};

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

export async function sendSlackNotification(message: SlackMessage, overrideWebhook?: string | null): Promise<boolean> {
  const webhookUrl = overrideWebhook || process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured. Skipping webhook notification.');
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
      console.error('Failed to send Slack webhook notification:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack webhook notification:', error);
    return false;
  }
}

async function openDirectConversation(userId: string): Promise<string | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('SLACK_BOT_TOKEN not configured; cannot open direct conversation.');
    return null;
  }

  try {
    const response = await fetch('https://slack.com/api/conversations.open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ users: userId }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Failed to open Slack conversation', data.error);
      return null;
    }

    return data.channel?.id ?? null;
  } catch (error) {
    console.error('Error opening Slack conversation', error);
    return null;
  }
}

async function postToSlackTarget(target: SlackTargetOption, text: string, blocks: any[]): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('SLACK_BOT_TOKEN not configured; skipping targeted Slack notification.');
    return false;
  }

  let channelId = target.type === 'channel' ? target.id : null;

  if (target.type === 'user') {
    channelId = await openDirectConversation(target.id);
  }

  if (!channelId) {
    return false;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text,
        blocks,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Failed to post Slack notification', data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error posting Slack notification', error);
    return false;
  }
}

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
  slackConfig?: FormNotificationConfig['slack'] | null;
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
    slackConfig,
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

  const fileAttachments: Array<{ fileName: string; fileUrl: string; questionTitle: string; fileSize?: number }> = [];

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

  const previewResponses = responses.slice(0, 5);
  previewResponses.forEach((response) => {
    let displayValue = response.value;

    if (typeof displayValue === 'object') {
      if (displayValue?.fileName && displayValue?.fileData) {
        const baseUrl = process.env.NEXTAUTH_URL || 'https://abgumich.org';
        const fileUrl = `${baseUrl}/api/files/${applicationId}/${response.questionId}`;
        const fileSize = displayValue.fileSize ? ` (${formatFileSize(displayValue.fileSize)})` : '';
        displayValue = `📎 <${fileUrl}|${displayValue.fileName}>${fileSize}`;
      } else if (Array.isArray(displayValue)) {
        displayValue = displayValue.join(', ');
      } else {
        displayValue = JSON.stringify(displayValue);
      }
    }

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

  if (fileAttachments.length > 0) {
    const fileList = fileAttachments
      .map((f) => {
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

  const slackMessage: SlackMessage = {
    text: `New submission for ${formTitle}`,
    attachments: [
      {
        color: '#6366F1',
        title: `New form submission: ${formTitle}`,
        text: `A new submission was received for the form *${formTitle}* (${formSlug}).`,
        fields,
        footer: 'ABG Forms System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  if (submissionUrl) {
    slackMessage.attachments?.[0]?.fields?.push({
      title: 'View Submission',
      value: `<${submissionUrl}|Open in admin console>`,
      short: false,
    });
  }

  const messageText = `📥 New submission for *${formTitle}*\n• Name: ${applicantName}\n• Email: ${applicantEmail}${
    applicantPhone ? `\n• Phone: ${applicantPhone}` : ''
  }`;

  const messageBlocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📥 *New submission* for *${formTitle}*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name*\n${applicantName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Email*\n${applicantEmail}`,
        },
        applicantPhone
          ? {
              type: 'mrkdwn',
              text: `*Phone*\n${applicantPhone}`,
            }
          : undefined,
      ].filter(Boolean),
    },
  ];

  // Add responses to the message blocks (limit to first 10 for readability)
  if (responses.length > 0) {
    const responsesToShow = responses.slice(0, 10);
    const responseFields: any[] = [];
    
    responsesToShow.forEach((response) => {
      let displayValue = response.value;

      if (typeof displayValue === 'object') {
        if (displayValue?.fileName && displayValue?.fileData) {
          const baseUrl = process.env.NEXTAUTH_URL || 'https://abgumich.org';
          const fileUrl = `${baseUrl}/api/files/${applicationId}/${response.questionId}`;
          const fileSize = displayValue.fileSize ? ` (${formatFileSize(displayValue.fileSize)})` : '';
          displayValue = `📎 <${fileUrl}|${displayValue.fileName}>${fileSize}`;
        } else if (Array.isArray(displayValue)) {
          displayValue = displayValue.join(', ');
        } else {
          displayValue = JSON.stringify(displayValue);
        }
      }

      if (typeof displayValue === 'string' && displayValue.length > 200) {
        displayValue = displayValue.substring(0, 197) + '...';
      }

      responseFields.push({
        type: 'mrkdwn',
        text: `*${response.questionTitle}*\n${String(displayValue || '_No answer_')}`,
      });
    });

    // Add responses in batches of 10 (Slack limit)
    for (let i = 0; i < responseFields.length; i += 10) {
      messageBlocks.push({
        type: 'section',
        fields: responseFields.slice(i, i + 10),
      });
    }

    if (responses.length > 10) {
      messageBlocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_...and ${responses.length - 10} more response(s)_`,
          },
        ],
      });
    }
  }

  if (submissionUrl) {
    messageBlocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Open submission',
          },
          url: submissionUrl,
        },
      ],
    });
  }

  const results: boolean[] = [];

  if (!slackConfig || slackConfig.webhookUrl !== null) {
    results.push(await sendSlackNotification(slackMessage, slackConfig?.webhookUrl));
  }

  if (slackConfig?.targets?.length) {
    await Promise.all(
      slackConfig.targets.map(async (target) => {
        const ok = await postToSlackTarget(target, messageText, messageBlocks);
        results.push(ok);
      })
    );
  }

  return results.some(Boolean);
}

export async function notifySlack(params: {
  title: string;
  message: string;
  color?: 'good' | 'warning' | 'danger' | string;
  fields?: SlackField[];
  slackConfig?: FormNotificationConfig['slack'] | null;
}): Promise<boolean> {
  const { title, message, color = 'good', fields = [], slackConfig } = params;

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

  const messageBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*\n${message}`,
      },
    },
  ];

  const results: boolean[] = [];

  if (!slackConfig || slackConfig.webhookUrl !== null) {
    results.push(await sendSlackNotification(slackMessage, slackConfig?.webhookUrl));
  }

  if (slackConfig?.targets?.length) {
    await Promise.all(
      slackConfig.targets.map(async (target) => {
        const ok = await postToSlackTarget(target, message, messageBlocks);
        results.push(ok);
      })
    );
  }

  return results.some(Boolean);
}
