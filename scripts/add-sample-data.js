const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('Adding sample data...');

    // First, ensure we have a user to assign as creator
    let user = await prisma.user.findFirst({
      where: { email: 'skywlkr@umich.edu' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'skywlkr@umich.edu',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
    }

    // Add sample companies
    const companies = [
      {
        name: 'Microsoft',
        description: 'Technology corporation developing, manufacturing, licensing, supporting, and selling computer software, consumer electronics, personal computers, and related services.',
        logoUrl: 'https://img.icons8.com/color/96/microsoft.png',
        website: 'https://microsoft.com',
        industry: 'Technology',
        size: 'Enterprise',
        location: 'Redmond, WA',
        contactEmail: 'partnerships@microsoft.com'
      },
      {
        name: 'Ford Motor Company',
        description: 'American multinational automobile manufacturer headquartered in Dearborn, Michigan, United States.',
        logoUrl: 'https://img.icons8.com/color/96/ford.png',
        website: 'https://ford.com',
        industry: 'Automotive',
        size: 'Enterprise',
        location: 'Dearborn, MI',
        contactEmail: 'innovation@ford.com'
      },
      {
        name: 'Deloitte',
        description: 'Multinational professional services network providing audit, consulting, financial advisory, risk advisory, tax, and related services.',
        logoUrl: 'https://img.icons8.com/color/96/deloitte.png',
        website: 'https://deloitte.com',
        industry: 'Consulting',
        size: 'Enterprise',
        location: 'London, UK',
        contactEmail: 'university@deloitte.com'
      },
      {
        name: 'Startup Accelerator Inc',
        description: 'Early-stage venture capital firm focused on AI and machine learning startups.',
        logoUrl: 'https://img.icons8.com/color/96/rocket.png',
        website: 'https://startupaccelerator.com',
        industry: 'Venture Capital',
        size: 'Small',
        location: 'San Francisco, CA',
        contactEmail: 'partnerships@startupaccelerator.com'
      }
    ];

    console.log('Adding companies...');
    for (const company of companies) {
      const existing = await prisma.company.findFirst({
        where: { name: company.name }
      });
      if (!existing) {
        await prisma.company.create({ data: company });
        console.log(`Added company: ${company.name}`);
      }
    }

    // Add sample team members
    const teamMembers = [
      {
        name: 'Sarah Chen',
        role: 'President',
        year: 'Senior',
        major: 'Computer Science',
        bio: 'Leading AI Business Group with a passion for machine learning applications in enterprise solutions.',
        email: 'sarahchen@umich.edu',
        linkedIn: 'https://linkedin.com/in/sarahchen',
        imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b9c3?w=400&h=400&fit=crop&crop=face',
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
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
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
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
        featured: false
      },
      {
        name: 'Alex Rodriguez',
        role: 'Marketing Director',
        year: 'Sophomore',
        major: 'Communications',
        bio: 'Building ABG\'s brand presence and community engagement across campus and industry.',
        email: 'alexr@umich.edu',
        linkedIn: 'https://linkedin.com/in/alexrodriguez',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        featured: false
      }
    ];

    console.log('Adding team members...');
    for (const member of teamMembers) {
      const existing = await prisma.teamMember.findFirst({
        where: { email: member.email }
      });
      if (!existing) {
        await prisma.teamMember.create({ data: member });
        console.log(`Added team member: ${member.name}`);
      }
    }

    // Add sample projects
    const projects = [
      {
        title: 'AI-Powered Market Analysis Platform',
        description: 'Real-time market sentiment analysis using natural language processing to predict stock movements and market trends.',
        status: 'ACTIVE',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-05-01'),
        budget: '$15,000',
        progress: 75,
        objectives: 'Develop NLP model for sentiment analysis\nCreate real-time data pipeline\nBuild interactive dashboard\nValidate predictions with historical data',
        technologies: 'Python, TensorFlow, React, AWS, PostgreSQL',
        links: 'https://github.com/abg-umich/market-analysis',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      },
      {
        title: 'Customer Behavior Prediction Model',
        description: 'AI system to predict customer purchasing behavior and optimize marketing campaigns for e-commerce platforms.',
        status: 'COMPLETED',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-30'),
        budget: '$8,500',
        progress: 100,
        objectives: 'Collect customer interaction data\nTrain prediction models\nA/B test marketing campaigns\nMeasure ROI improvements',
        outcomes: '32% increase in conversion rates\n25% reduction in marketing costs\nDeployed to 3 partner companies',
        technologies: 'Python, XGBoost, Apache Kafka, MongoDB',
        links: 'https://github.com/abg-umich/customer-behavior',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
        featured: false,
        createdBy: user.id
      },
      {
        title: 'Supply Chain Optimization Engine',
        description: 'Machine learning system to optimize supply chain logistics and reduce operational costs for manufacturing companies.',
        status: 'PLANNING',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-08-01'),
        budget: '$12,000',
        progress: 15,
        objectives: 'Analyze current supply chain data\nDevelop optimization algorithms\nCreate predictive maintenance models\nImplement cost reduction strategies',
        technologies: 'Python, Scikit-learn, Apache Spark, Docker',
        links: 'https://github.com/abg-umich/supply-chain',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      }
    ];

    console.log('Adding projects...');
    for (const project of projects) {
      const existing = await prisma.project.findFirst({
        where: { title: project.title }
      });
      if (!existing) {
        const createdProject = await prisma.project.create({ data: project });
        console.log(`Added project: ${project.title}`);
        
        // Add team members to projects
        if (project.title === 'AI-Powered Market Analysis Platform') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Sarah Chen',
                role: 'Project Lead',
                year: 'Senior',
                email: 'sarahchen@umich.edu',
                linkedIn: 'https://linkedin.com/in/sarahchen'
              },
              {
                projectId: createdProject.id,
                name: 'Priya Patel',
                role: 'Technical Lead',
                year: 'Senior',
                email: 'priyap@umich.edu',
                linkedIn: 'https://linkedin.com/in/priyapatel'
              }
            ]
          });
          
          // Add company partnership
          const microsoft = await prisma.company.findFirst({ where: { name: 'Microsoft' } });
          if (microsoft) {
            await prisma.projectPartnership.create({
              data: {
                projectId: createdProject.id,
                companyId: microsoft.id,
                type: 'SPONSOR',
                description: 'Microsoft Azure credits and technical mentorship'
              }
            });
          }
        }
        
        if (project.title === 'Customer Behavior Prediction Model') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Marcus Johnson',
                role: 'Business Lead',
                year: 'Junior',
                email: 'marcusj@umich.edu',
                linkedIn: 'https://linkedin.com/in/marcusjohnson'
              },
              {
                projectId: createdProject.id,
                name: 'Alex Rodriguez',
                role: 'Data Analyst',
                year: 'Sophomore',
                email: 'alexr@umich.edu',
                linkedIn: 'https://linkedin.com/in/alexrodriguez'
              }
            ]
          });
          
          // Add company partnership
          const deloitte = await prisma.company.findFirst({ where: { name: 'Deloitte' } });
          if (deloitte) {
            await prisma.projectPartnership.create({
              data: {
                projectId: createdProject.id,
                companyId: deloitte.id,
                type: 'CLIENT',
                description: 'Real-world data and business validation'
              }
            });
          }
        }
        
        if (project.title === 'Supply Chain Optimization Engine') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Sarah Chen',
                role: 'Strategic Advisor',
                year: 'Senior',
                email: 'sarahchen@umich.edu',
                linkedIn: 'https://linkedin.com/in/sarahchen'
              },
              {
                projectId: createdProject.id,
                name: 'Priya Patel',
                role: 'Lead Developer',
                year: 'Senior',
                email: 'priyap@umich.edu',
                linkedIn: 'https://linkedin.com/in/priyapatel'
              }
            ]
          });
          
          // Add company partnership
          const ford = await prisma.company.findFirst({ where: { name: 'Ford Motor Company' } });
          if (ford) {
            await prisma.projectPartnership.create({
              data: {
                projectId: createdProject.id,
                companyId: ford.id,
                type: 'COLLABORATOR',
                description: 'Supply chain data and industry expertise'
              }
            });
          }
        }
      }
    }

    // Add sample events
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
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=400&fit=crop',
        featured: true,
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
        imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop',
        featured: false,
        createdBy: user.id
      },
      {
        title: 'Industry Partnership Mixer',
        description: 'Networking event connecting ABG members with industry professionals and potential project sponsors.',
        eventDate: new Date('2025-03-10T17:30:00'),
        endDate: new Date('2025-03-10T20:00:00'),
        location: 'Michigan Ross School of Business',
        venue: 'Winter Garden',
        capacity: 150,
        registrationUrl: 'https://umich.edu/events/partnership-mixer',
        eventType: 'NETWORKING',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      }
    ];

    console.log('Adding events...');
    for (const event of events) {
      const existing = await prisma.event.findFirst({
        where: { title: event.title }
      });
      if (!existing) {
        const createdEvent = await prisma.event.create({ data: event });
        console.log(`Added event: ${event.title}`);
        
        // Add event partnerships
        if (event.title === 'AI in Business Symposium') {
          const microsoft = await prisma.company.findFirst({ where: { name: 'Microsoft' } });
          const deloitte = await prisma.company.findFirst({ where: { name: 'Deloitte' } });
          
          if (microsoft) {
            await prisma.eventPartnership.create({
              data: {
                eventId: createdEvent.id,
                companyId: microsoft.id,
                type: 'SPONSOR',
                sponsorshipLevel: 'Platinum',
                description: 'Keynote speaker and venue sponsorship'
              }
            });
          }
          
          if (deloitte) {
            await prisma.eventPartnership.create({
              data: {
                eventId: createdEvent.id,
                companyId: deloitte.id,
                type: 'SPONSOR',
                sponsorshipLevel: 'Gold',
                description: 'Panel discussion and networking reception'
              }
            });
          }
        }
        
        if (event.title === 'Machine Learning Workshop') {
          const startupAccelerator = await prisma.company.findFirst({ where: { name: 'Startup Accelerator Inc' } });
          
          if (startupAccelerator) {
            await prisma.eventPartnership.create({
              data: {
                eventId: createdEvent.id,
                companyId: startupAccelerator.id,
                type: 'MENTOR',
                description: 'Technical mentors and startup pitch opportunities'
              }
            });
          }
        }
        
        if (event.title === 'Industry Partnership Mixer') {
          const ford = await prisma.company.findFirst({ where: { name: 'Ford Motor Company' } });
          
          if (ford) {
            await prisma.eventPartnership.create({
              data: {
                eventId: createdEvent.id,
                companyId: ford.id,
                type: 'SPONSOR',
                sponsorshipLevel: 'Silver',
                description: 'Networking venue and refreshments'
              }
            });
          }
        }
      }
    }

    // Add site settings
    const siteSettings = [
      {
        key: 'site_title',
        value: 'AI Business Group - University of Michigan',
        description: 'Main site title',
        type: 'TEXT'
      },
      {
        key: 'site_description',
        value: 'Building the bridge between artificial intelligence and real-world business impact at the University of Michigan.',
        description: 'Site meta description',
        type: 'TEXT'
      },
      {
        key: 'countdown_display_mode',
        value: 'next_event',
        description: 'Choose whether to display next event or next featured event in countdown. Options: next_event, next_featured',
        type: 'TEXT'
      }
    ];

    for (const setting of siteSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      });
    }

    console.log('✅ Sample data added successfully!');
    console.log(`📊 Total team members: ${await prisma.teamMember.count()}`);
    console.log(`🚀 Total projects: ${await prisma.project.count()}`);
    console.log(`📅 Total events: ${await prisma.event.count()}`);
    console.log(`🏢 Total companies: ${await prisma.company.count()}`);
    console.log(`🤝 Total project partnerships: ${await prisma.projectPartnership.count()}`);
    console.log(`🎯 Total event partnerships: ${await prisma.eventPartnership.count()}`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData(); 