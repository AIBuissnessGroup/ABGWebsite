import { PrismaClient, ProjectStatus, EventType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a sample user first
  const user = await prisma.user.upsert({
    where: { email: 'skywlkr@umich.edu' },
    update: {},
    create: {
      email: 'skywlkr@umich.edu',
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  // Sample Team Members
  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'President',
      year: 'Senior',
      major: 'Computer Science',
      bio: 'Leading AI Business Group with a passion for machine learning applications in enterprise solutions.',
      email: 'sarahchen@umich.edu',
      linkedIn: 'https://linkedin.com/in/sarahchen',
      featured: true
    },
    {
      name: 'Marcus Johnson',
      role: 'VP of Projects',
      year: 'Junior',
      major: 'Business Administration',
      bio: 'Coordinating innovative AI projects that bridge technology and business strategy.',
      email: 'marcusj@umich.edu',
      linkedIn: 'https://linkedin.com/in/marcusjohnson',
      featured: true
    },
    {
      name: 'Priya Patel',
      role: 'Technical Lead',
      year: 'Senior',
      major: 'Data Science',
      bio: 'Expert in neural networks and deep learning with experience in fintech applications.',
      email: 'priyap@umich.edu',
      github: 'https://github.com/priyapatel',
      featured: false
    },
    {
      name: 'Alex Rodriguez',
      role: 'Marketing Director',
      year: 'Sophomore',
      major: 'Marketing',
      bio: 'Growing ABG brand and connecting with industry partners and student organizations.',
      email: 'alexr@umich.edu',
      featured: false
    }
  ];

  for (const member of teamMembers) {
    await prisma.teamMember.create({ data: member });
  }

  // Sample Projects
  const projects = [
    {
      title: 'AI-Powered Market Analysis Platform',
      description: 'Real-time market sentiment analysis using natural language processing to predict stock movements and market trends.',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-05-01'),
      budget: '$15,000',
      progress: 75,
      objectives: JSON.stringify([
        'Develop NLP model for sentiment analysis',
        'Create real-time data pipeline',
        'Build interactive dashboard',
        'Validate predictions with historical data'
      ]),
      technologies: JSON.stringify(['Python', 'TensorFlow', 'React', 'AWS', 'PostgreSQL']),
      featured: true,
      createdBy: user.id
    },
    {
      title: 'Supply Chain Optimization Engine',
      description: 'Machine learning solution to optimize supply chain logistics and reduce costs for manufacturing companies.',
      status: 'PLANNING',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-08-15'),
      budget: '$20,000',
      progress: 15,
      objectives: JSON.stringify([
        'Research supply chain bottlenecks',
        'Develop optimization algorithms',
        'Partner with local manufacturers',
        'Implement pilot program'
      ]),
      technologies: JSON.stringify(['Python', 'scikit-learn', 'Flask', 'Docker']),
      featured: true,
      createdBy: user.id
    },
    {
      title: 'Customer Behavior Prediction Model',
      description: 'AI system to predict customer purchasing behavior and optimize marketing campaigns for e-commerce.',
      status: 'COMPLETED',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-30'),
      budget: '$8,500',
      progress: 100,
      objectives: JSON.stringify([
        'Collect customer interaction data',
        'Train prediction models',
        'A/B test marketing campaigns',
        'Measure ROI improvements'
      ]),
      outcomes: JSON.stringify([
        '32% increase in conversion rates',
        '25% reduction in marketing costs',
        'Deployed to 3 partner companies'
      ]),
      technologies: JSON.stringify(['Python', 'XGBoost', 'Apache Kafka', 'MongoDB']),
      featured: false,
      createdBy: user.id
    }
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project });
  }

  // Sample Events
  const events = [
    {
      title: 'AI in Business Symposium',
      description: 'Join us for an exclusive evening exploring the future of AI in business with industry leaders and academic experts.',
      eventDate: new Date('2025-02-15T18:00:00'),
      endDate: new Date('2025-02-15T21:00:00'),
      location: 'Michigan Ross School of Business',
      venue: 'Robertson Auditorium',
      capacity: 200,
      registrationUrl: 'https://umich.edu/events/ai-symposium',
      eventType: 'SYMPOSIUM',
      featured: true,
      createdBy: user.id
    },
    {
      title: 'Machine Learning Workshop',
      description: 'Hands-on workshop covering the fundamentals of machine learning with Python and scikit-learn.',
      eventDate: new Date('2025-01-20T14:00:00'),
      endDate: new Date('2025-01-20T17:00:00'),
      location: 'EECS Building',
      venue: 'Room 1200',
      capacity: 50,
      eventType: 'WORKSHOP',
      featured: true,
      createdBy: user.id
    },
    {
      title: 'Industry Networking Night',
      description: 'Connect with AI professionals from Fortune 500 companies and startups in the Michigan area.',
      eventDate: new Date('2025-03-10T19:00:00'),
      endDate: new Date('2025-03-10T22:00:00'),
      location: 'Michigan Union',
      venue: 'Rogel Ballroom',
      capacity: 150,
      eventType: 'NETWORKING',
      featured: false,
      createdBy: user.id
    },
    {
      title: 'ABG General Meeting',
      description: 'Monthly general meeting for all ABG members to discuss upcoming projects and events.',
      eventDate: new Date('2025-01-15T20:00:00'),
      endDate: new Date('2025-01-15T21:30:00'),
      location: 'Ross School of Business',
      venue: 'Room B0560',
      capacity: 80,
      eventType: 'MEETING',
      featured: false,
      createdBy: user.id
    }
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 