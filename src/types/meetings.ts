export type MeetingCategory = 'General Meeting' | 'Education Meeting' | 'Project Team' | 'Other';

export interface Meeting {
  id: string;
  name: string;
  date: string;
  category: MeetingCategory;
  code: string;
  isOpen: boolean;
  createdAt: string;
  createdBy: string;
  attendeeCount?: number;
}

export interface MeetingAttendee {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRoles?: string[];
  meetingName: string;
  meetingDate: string;
  meetingCategory: MeetingCategory;
  checkedInAt: string;
}

export interface UserAttendanceSummary {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  totalAttended: number;
  lastAttended?: {
    meetingName: string;
    meetingDate: string;
    meetingCategory: MeetingCategory;
    checkedInAt: string;
  };
}
