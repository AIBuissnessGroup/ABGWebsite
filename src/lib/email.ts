import nodemailer from 'nodemailer';

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

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host) {
    console.warn('SMTP_HOST is not configured; email receipts will be skipped.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  cachedTransporter = transporter;
  return transporter;
}

export async function sendFormReceiptEmail(options: FormReceiptOptions) {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  const from = process.env.SMTP_FROM_EMAIL;
  if (!from) {
    console.warn('SMTP_FROM_EMAIL is not configured; skipping email receipt.');
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
