const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEventAttendanceSetting() {
  try {
    // Check if setting already exists
    const existingSetting = await prisma.siteSettings.findUnique({
      where: { key: 'event_attendance_text' }
    });

    if (existingSetting) {
      console.log('Event attendance text setting already exists:', existingSetting.value);
      return;
    }

    // Create the setting
    const setting = await prisma.siteSettings.create({
      data: {
        key: 'event_attendance_text',
        value: 'Open to all students',
        description: 'Text displayed in the event countdown component to indicate who can attend events',
        type: 'TEXT'
      }
    });

    console.log('✅ Event attendance text setting created successfully:', setting);
  } catch (error) {
    console.error('❌ Error adding event attendance text setting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addEventAttendanceSetting(); 