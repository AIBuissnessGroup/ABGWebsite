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

  const responseLines = responses
    .map((response) => `• ${response.title}: ${response.value}`)
    .join('\n');

  const textBody = [
    `Hello${applicantName ? ` ${applicantName}` : ''},`,
    '',
    `Thank you for submitting the “${formTitle}” form.`,
    `Submission ID: ${submissionId}`,
    `Submitted on: ${formattedDate}`,
    '',
    responseLines ? 'Summary of your responses:' : undefined,
    responseLines || undefined,
    summaryUrl ? `\nYou can review your submission here: ${summaryUrl}` : undefined,
    '',
    'If you did not submit this form or believe this was sent in error, please reach out to the ABG team.',
    '',
    'Best,',
    'ABG Team',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Submission receipt: ${formTitle}`,
      text: textBody,
    });
    return true;
  } catch (error) {
    console.error('Failed to send form receipt email:', error);
    return false;
  }
}
