import cron from 'node-cron';
import { MongoClient } from 'mongodb';
import { sendEmail } from './email';

const uri = process.env.MONGODB_URI!;
let client: MongoClient;
let isInitialized = false;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('abg-website');
}

async function processScheduledEmails() {
  try {
    const db = await getDb();
    const now = new Date();

    console.log('🔍 Checking for scheduled emails...');

    // Find emails that are due to be sent
    const dueEmails = await db
      .collection('scheduledEmails')
      .find({
        scheduledFor: { $lte: now },
        status: 'pending'
      })
      .toArray();

    if (dueEmails.length === 0) {
      console.log('   No emails due at this time');
      return;
    }

    console.log(`📧 Found ${dueEmails.length} scheduled email(s) to send`);

    for (const scheduledEmail of dueEmails) {
      console.log(`   Processing: "${scheduledEmail.subject}"`);
      
      let sent = 0;
      let failed = 0;

      // Send to each recipient
      for (const recipient of scheduledEmail.recipients) {
        try {
          const success = await sendEmail({
            to: recipient,
            subject: scheduledEmail.subject,
            html: scheduledEmail.htmlContent,
            replyTo: 'ABGcontact@umich.edu',
            attachments: scheduledEmail.attachments || []
          });

          if (success) {
            sent++;
            console.log(`   ✓ Sent to ${recipient}`);
          } else {
            failed++;
            console.log(`   ✗ Failed to send to ${recipient}`);
          }
        } catch (error) {
          failed++;
          console.error(`   ✗ Error sending to ${recipient}:`, error);
        }
      }

      // Update the scheduled email status
      await db.collection('scheduledEmails').updateOne(
        { _id: scheduledEmail._id },
        {
          $set: {
            status: failed === 0 ? 'sent' : (sent === 0 ? 'failed' : 'partial'),
            sentAt: new Date(),
            sent,
            failed
          }
        }
      );

      console.log(`   Completed: ${sent} sent, ${failed} failed`);
    }

    console.log('✅ Scheduled emails processed');
  } catch (error) {
    console.error('❌ Error processing scheduled emails:', error);
  }
}

export function startScheduledEmailsCron() {
  if (isInitialized) {
    console.log('⚠️  Scheduled emails cron already initialized');
    return;
  }

  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processScheduledEmails();
  });

  isInitialized = true;
  console.log('✅ Scheduled emails cron started (runs every minute)');
}

// Graceful shutdown
export async function stopScheduledEmailsCron() {
  if (client) {
    await client.close();
  }
}
