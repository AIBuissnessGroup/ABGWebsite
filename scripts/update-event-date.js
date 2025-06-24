const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEventDate() {
  try {
    console.log('Updating event date to be in the future...');

    // Find the AI Symposium event
    const event = await prisma.event.findFirst({
      where: {
        title: 'AI in Business Symposium'
      }
    });

    if (event) {
      // Set the event date to be 30 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      futureDate.setHours(18, 0, 0, 0); // 6 PM

      const endDate = new Date(futureDate);
      endDate.setHours(21, 0, 0, 0); // 9 PM

      await prisma.event.update({
        where: { id: event.id },
        data: {
          eventDate: futureDate,
          endDate: endDate
        }
      });

      console.log(`✅ Updated "${event.title}" to ${futureDate.toISOString()}`);
    } else {
      console.log('❌ AI in Business Symposium event not found');
    }

    // Also update the Industry Partnership Mixer to be in the future
    const mixerEvent = await prisma.event.findFirst({
      where: {
        title: 'Industry Partnership Mixer'
      }
    });

    if (mixerEvent) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      futureDate.setHours(17, 30, 0, 0); // 5:30 PM

      const endDate = new Date(futureDate);
      endDate.setHours(20, 0, 0, 0); // 8 PM

      await prisma.event.update({
        where: { id: mixerEvent.id },
        data: {
          eventDate: futureDate,
          endDate: endDate
        }
      });

      console.log(`✅ Updated "${mixerEvent.title}" to ${futureDate.toISOString()}`);
    }

    console.log('✅ Event dates updated successfully!');

  } catch (error) {
    console.error('❌ Error updating event dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEventDate(); 