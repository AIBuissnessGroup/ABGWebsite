import nodemailer from 'nodemailer';
import { google } from 'googleapis';

type ReceiptAttachment = {
  title: string;
  value: string;
};

export interface FormReceiptOptions {
  to: string;
  formTitle: string;
  submissionId: string;
  submissionDate: Date;
  applicantName?: string;
  summaryUrl?: string;
  responses?: ReceiptAttachment[];
}

let cachedGmailClient: any | null = null;
let cachedDriveClient: any | null = null;

async function getGmailClient() {
  if (cachedGmailClient) {
    return cachedGmailClient;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Gmail API credentials not configured');
    console.error('   Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    cachedGmailClient = gmail;
    console.log('✅ Gmail API client initialized');
    return gmail;
  } catch (error: any) {
    console.error('❌ Error creating Gmail API client:', error.message);
    return null;
  }
}

async function getDriveClient() {
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Google Drive API credentials not configured');
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    cachedDriveClient = drive;
    console.log('✅ Google Drive API client initialized');
    return drive;
  } catch (error: any) {
    console.error('❌ Error creating Google Drive API client:', error.message);
    return null;
  }
}

/**
 * Upload a file to Google Drive and return a shareable link
 */
export async function uploadToDrive(
  filename: string,
  content: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ fileId: string; webViewLink: string; webContentLink: string } | null> {
  try {
    const drive = await getDriveClient();
    if (!drive) {
      throw new Error('Drive client not available');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(content, 'base64');

    // Upload file
    const fileMetadata = {
      name: filename,
    };

    const media = {
      mimeType,
      body: require('stream').Readable.from(buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = file.data.id;
    
    // Make the file publicly accessible (anyone with link can view)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`✅ Uploaded ${filename} to Google Drive: ${file.data.webViewLink}`);

    return {
      fileId: fileId!,
      webViewLink: file.data.webViewLink!,
      webContentLink: file.data.webContentLink!,
    };
  } catch (error: any) {
    console.error(`❌ Error uploading ${filename} to Google Drive:`, error.message);
    return null;
  }
}


// Keep old transporter for backwards compatibility
let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Gmail API OAuth2 credentials
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const userEmail = process.env.GMAIL_USER_EMAIL || process.env.SMTP_FROM_EMAIL;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Gmail API credentials not configured; email receipts will be skipped.');
    console.warn('Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
    return null;
  }

  try {
    console.log('🔐 Gmail API Configuration:');
    console.log('  Client ID:', clientId?.substring(0, 20) + '...');
    console.log('  Refresh Token:', refreshToken?.substring(0, 20) + '...');
    console.log('  User Email:', userEmail);

    // Create OAuth2 client (redirect URI not needed for refresh token flow)
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    console.log('🔑 Attempting to get Gmail API access token...');

    // Get access token - this will automatically refresh if expired
    const accessToken = await oauth2Client.getAccessToken();

    console.log('✅ Access token obtained:', accessToken.token?.substring(0, 30) + '...');

    if (!accessToken.token) {
      console.error('❌ Failed to obtain Gmail API access token');
      return null;
    }

    // Create transporter with Gmail API
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userEmail,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: accessToken.token,
      },
    } as any);

    cachedTransporter = transporter;
    return transporter;
  } catch (error: any) {
    console.error('❌ Error creating Gmail API transporter:', error.message);
    if (error.response?.data) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    return null;
  }
}

