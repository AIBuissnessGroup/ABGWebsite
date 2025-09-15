const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';

async function addSampleProjects() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Sample companies
    const companies = [
      {
        _id: new ObjectId(),
        name: 'Cherry Republic',
        description: 'Michigan-based specialty food company known for their warm, fun, and personable approach to customer experience with strong seasonal retail and service operations.',
        logoUrl: 'https://img.icons8.com/color/96/cherry.png',
        website: 'https://cherryrepublic.com',
        industry: 'Food & Beverage',
        size: 'Medium',
        location: 'Ann Arbor, MI',
        contactEmail: 'partnerships@cherryrepublic.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Direct Digital Holdings',
        description: 'Leading media and advertising technology company focused on programmatic advertising and data-driven marketing solutions.',
        logoUrl: 'https://img.icons8.com/color/96/digital-marketing.png',
        website: 'https://directdigitalholdings.com',
        industry: 'Ad Tech',
        size: 'Enterprise',
        location: 'Atlanta, GA',
        contactEmail: 'research@directdigitalholdings.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Miss Kim Restaurant',
        description: 'Contemporary Korean restaurant focusing on authentic flavors and exceptional service, seeking to optimize operations through data-driven insights.',
        logoUrl: 'https://img.icons8.com/color/96/restaurant.png',
        website: 'https://misskimrestaurant.com',
        industry: 'Food Service',
        size: 'Small',
        location: 'Ann Arbor, MI',
        contactEmail: 'management@misskimrestaurant.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Epic Games',
        description: 'American video game and software developer known for Fortnite and Unreal Engine, pioneering the future of gaming and digital experiences.',
        logoUrl: 'https://img.icons8.com/color/96/epic-games.png',
        website: 'https://epicgames.com',
        industry: 'Gaming',
        size: 'Enterprise',
        location: 'Cary, NC',
        contactEmail: 'partnerships@epicgames.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Herbie',
        description: 'Consumer platform with a mission to make high quality estate planning and administration accessible, affordable and easy to understand.',
        logoUrl: 'https://img.icons8.com/color/96/legal.png',
        website: 'https://planwellwithherbie.com',
        industry: 'Legal Tech',
        size: 'Startup',
        location: 'Atlanta, GA',
        contactEmail: 'hello@planwellwithherbie.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add companies
    console.log('Adding companies...');
    for (const company of companies) {
      const existing = await db.collection('Company').findOne({ name: company.name });
      if (!existing) {
        await db.collection('Company').insertOne(company);
        console.log(`Added company: ${company.name}`);
      } else {
        console.log(`Company ${company.name} already exists, skipping...`);
      }
    }

    // Sample projects
    const projects = [
      {
        _id: new ObjectId(),
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
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
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
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
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
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
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
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
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
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add projects
    console.log('Adding projects...');
    for (const project of projects) {
      const existing = await db.collection('Project').findOne({ title: project.title });
      if (!existing) {
        await db.collection('Project').insertOne(project);
        console.log(`Added project: ${project.title}`);
      } else {
        console.log(`Project ${project.title} already exists, skipping...`);
      }
    }

    // Sample team members for projects
    const teamMembers = [
      {
        _id: new ObjectId(),
        projectId: projects[0]._id, // Cherry Republic project
        name: 'Evelyn Chao',
        role: 'Outreach Liaison',
        year: 'Junior',
        email: 'evchao@umich.edu',
        linkedIn: 'https://linkedin.com/in/evelyn-chao',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        projectId: projects[0]._id, // Cherry Republic project
        name: 'Jessica Au',
        role: 'E-Board Advisor',
        year: 'Junior',
        email: 'jessau@umich.edu',
        linkedIn: 'https://linkedin.com/in/jessica-au',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        projectId: projects[1]._id, // DDH project
        name: 'Evelyn Chao',
        role: 'VP External Relations',
        year: 'Junior',
        email: 'evchao@umich.edu',
        linkedIn: 'https://linkedin.com/in/evelyn-chao',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        projectId: projects[2]._id, // Miss Kim project
        name: 'Sarah Chen',
        role: 'Data Analyst',
        year: 'Senior',
        email: 'sarahchen@umich.edu',
        linkedIn: 'https://linkedin.com/in/sarahchen',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        projectId: projects[2]._id, // Miss Kim project
        name: 'Marcus Johnson',
        role: 'Business Lead',
        year: 'Junior',
        email: 'marcusj@umich.edu',
        linkedIn: 'https://linkedin.com/in/marcusjohnson',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add team members
    console.log('Adding project team members...');
    for (const member of teamMembers) {
      const existing = await db.collection('ProjectTeamMember').findOne({ 
        projectId: member.projectId,
        email: member.email 
      });
      if (!existing) {
        await db.collection('ProjectTeamMember').insertOne(member);
        console.log(`Added team member: ${member.name} to project`);
      } else {
        console.log(`Team member ${member.name} already exists for this project, skipping...`);
      }
    }

    console.log('\nSample projects and companies have been successfully added to MongoDB!');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
addSampleProjects().catch(console.error);
