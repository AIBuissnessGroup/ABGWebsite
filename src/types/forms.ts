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
    notificationEmail?: string;
    notifyOnSubmission?: boolean;
    sendReceiptToSubmitter?: boolean;
  };
};
