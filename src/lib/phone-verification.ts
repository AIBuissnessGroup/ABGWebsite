// Phone number verification service for Twilio trial accounts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  isAlreadyVerified?: boolean;
}

export async function verifyPhoneNumber(phoneNumber: string): Promise<PhoneVerificationResult> {
  if (!client) {
    return {
      success: false,
      message: 'Twilio not configured'
    };
  }

  try {
    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : 
                          cleanPhone.length === 10 ? `+1${cleanPhone}` : cleanPhone;

    console.log(`📱 Attempting to verify phone number: ${formattedPhone}`);

    // Check if already verified
    const existingCallerIds = await client.validationRequests.list();
    const alreadyVerified = existingCallerIds.find(
      caller => caller.phoneNumber === formattedPhone && caller.validationCode
    );

    if (alreadyVerified) {
      console.log(`✅ Phone number already verified: ${formattedPhone}`);
      return {
        success: true,
        message: 'Phone number is already verified',
        isAlreadyVerified: true
      };
    }

    // Create validation request
    const validationRequest = await client.validationRequests.create({
      phoneNumber: formattedPhone,
      friendlyName: `ABG Auto-verification ${new Date().toISOString()}`
    });

    console.log(`🔄 Verification request created for ${formattedPhone}`);
    console.log(`📞 Validation code will be called to: ${formattedPhone}`);

    return {
      success: true,
      message: `Verification call initiated to ${formattedPhone}. Please answer and enter the code when prompted.`
    };

  } catch (error: any) {
    console.error('❌ Phone verification failed:', error);
    
    if (error.code === 20003) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    } else if (error.code === 21212) {
      return {
        success: false,
        message: 'Phone number is already verified or pending verification'
      };
    } else {
      return {
        success: false,
        message: `Verification failed: ${error.message}`
      };
    }
  }
}

export async function bulkVerifyPhoneNumbers(phoneNumbers: string[]): Promise<{
  verified: string[];
  failed: string[];
  alreadyVerified: string[];
}> {
  const verified: string[] = [];
  const failed: string[] = [];
  const alreadyVerified: string[] = [];

  console.log(`📱 Starting bulk verification for ${phoneNumbers.length} phone numbers`);

  for (const phone of phoneNumbers) {
    const result = await verifyPhoneNumber(phone);
    
    if (result.success) {
      if (result.isAlreadyVerified) {
        alreadyVerified.push(phone);
      } else {
        verified.push(phone);
      }
    } else {
      failed.push(phone);
    }

    // Small delay between requests to avoid rate limits
    if (phoneNumbers.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`📊 Verification complete: ${verified.length} initiated, ${alreadyVerified.length} already verified, ${failed.length} failed`);

  return {
    verified,
    failed,
    alreadyVerified
  };
}