export async function sendFormReceiptEmail(options: FormReceiptOptions) {
  const transporter = await getTransporter();
  if (!transporter) {
    return false;
  }

  const from = process.env.GMAIL_USER_EMAIL || process.env.SMTP_FROM_EMAIL;
  if (!from) {
    console.warn('GMAIL_USER_EMAIL or SMTP_FROM_EMAIL is not configured; skipping email receipt.');
    return false;
  }

  const {
    to,
    formTitle,
    submissionId,
    submissionDate,
    applicantName,
    summaryUrl,
    responses = [],
  } = options;

  const formattedDate = submissionDate.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'https://abgumich.org';
  // For local testing, you can temporarily use a public image URL
  // const signatureImageUrl = 'https://i.imgur.com/YOUR_IMAGE.png';
  const signatureImageUrl = `${baseUrl}/abg-email-signature.png`;

  // Build response items for HTML
  const responseItems = responses
    .map((response) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #1f2937;">${response.title}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
          ${response.value}
        </td>
      </tr>
    `)
    .join('');

  // Plain text version (fallback)
  const textBody = [
    `Hello${applicantName ? ` ${applicantName}` : ''},`,
    '',
    `This is an automated confirmation that your "${formTitle}" form has been successfully submitted.`,
    '',
    `Submission ID: ${submissionId}`,
    `Submitted on: ${formattedDate}`,
    '',
    responses.length ? 'SUMMARY OF YOUR RESPONSES:' : '',
    responses.length ? '─────────────────────────────────────────' : '',
    ...responses.map((r) => `${r.title}\n  → ${r.value}`),
    responses.length ? '─────────────────────────────────────────' : '',
    '',
    summaryUrl ? `View your submission online: ${summaryUrl}` : '',
    '',
    '──────────────────────────────────────────────────────────────',
    'This is an automated message. If you have any questions, concerns,',
    'or believe you made a mistake in your submission, please reply to',
    'this email and our team will assist you.',
    '──────────────────────────────────────────────────────────────',
    '',
    'AI Business Group',
    'Michigan Ross | Michigan Engineering',
  ]
    .filter(Boolean)
    .join('\n');

  // HTML version (rich formatting)
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center; background-color: #00274c; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    Submission Confirmation
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">
                    ${formTitle}
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  
                  <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
                    Hello${applicantName ? ` <strong>${applicantName}</strong>` : ''},
                  </p>

                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    This is an automated confirmation that your <strong>"${formTitle}"</strong> form has been successfully submitted.
                  </p>

                  <!-- Submission Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                          Submission Details
                        </p>
                        <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px;">
                          <strong>ID:</strong> ${submissionId}
                        </p>
                        <p style="margin: 0; color: #1f2937; font-size: 14px;">
                          <strong>Submitted:</strong> ${formattedDate}
                        </p>
                      </td>
                    </tr>
                  </table>

                  ${responses.length ? `
                  <!-- Responses Table -->
                  <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                    Summary of Your Responses
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 24px;">
                    ${responseItems}
                  </table>
                  ` : ''}

                  ${summaryUrl ? `
                  <!-- View Submission Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    <tr>
                      <td align="center">
                        <a href="${summaryUrl}" style="display: inline-block; padding: 12px 32px; background-color: #00274c; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">
                          View Your Submission Online
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Automated Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 24px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                          <strong>📌 This is an automated message.</strong><br>
                          If you have any questions, concerns, or believe you made a mistake in your submission, please reply to this email and our team will assist you promptly.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer with Signature Image -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                  <img src="${signatureImageUrl}" alt="AI Business Group" style="max-width: 100%; height: auto; margin-bottom: 16px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} AI Business Group | University of Michigan
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Get optional reply-to address (e.g., MCommunity email)
  const replyTo = process.env.SMTP_REPLY_TO_EMAIL || from;

  // Format "from" with a friendly name
  const fromName = 'ABG Notifications';
  const fromAddress = `"${fromName}" <${from}>`;

  try {
    console.log('📧 Attempting to send email receipt...');
    console.log('   From:', fromAddress);
    console.log('   To:', to);
    console.log('   Reply-To:', replyTo);
    console.log('   Subject:', `Submission receipt: ${formTitle}`);
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo, // Replies will go here instead of the from address
      subject: `Submission receipt: ${formTitle}`,
      text: textBody,
      html: htmlBody,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send form receipt email:', error);
    return false;
  }
}

/**
 * Send a custom email with HTML content
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string[];
  attachments?: Array<{ filename: string; content: string; encoding: string }>;
}): Promise<boolean> {
  console.log('🔍 sendEmail called for:', options.to);
  
  const gmail = await getGmailClient();
  if (!gmail) {
    console.error('❌ Gmail API client not available');
    return false;
  }

  const from = process.env.GMAIL_USER_EMAIL || process.env.SMTP_FROM_EMAIL;
  if (!from) {
    console.error('❌ No sender email configured');
    return false;
  }

  try {
    // Separate small and large attachments (25MB limit for Gmail)
    const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB in bytes
    const smallAttachments: typeof options.attachments = [];
    const largeAttachments: Array<{ filename: string; content: string; size: number }> = [];
    const driveLinks: Array<{ filename: string; link: string }> = [];

    if (options.attachments && options.attachments.length > 0) {
      for (const attachment of options.attachments) {
        // Calculate actual file size from base64
        const sizeInBytes = (attachment.content.length * 3) / 4;
        
        if (sizeInBytes > MAX_ATTACHMENT_SIZE) {
          console.log(`📤 ${attachment.filename} is too large (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB), uploading to Google Drive...`);
          largeAttachments.push({
            filename: attachment.filename,
            content: attachment.content,
            size: sizeInBytes
          });
        } else {
          smallAttachments.push(attachment);
        }
      }

      // Upload large files to Drive
      for (const largeFile of largeAttachments) {
        const mimeType = getMimeTypeFromFilename(largeFile.filename);
        const driveResult = await uploadToDrive(largeFile.filename, largeFile.content, mimeType);
        
        if (driveResult) {
          driveLinks.push({
            filename: largeFile.filename,
            link: driveResult.webViewLink
          });
        } else {
          console.error(`❌ Failed to upload ${largeFile.filename} to Drive`);
        }
      }
    }

    // Add Drive links section to HTML if there are large files
    let modifiedHtml = options.html;
    if (driveLinks.length > 0) {
      const driveLinksHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #2563eb; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📎 Large Files (Google Drive)</h3>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">The following files were uploaded to Google Drive due to size:</p>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${driveLinks.map(file => `
              <li style="margin: 5px 0;">
                <a href="${file.link}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${file.filename}</a>
                <span style="color: #6b7280; font-size: 13px;"> (Click to view/download)</span>
              </li>
            `).join('')}
          </ul>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">These files are accessible to anyone with the link.</p>
        </div>
      `;
      
      // Insert before closing body tag, or append if no body tag
      if (modifiedHtml.includes('</body>')) {
        modifiedHtml = modifiedHtml.replace('</body>', driveLinksHtml + '</body>');
      } else {
        modifiedHtml += driveLinksHtml;
      }
    }

    console.log(`📧 Sending email via Gmail API`);
    console.log(`   To: ${options.to}`);
    if (options.bcc) {
      console.log(`   BCC: ${options.bcc.length} recipients`);
    }
    console.log(`   Subject: ${options.subject}`);
    console.log(`   From: ${from}`);
    if (smallAttachments.length > 0) {
      console.log(`   Attachments: ${smallAttachments.length} files`);
    }
    if (driveLinks.length > 0) {
      console.log(`   Drive Links: ${driveLinks.length} files`);
    }

    // Build email message in RFC 2822 format
    const messageParts = [
      `From: "AI Business Group" <${from}>`,
      `To: ${options.to}`,
      options.bcc && options.bcc.length > 0 ? `Bcc: ${options.bcc.join(', ')}` : '',
      `Subject: ${options.subject}`,
      `MIME-Version: 1.0`,
      options.replyTo ? `Reply-To: ${options.replyTo}` : '',
    ].filter(Boolean);

    // Determine if we have attachments
    const hasAttachments = smallAttachments.length > 0;
    const boundary = hasAttachments ? 'boundary-with-attachments' : 'boundary123';

    if (hasAttachments) {
      messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    } else {
      messageParts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    }

    messageParts.push('');

    // Add text and HTML content
    messageParts.push(`--${boundary}`);
    messageParts.push('Content-Type: text/plain; charset=UTF-8');
    messageParts.push('');
    messageParts.push(options.text || modifiedHtml.replace(/<[^>]*>/g, ''));
    messageParts.push('');
    messageParts.push(`--${boundary}`);
    messageParts.push('Content-Type: text/html; charset=UTF-8');
    messageParts.push('');
    messageParts.push(modifiedHtml);
    messageParts.push('');

    // Add attachments if any
    if (hasAttachments) {
      for (const attachment of smallAttachments) {
        messageParts.push(`--${boundary}`);
        messageParts.push(`Content-Type: application/octet-stream; name="${attachment.filename}"`);
        messageParts.push('Content-Transfer-Encoding: base64');
        messageParts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        messageParts.push('');
        messageParts.push(attachment.content);
        messageParts.push('');
      }
    }

    messageParts.push(`--${boundary}--`);

    const messageString = messageParts.join('\r\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(messageString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('✅ Email sent successfully via Gmail API!');
    console.log('   Message ID:', response.data.id);
    
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message);
    if (error.response?.data) {
      console.error('   API Error:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Helper function to determine MIME type from filename
function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

