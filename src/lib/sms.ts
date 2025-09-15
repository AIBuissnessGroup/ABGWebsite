// SMS Service using Twilio
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSMessage {
  to: string;
  message: string;
  eventTitle?: string;
}

export async function sendSMS({ to, message, eventTitle }: SMSMessage): Promise<boolean> {
  if (!client || !fromNumber) {
    console.warn('⚠️ Twilio not configured - SMS not sent');
    console.log('To enable SMS, set these environment variables:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN'); 
    console.log('- TWILIO_PHONE_NUMBER');
    return false;
  }

  // Clean phone number (remove non-digits except +)
  const cleanPhone = to.replace(/[^\d+]/g, '');
  
  // Add +1 if US number without country code
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : 
                        cleanPhone.length === 10 ? `+1${cleanPhone}` : cleanPhone;

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
      // Add optional carrier compliance parameters
      smartEncoded: true, // Helps with special characters
    });

    console.log(`✅ SMS sent to ${formattedPhone} (SID: ${result.sid})`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error);
    
    // Log specific carrier filtering issues
    if (error.code === 30007) {
      console.error('🚫 Message was filtered by carrier - content may violate guidelines');
      console.error('💡 Trial account tip: Ensure recipient phone is verified in Twilio console');
    } else if (error.code === 21610) {
      console.error('🚫 Message was not delivered - likely spam filtered');
    } else if (error.code === 21614) {
      console.error('🚫 Cannot send to unverified number on trial account');
      console.error('💡 Add phone number to verified caller IDs in Twilio console');
    } else if (error.code === 21408) {
      console.error('🚫 Cannot route to this number - may be invalid or unsupported');
    }
    
    return false;
  }
}

export async function sendBulkSMS(messages: SMSMessage[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send messages with a small delay to avoid rate limits
  for (const msg of messages) {
    const success = await sendSMS(msg);
    if (success) {
      sent++;
    } else {
      failed++;
    }
    
    // Small delay between messages (500ms)
    if (messages.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`📊 SMS Bulk Send Complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}