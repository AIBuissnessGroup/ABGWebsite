export type InternshipPhase = {
  title: string;
  description: string;
  duration: string;
  details: string[];
};

export type InternshipTimelineEntry = {
  phase: string;
  timing: string;
};

export type InternshipBenefitGroups = {
  students: string[];
  companies: string[];
  university: string[];
};

export type InternshipPageContent = {
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionText: string;
  phases: InternshipPhase[];
  timelineTitle: string;
  timelineSubtitle: string;
  timeline: InternshipTimelineEntry[];
  benefitsTitle: string;
  benefits: InternshipBenefitGroups;
  opportunitiesTitle: string;
  opportunitiesSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  published: boolean;
  lastUpdated: string;
};

export type InternshipCompany = {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  location?: string;
  contactEmail?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type InternshipProject = {
  id: string;
  title: string;
  description: string;
  companyId: string;
  linkedForm?: string;
  status: string;
  duration?: string;
  location?: string;
  type?: string;
  skills?: string;
  requirements?: string;
  applicationDeadline?: string;
  applicationsCount: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

let internshipsPageContent: InternshipPageContent = {
  badgeText: 'AI Business Group Applied AI Internship Program',
  heroTitle: 'Launch Your AI Career',
  heroSubtitle:
    'High-impact, real-world AI internship opportunities through Michigan Ross/COE recruitment pipelines and industry partnerships',
  missionTitle: 'Program Mission',
  missionText:
    'To provide high-impact, real-world AI internship opportunities to ABG students by partnering with Michigan Ross/COE recruitment pipelines and company demand for applied AI talent.',
  phases: [
    {
      title: 'Internal Project Phase',
      description: 'Students complete a vetted project under AI Business Group mentorship.',
      duration: '8–10 weeks',
      details: [
        'Eligibility: Ross/COE/LSA students involved in AI Business Group projects',
        'High-quality, original, and impactful AI work with business relevance',
        'Project report, working model/prototype, and executive summary/pitch deck',
      ],
    },
    {
      title: 'Internship Matching Phase',
      description: 'Top performers are referred to company partners for internship opportunities.',
      duration: '2-3 weeks',
      details: [
        'Past projects evaluation and project feedback forms',
        'PM direct input and club participation assessment',
        'Company intake with detailed project descriptions',
        'Interview process and final selection',
      ],
    },
    {
      title: 'Internal Support Phase',
      description: 'Technical preparation and mentorship before internships begin.',
      duration: '2-4 weeks',
      details: [
        'Technical prep with ABG mentor/eBoard/VP Education',
        'Skill development and project preparation',
        'Industry readiness and professional development',
      ],
    },
  ],
  timelineTitle: 'Program Timeline',
  timelineSubtitle: 'Typical UMich semester spans ~15 weeks with 1 finals week',
  timeline: [
    { phase: 'New Member Recruitment', timing: 'Weeks 1-4' },
    { phase: 'Project Groups Decided', timing: 'Week 5' },
    { phase: 'Project Work Period', timing: 'Weeks 6–14' },
    { phase: 'Project Review + Selection', timing: 'Weeks 13–14' },
    { phase: 'Internship Matching Outreach', timing: 'Weeks 15–16' },
    { phase: 'Internship Period', timing: 'Summer or following term' },
    { phase: 'Feedback', timing: 'Post-internship' },
  ],
  benefitsTitle: 'Benefits for All Stakeholders',
  benefits: {
    students: [
      'Get practical AI experience',
      'Build resumes with real company exposure',
      'Access Ross/COE recruiting pipelines',
      'Work on cutting-edge AI projects',
      'Receive mentorship from industry professionals',
    ],
    companies: [
      'Access to pre-vetted, passionate AI students',
      'Reduced risk via project-based screening',
      'Collaboration with a premier university program',
      'Early access to top AI talent',
      'Flexible internship structures',
    ],
    university: [
      'Enhanced student career outcomes',
      'Strengthened industry ties in AI',
      'Encourages interdisciplinary, entrepreneurial student work',
      'Bridges academic learning with industry application',
    ],
  },
  opportunitiesTitle: 'Current Opportunities',
  opportunitiesSubtitle: 'Explore available internship positions with our partner companies',
  ctaTitle: 'Ready to Join the Program?',
  ctaSubtitle: 'Get involved with AI Business Group projects to qualify for our internship program.',
  published: true,
  lastUpdated: new Date().toISOString(),
};

let internshipCompanies: InternshipCompany[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    description:
      'Leading AI technology company specializing in natural language processing and machine learning solutions.',
    logoUrl: '',
    website: 'https://techcorp.com',
    industry: 'Technology',
    location: 'San Francisco, CA',
    contactEmail: 'internships@techcorp.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'StartupAI',
    description: 'Fast-growing startup building cutting-edge AI applications for business automation.',
    logoUrl: '',
    website: 'https://startupai.com',
    industry: 'Technology',
    location: 'Remote',
    contactEmail: 'careers@startupai.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

let internshipProjects: InternshipProject[] = [
  {
    id: '1',
    title: 'AI Research Intern',
    description:
      'Work on cutting-edge NLP projects and machine learning model development. You will collaborate with our research team to develop innovative AI solutions.',
    companyId: '1',
    linkedForm: '1735847762089',
    status: 'OPEN',
    duration: '12 weeks',
    location: 'Remote',
    type: 'Research',
    skills: '["Python", "PyTorch", "NLP", "Machine Learning"]',
    requirements: 'Strong programming skills, machine learning background, and enthusiasm for AI research.',
    applicationDeadline: '2025-03-01',
    applicationsCount: 5,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'ML Engineering Intern',
    description:
      'Build production ML pipelines and deploy AI models at scale. Work with our engineering team to bring AI solutions to production.',
    companyId: '2',
    linkedForm: '',
    status: 'FILLED',
    duration: '10 weeks',
    location: 'San Francisco, CA',
    type: 'Engineering',
    skills: '["Python", "Docker", "AWS", "MLOps", "Kubernetes"]',
    requirements: 'Experience with cloud platforms, containerization, and ML deployment.',
    applicationDeadline: '2025-02-15',
    applicationsCount: 12,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const internshipsStore = {
  getContent: () => internshipsPageContent,
  updateContent: (data: Partial<InternshipPageContent>) => {
    internshipsPageContent = {
      ...internshipsPageContent,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    return internshipsPageContent;
  },
  getCompanies: () => internshipCompanies,
  addCompany: (company: InternshipCompany) => {
    internshipCompanies.push(company);
    return company;
  },
  updateCompany: (id: string, data: Partial<InternshipCompany>) => {
    const index = internshipCompanies.findIndex((c) => c.id === id);
    if (index === -1) return null;
    internshipCompanies[index] = {
      ...internshipCompanies[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    return internshipCompanies[index];
  },
  deleteCompany: (id: string) => {
    const index = internshipCompanies.findIndex((c) => c.id === id);
    if (index === -1) return false;
    internshipCompanies.splice(index, 1);
    return true;
  },
  getProjects: () => internshipProjects,
  addProject: (project: InternshipProject) => {
    internshipProjects.push(project);
    return project;
  },
  updateProject: (id: string, data: Partial<InternshipProject>) => {
    const index = internshipProjects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    internshipProjects[index] = {
      ...internshipProjects[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    return internshipProjects[index];
  },
  deleteProject: (id: string) => {
    const index = internshipProjects.findIndex((p) => p.id === id);
    if (index === -1) return false;
    internshipProjects.splice(index, 1);
    return true;
  },
};
