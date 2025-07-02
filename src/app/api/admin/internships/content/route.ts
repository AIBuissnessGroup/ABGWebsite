import { NextRequest, NextResponse } from 'next/server';

// Mock storage for internships page content
let internshipsPageContent = {
  badgeText: 'AI Business Group Applied AI Internship Program',
  heroTitle: 'Launch Your AI Career',
  heroSubtitle: 'High-impact, real-world AI internship opportunities through Michigan Ross/COE recruitment pipelines and industry partnerships',
  missionTitle: 'Program Mission',
  missionText: 'To provide high-impact, real-world AI internship opportunities to ABG students by partnering with Michigan Ross/COE recruitment pipelines and company demand for applied AI talent.',
  phases: [
    {
      title: "Internal Project Phase",
      description: "Students complete a vetted project under AI Business Group mentorship.",
      duration: "8–10 weeks",
      details: [
        "Eligibility: Ross/COE/LSA students involved in AI Business Group projects",
        "High-quality, original, and impactful AI work with business relevance",
        "Project report, working model/prototype, and executive summary/pitch deck"
      ]
    },
    {
      title: "Internship Matching Phase", 
      description: "Top performers are referred to company partners for internship opportunities.",
      duration: "2-3 weeks",
      details: [
        "Past projects evaluation and project feedback forms",
        "PM direct input and club participation assessment",
        "Company intake with detailed project descriptions",
        "Interview process and final selection"
      ]
    },
    {
      title: "Internal Support Phase",
      description: "Technical preparation and mentorship before internships begin.",
      duration: "2-4 weeks",
      details: [
        "Technical prep with ABG mentor/eBoard/VP Education",
        "Skill development and project preparation",
        "Industry readiness and professional development"
      ]
    }
  ],
  timelineTitle: 'Program Timeline',
  timelineSubtitle: 'Typical UMich semester spans ~15 weeks with 1 finals week',
  timeline: [
    { phase: "New Member Recruitment", timing: "Weeks 1-4" },
    { phase: "Project Groups Decided", timing: "Week 5" },
    { phase: "Project Work Period", timing: "Weeks 6–14" },
    { phase: "Project Review + Selection", timing: "Weeks 13–14" },
    { phase: "Internship Matching Outreach", timing: "Weeks 15–16" },
    { phase: "Internship Period", timing: "Summer or following term" },
    { phase: "Feedback", timing: "Post-internship" }
  ],
  benefitsTitle: 'Benefits for All Stakeholders',
  benefits: {
    students: [
      "Get practical AI experience",
      "Build resumes with real company exposure", 
      "Access Ross/COE recruiting pipelines",
      "Work on cutting-edge AI projects",
      "Receive mentorship from industry professionals"
    ],
    companies: [
      "Access to pre-vetted, passionate AI students",
      "Reduced risk via project-based screening",
      "Collaboration with a premier university program",
      "Early access to top AI talent",
      "Flexible internship structures"
    ],
    university: [
      "Enhanced student career outcomes",
      "Strengthened industry ties in AI",
      "Encourages interdisciplinary, entrepreneurial student work",
      "Bridges academic learning with industry application"
    ]
  },
  opportunitiesTitle: 'Current Opportunities',
  opportunitiesSubtitle: 'Explore available internship positions with our partner companies',
  ctaTitle: 'Ready to Join the Program?',
  ctaSubtitle: 'Get involved with AI Business Group projects to qualify for our internship program.',
  published: true,
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  try {
    return NextResponse.json(internshipsPageContent);
  } catch (error) {
    console.error('Error fetching internships page content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    internshipsPageContent = {
      ...internshipsPageContent,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(internshipsPageContent);
  } catch (error) {
    console.error('Error updating internships page content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
} 