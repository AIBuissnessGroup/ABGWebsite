const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleForm() {
  try {
    console.log('Creating sample membership application form...');

    // First, find an admin user to assign as creator
    const adminUser = await prisma.user.findFirst({
      where: {
        email: {
          contains: '@umich.edu'
        }
      }
    });

    if (!adminUser) {
      console.error('No admin user found. Please make sure you have signed in to the admin dashboard first.');
      return;
    }

    // Create the membership application form
    const form = await prisma.form.create({
      data: {
        title: 'AI Business Group Membership Application',
        description: 'Join the AI Business Group at the University of Michigan. We\'re looking for passionate students interested in the intersection of artificial intelligence and business.',
        slug: 'membership-application',
        category: 'membership',
        isActive: true,
        isPublic: true,
        allowMultiple: false,
        deadline: new Date('2024-12-31T23:59:59Z'),
        maxSubmissions: 50,
        notifyOnSubmission: true,
        notificationEmail: 'admin@abg-umich.com',
        requireAuth: true,
        backgroundColor: '#00274c',
        textColor: '#ffffff',
        createdBy: adminUser.id,
        questions: {
          create: [
            {
              title: 'What is your current year at the University of Michigan?',
              description: 'Please select your current academic standing.',
              type: 'SELECT',
              required: true,
              order: 0,
              options: JSON.stringify([
                'Freshman',
                'Sophomore',
                'Junior',
                'Senior',
                'Graduate Student',
                'PhD Student'
              ])
            },
            {
              title: 'What is your major/field of study?',
              description: 'Please specify your primary area of study.',
              type: 'TEXT',
              required: true,
              order: 1,
              maxLength: 100
            },
            {
              title: 'Do you have any prior experience with AI or machine learning?',
              description: 'This could include coursework, projects, internships, or personal learning.',
              type: 'RADIO',
              required: true,
              order: 2,
              options: JSON.stringify([
                'No experience',
                'Some coursework or online learning',
                'Academic projects or research',
                'Professional experience or internships',
                'Extensive experience'
              ])
            },
            {
              title: 'Please describe your interest in AI and business.',
              description: 'Tell us why you want to join ABG and what specific areas interest you most (2-3 paragraphs).',
              type: 'TEXTAREA',
              required: true,
              order: 3,
              minLength: 200,
              maxLength: 1000
            },
            {
              title: 'What programming languages are you familiar with?',
              description: 'Select all that apply. Don\'t worry if you\'re just starting out!',
              type: 'CHECKBOX',
              required: false,
              order: 4,
              options: JSON.stringify([
                'Python',
                'R',
                'JavaScript/TypeScript',
                'Java',
                'C++',
                'SQL',
                'MATLAB',
                'No programming experience yet'
              ])
            },
            {
              title: 'Are you interested in leading projects or initiatives?',
              description: 'We value members who want to take on leadership roles.',
              type: 'BOOLEAN',
              required: true,
              order: 5
            },
            {
              title: 'How did you hear about AI Business Group?',
              type: 'SELECT',
              required: true,
              order: 6,
              options: JSON.stringify([
                'Social media',
                'Friend or classmate',
                'Professor recommendation',
                'Campus event',
                'University website',
                'Other student organization',
                'Other'
              ])
            },
            {
              title: 'LinkedIn Profile URL (Optional)',
              description: 'If you have a LinkedIn profile, please share it with us.',
              type: 'URL',
              required: false,
              order: 7
            },
            {
              title: 'Is there anything else you\'d like us to know about you?',
              description: 'Optional space for any additional information, achievements, or relevant experiences.',
              type: 'TEXTAREA',
              required: false,
              order: 8,
              maxLength: 500
            },
            {
              title: 'Expected Graduation Date',
              description: 'When do you expect to graduate from the University of Michigan?',
              type: 'DATE',
              required: true,
              order: 9
            }
          ]
        }
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log('✅ Sample form created successfully!');
    console.log(`Form ID: ${form.id}`);
    console.log(`Form Slug: ${form.slug}`);
    console.log(`Public URL: http://localhost:3000/forms/${form.slug}`);
    console.log(`Questions created: ${form.questions.length}`);

    // Create a sample event registration form too
    const eventForm = await prisma.form.create({
      data: {
        title: 'AI in Business Symposium Registration',
        description: 'Register for our flagship event featuring industry leaders, networking opportunities, and hands-on workshops.',
        slug: 'symposium-registration',
        category: 'event',
        isActive: true,
        isPublic: true,
        allowMultiple: false,
        deadline: new Date('2024-07-20T23:59:59Z'),
        maxSubmissions: 200,
        notifyOnSubmission: true,
        notificationEmail: 'events@abg-umich.com',
        backgroundColor: '#00274c',
        textColor: '#ffffff',
        createdBy: adminUser.id,
        questions: {
          create: [
            {
              title: 'Dietary Restrictions',
              description: 'Please let us know of any dietary restrictions for the lunch provided.',
              type: 'TEXTAREA',
              required: false,
              order: 0,
              maxLength: 200
            },
            {
              title: 'Which sessions are you most interested in?',
              description: 'Select all that apply.',
              type: 'CHECKBOX',
              required: true,
              order: 1,
              options: JSON.stringify([
                'AI in Healthcare',
                'AI in Finance',
                'AI in Marketing',
                'AI Ethics and Governance',
                'Startup Pitch Competition',
                'Networking Lunch',
                'Hands-on Workshops'
              ])
            },
            {
              title: 'What is your current role?',
              type: 'SELECT',
              required: true,
              order: 2,
              options: JSON.stringify([
                'Undergraduate Student',
                'Graduate Student',
                'Faculty',
                'Industry Professional',
                'Entrepreneur',
                'Other'
              ])
            },
            {
              title: 'Emergency Contact Name',
              type: 'TEXT',
              required: true,
              order: 3,
              maxLength: 100
            },
            {
              title: 'Emergency Contact Phone',
              type: 'PHONE',
              required: true,
              order: 4
            }
          ]
        }
      }
    });

    console.log('✅ Sample event form created successfully!');
    console.log(`Event Form ID: ${eventForm.id}`);
    console.log(`Event Form Slug: ${eventForm.slug}`);
    console.log(`Event Public URL: http://localhost:3000/forms/${eventForm.slug}`);

  } catch (error) {
    console.error('Error creating sample form:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleForm(); 