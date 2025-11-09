export type MemberLevelsContent = {
  heroTitle: string;
  generalTitle: string;
  generalBullets: string[];
  projectTitle: string;
  projectBullets: string[];
  footerLines: string[];
  lastUpdated: string;
};

export type RecruitmentTimelineContent = {
  heroTitle: string;
  openRoundTitle: string;
  openItems: string[];
  closedRoundTitle: string;
  closedItems: string[];
  lastUpdated: string;
};

let memberLevelsContent: MemberLevelsContent = {
  heroTitle: 'RECRUITMENT – MEMBER LEVELS',
  generalTitle: 'General Member:',
  generalBullets: [
    'Attend general meetings, open speaker events, and social events.',
    'Learning: Gain valuable AI knowledge at your own pace.',
    'Commitment: Simply pay the membership dues to stay involved with no additional expectations.',
  ],
  projectTitle: 'Project Team Member:',
  projectBullets: [
    'Works and communicates with a real client and deliverables',
    '1:1 networking with industry profs. that we bring in',
    'Private Social events',
    'Our summer internship program',
    'Tailored small-group education sessions & feedback',
  ],
  footerLines: [
    'Commitment: Pay membership dues and contribute actively to a project team, gaining greater returns on your involvement.',
    'By becoming more involved, you’ll gain exclusive opportunities and experiences that will set you apart, providing you with practical skills, mentorship, and industry connections.',
  ],
  lastUpdated: new Date().toISOString(),
};

let recruitmentTimelineContent: RecruitmentTimelineContent = {
  heroTitle: 'RECRUITMENT TIMELINE F25',
  openRoundTitle: 'OPEN ROUND',
  openItems: [
    'FestiFall (Either August 25th or August 27th) & Meet the Clubs (September 2nd & 3rd)',
    'DATE TBD: Mass Meeting',
    'September 17th (Wednesday): Meet the Members, speed dating (7-8pm, 1 hour)',
    'September 18th-19th (Thursday-Friday): Coffee Chats (4-6pm, 20 mins)',
    'September 22nd (Monday): Case/Technical “workshop” (7-8pm, 1 hour)',
    'September 24th (Wednesday): APPLICATION DEADLINE 11:59pm',
  ],
  closedRoundTitle: 'CLOSED ROUND',
  closedItems: [
    'Interview: September 26th (Friday)',
    'Round 2 Interview: September 28th (Sunday) + DECISIONS RELEASED + INITIATION SOCIAL!!!',
  ],
  lastUpdated: new Date().toISOString(),
};

export const recruitmentContentStore = {
  getMemberLevels: () => memberLevelsContent,
  updateMemberLevels: (data: Partial<MemberLevelsContent>) => {
    memberLevelsContent = {
      ...memberLevelsContent,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    return memberLevelsContent;
  },
  getTimeline: () => recruitmentTimelineContent,
  updateTimeline: (data: Partial<RecruitmentTimelineContent>) => {
    recruitmentTimelineContent = {
      ...recruitmentTimelineContent,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    return recruitmentTimelineContent;
  },
};
