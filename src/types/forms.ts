export type SlackTargetOption = {
  id: string;
  name?: string;
  type: 'channel' | 'user';
};

export type FormNotificationConfig = {
  slack?: {
    webhookUrl?: string | null;
    targets?: SlackTargetOption[];
  };
  email?: {
    notificationEmails?: string[]; // Changed to array to support multiple emails
    notificationEmail?: string; // Keep for backward compatibility
    notifyOnSubmission?: boolean;
    sendReceiptToSubmitter?: boolean;
  };
};
