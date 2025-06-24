const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFormSystem() {
  try {
    console.log('Testing form system...');

    // Check if forms exist
    const forms = await prisma.form.findMany({
      include: {
        questions: true,
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    console.log(`Found ${forms.length} forms in database:`);
    forms.forEach(form => {
      console.log(`- ${form.title} (${form.slug})`);
      console.log(`  Questions: ${form.questions.length}`);
      console.log(`  Applications: ${form._count.applications}`);
      console.log(`  Active: ${form.isActive}`);
      console.log(`  Public: ${form.isPublic}`);
      console.log(`  Requires Auth: ${form.requireAuth}`);
      console.log('');
    });

    // Test creating a simple public form for testing
    const testForm = await prisma.form.upsert({
      where: { slug: 'test-form' },
      update: {},
      create: {
        title: 'Test Form - No Auth Required',
        description: 'A simple test form to verify the submission system works.',
        slug: 'test-form',
        category: 'test',
        isActive: true,
        isPublic: true,
        allowMultiple: true,
        requireAuth: false,
        backgroundColor: '#00274c',
        textColor: '#ffffff',
        questions: {
          create: [
            {
              title: 'What is your name?',
              description: 'Just a simple test question.',
              type: 'TEXT',
              required: true,
              order: 0
            },
            {
              title: 'How did you hear about us?',
              description: 'Select one option.',
              type: 'SELECT',
              required: false,
              order: 1,
              options: JSON.stringify([
                'Website',
                'Social Media',
                'Friend',
                'Other'
              ])
            }
          ]
        }
      },
      include: {
        questions: true
      }
    });

    console.log('✅ Test form created successfully!');
    console.log(`Access it at: http://localhost:3000/forms/${testForm.slug}`);
    console.log('');
    console.log('This form does not require authentication, so you can test the submit button directly.');

  } catch (error) {
    console.error('❌ Error testing form system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFormSystem(); 