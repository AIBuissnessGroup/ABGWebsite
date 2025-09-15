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
        name: 'Cherry Republic',
        description: 'Michigan-based specialty food company known for their warm, fun, and personable approach to customer experience with strong seasonal retail and service operations.',
        logoUrl: 'https://img.icons8.com/color/96/cherry.png',
        website: 'https://cherryrepublic.com',
        industry: 'Food & Beverage',
        size: 'Medium',
        location: 'Ann Arbor, MI',
        contactEmail: 'partnerships@cherryrepublic.com'
      },
      {
        name: 'Direct Digital Holdings',
        description: 'Leading media and advertising technology company focused on programmatic advertising and data-driven marketing solutions.',
        logoUrl: 'https://img.icons8.com/color/96/digital-marketing.png',
        website: 'https://directdigitalholdings.com',
        industry: 'Ad Tech',
        size: 'Enterprise',
        location: 'Atlanta, GA',
        contactEmail: 'research@directdigitalholdings.com'
      },
      {
        name: 'Miss Kim Restaurant',
        description: 'Contemporary Korean restaurant focusing on authentic flavors and exceptional service, seeking to optimize operations through data-driven insights.',
        logoUrl: 'https://img.icons8.com/color/96/restaurant.png',
        website: 'https://misskimrestaurant.com',
        industry: 'Food Service',
        size: 'Small',
        location: 'Ann Arbor, MI',
        contactEmail: 'management@misskimrestaurant.com'
      },
      {
        name: 'Epic Games',
        description: 'American video game and software developer known for Fortnite and Unreal Engine, pioneering the future of gaming and digital experiences.',
        logoUrl: 'https://img.icons8.com/color/96/epic-games.png',
        website: 'https://epicgames.com',
        industry: 'Gaming',
        size: 'Enterprise',
        location: 'Cary, NC',
        contactEmail: 'partnerships@epicgames.com'
      },
      {
        name: 'Herbie',
        description: 'Consumer platform with a mission to make high quality estate planning and administration accessible, affordable and easy to understand.',
        logoUrl: 'https://img.icons8.com/color/96/legal.png',
        website: 'https://planwellwithherbie.com',
        industry: 'Legal Tech',
        size: 'Startup',
        location: 'Atlanta, GA',
        contactEmail: 'hello@planwellwithherbie.com'
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
        title: 'AI-Supported Scheduling & Customer Service Optimization',
        description: 'Cherry Republic partnership to optimize staffing and customer service using AI while maintaining their warm, personable brand voice. Building AI-assisted seasonal staffing forecasts, call support tools, and brand-conscious decision flowcharts.',
        status: 'ACTIVE',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-30'),
        budget: '$12,000',
        progress: 45,
        objectives: 'Analyze historical sales and staffing patterns\nBuild AI-assisted seasonal forecasting model\nCreate manager-friendly decision flowcharts\nPrototype AI call support maintaining Cherry Republic voice\nValidate tools with staff interviews',
        technologies: 'Python, Scikit-learn, React, MongoDB',
        links: 'https://github.com/abg-umich/cherry-republic',
        imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      },
      {
        title: 'AI and the Next Major Breakthrough in Media & Ad Tech',
        description: 'Research white paper collaboration with Direct Digital Holdings exploring AI breakthroughs, disruptive technologies, and evolving business models in media and ad tech over the next 5-10 years.',
        status: 'ACTIVE',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-15'),
        budget: '$8,000',
        progress: 25,
        objectives: 'Research AI-driven ad personalization trends\nAnalyze generative AI in creative production\nExamine data privacy and regulation impacts\nDevelop cross-platform optimization strategies\nCreate predictive analytics frameworks',
        technologies: 'Research & Analysis, Data Visualization, Python',
        links: 'https://github.com/abg-umich/ddh-research',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      },
      {
        title: 'AI-Guided Labor Scheduling Optimization',
        description: 'Miss Kim Restaurant partnership to optimize labor scheduling and reduce costs from 37% to target range of 28-32%. Developing AI-informed frameworks and manager-friendly decision tools.',
        status: 'PLANNING',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-15'),
        budget: '$6,500',
        progress: 10,
        objectives: 'Analyze historical sales and labor data\nIdentify staffing vs performance patterns\nDevelop AI-assisted scheduling model\nCreate simple decision flowcharts for managers\nValidate with staff interviews and pilot testing',
        technologies: 'Python, Machine Learning, Data Analytics',
        links: 'https://github.com/abg-umich/miss-kim',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
        featured: false,
        createdBy: user.id
      },
      {
        title: 'Project Harvest - Epic Games Partnership',
        description: 'Strategic consulting partnership with Epic Games focused on innovative gaming and technology solutions. Details will be released soon.',
        status: 'PLANNING',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-05-01'),
        budget: 'TBD',
        progress: 5,
        objectives: 'Project details will be announced shortly\nStrategic consulting and analysis\nGaming technology optimization\nBusiness development support',
        technologies: 'TBD - Details coming soon',
        links: 'https://github.com/abg-umich/project-harvest',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
        featured: true,
        createdBy: user.id
      },
      {
        title: 'Estate Planning Technology Platform - Herbie',
        description: 'Consumer platform partnership with Herbie to make high quality estate planning and administration accessible, affordable and easy to understand. Details will be released soon.',
        status: 'PLANNING',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-01'),
        budget: 'TBD',
        progress: 5,
        objectives: 'Estate planning process optimization\nUser experience enhancement\nTechnology platform development\nAccessibility and affordability improvements',
        technologies: 'TBD - Details coming soon',
        links: 'https://github.com/abg-umich/herbie-project',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
        featured: false,
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
        if (project.title === 'AI-Supported Scheduling & Customer Service Optimization') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Evelyn Chao',
                role: 'Outreach Liaison',
                year: 'Junior',
                email: 'evchao@umich.edu',
                linkedIn: 'https://linkedin.com/in/evelyn-chao'
              },
              {
                projectId: createdProject.id,
                name: 'Jessica Au',
                role: 'E-Board Advisor',
                year: 'Junior',
                email: 'jessau@umich.edu',
                linkedIn: 'https://linkedin.com/in/jessica-au'
              }
            ]
          });
        }
        
        if (project.title === 'AI and the Next Major Breakthrough in Media & Ad Tech') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Evelyn Chao',
                role: 'VP External Relations',
                year: 'Junior',
                email: 'evchao@umich.edu',
                linkedIn: 'https://linkedin.com/in/evelyn-chao'
              }
            ]
          });
        }
        
        if (project.title === 'AI-Guided Labor Scheduling Optimization') {
          await prisma.projectTeamMember.createMany({
            data: [
              {
                projectId: createdProject.id,
                name: 'Sarah Chen',
                role: 'Data Analyst',
                year: 'Senior',
                email: 'sarahchen@umich.edu',
                linkedIn: 'https://linkedin.com/in/sarahchen'
              },
              {
                projectId: createdProject.id,
                name: 'Marcus Johnson',
                role: 'Business Lead',
                year: 'Junior',
                email: 'marcusj@umich.edu',
                linkedIn: 'https://linkedin.com/in/marcusjohnson'
              }
            ]
          });
        }
      } else {
        console.log(`Project ${project.title} already exists, skipping...`);
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