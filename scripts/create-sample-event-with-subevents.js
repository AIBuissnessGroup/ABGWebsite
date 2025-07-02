const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleEvent() {
  try {
    console.log('Creating sample event with subevents...');

    // Find an admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    // Create a future date for the main event (30 days from now)
    const mainEventDate = new Date();
    mainEventDate.setDate(mainEventDate.getDate() + 30);
    mainEventDate.setHours(9, 0, 0, 0); // 9 AM

    // Create the main event
    const mainEvent = await prisma.event.create({
      data: {
        title: 'AI Innovation Summit 2025',
        description: 'A comprehensive day-long summit featuring workshops, panels, and networking opportunities focused on the latest in AI innovation and business applications.',
        eventDate: mainEventDate,
        endDate: new Date(mainEventDate.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
        location: 'University of Michigan',
        venue: 'Ross School of Business - Robertson Auditorium',
        capacity: 300,
        registrationUrl: 'https://umich.edu/events/ai-summit-2025',
        eventType: 'CONFERENCE',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
        featured: true,
        published: true,
        isMainEvent: true,
        createdBy: adminUser.id
      }
    });

    console.log(`✅ Created main event: ${mainEvent.title}`);

    // Create subevents
    const subevents = [
      {
        title: 'Opening Keynote: The Future of AI',
        description: 'Join industry leaders as they discuss the transformative potential of AI in business.',
        eventDate: new Date(mainEventDate.getTime()), // Same day, 9 AM
        eventType: 'MEETING',
        venue: 'Robertson Auditorium - Main Stage'
      },
      {
        title: 'AI Ethics Workshop',
        description: 'Interactive workshop on ethical considerations in AI development and deployment.',
        eventDate: new Date(mainEventDate.getTime() + 2 * 60 * 60 * 1000), // 11 AM
        eventType: 'WORKSHOP',
        venue: 'Ross R2240'
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Student and faculty startups pitch their AI-powered solutions to industry judges.',
        eventDate: new Date(mainEventDate.getTime() + 4 * 60 * 60 * 1000), // 1 PM
        eventType: 'MEETING',
        venue: 'Robertson Auditorium - Main Stage'
      },
      {
        title: 'Industry Networking Reception',
        description: 'Connect with AI professionals from top companies and research institutions.',
        eventDate: new Date(mainEventDate.getTime() + 6 * 60 * 60 * 1000), // 3 PM
        eventType: 'NETWORKING',
        venue: 'Ross Winter Garden'
      },
      {
        title: 'Technical Deep Dive: Machine Learning at Scale',
        description: 'Technical session on implementing ML systems in production environments.',
        eventDate: new Date(mainEventDate.getTime() + 5 * 60 * 60 * 1000), // 2 PM
        eventType: 'WORKSHOP',
        venue: 'EECS Building Room 1200'
      }
    ];

    // Create all subevents
    for (let i = 0; i < subevents.length; i++) {
      const subeventData = subevents[i];
      const subevent = await prisma.event.create({
        data: {
          title: subeventData.title,
          description: subeventData.description,
          eventDate: subeventData.eventDate,
          endDate: new Date(subeventData.eventDate.getTime() + 90 * 60 * 1000), // 1.5 hours
          location: mainEvent.location,
          venue: subeventData.venue,
          capacity: Math.floor(mainEvent.capacity / 3), // Smaller capacity for subevents
          eventType: subeventData.eventType,
          featured: false,
          published: true,
          isMainEvent: false,
          parentEventId: mainEvent.id,
          createdBy: adminUser.id
        }
      });

      console.log(`✅ Created subevent ${i + 1}: ${subevent.title}`);
    }

    // Create some sample partnerships for the main event
    const companies = await prisma.company.findMany({ take: 2 });
    
    if (companies.length > 0) {
      await prisma.eventPartnership.create({
        data: {
          eventId: mainEvent.id,
          companyId: companies[0].id,
          type: 'SPONSOR',
          sponsorshipLevel: 'Platinum',
          description: 'Title sponsor and keynote speaker'
        }
      });
      console.log(`✅ Added partnership with ${companies[0].name}`);

      if (companies.length > 1) {
        await prisma.eventPartnership.create({
          data: {
            eventId: mainEvent.id,
            companyId: companies[1].id,
            type: 'SPONSOR',
            sponsorshipLevel: 'Gold',
            description: 'Workshop sponsor and networking reception host'
          }
        });
        console.log(`✅ Added partnership with ${companies[1].name}`);
      }
    }

    console.log('🎉 Sample event with subevents created successfully!');
    console.log(`Event ID: ${mainEvent.id}`);
    console.log(`Event Date: ${mainEvent.eventDate.toISOString()}`);

  } catch (error) {
    console.error('❌ Error creating sample event:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSampleEvent();
}

module.exports = { createSampleEvent }; 