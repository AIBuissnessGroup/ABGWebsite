/**
 * Email Configuration Test Script
 * 
 * This script tests your email configuration to ensure emails can be sent.
 * Run with: node scripts/test-email.js
 * 
 * Make sure your .env file is configured with the appropriate email settings.
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testEmailConfiguration() {
  console.log('\n📧 Email Configuration Test\n');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('\n1. Checking environment variables...\n');
  
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || 'smtp';
  console.log(`   Provider: ${provider}`);
  
  const requiredVars = {
    'SMTP_FROM_EMAIL': process.env.SMTP_FROM_EMAIL,
  };
  
  // Provider-specific checks
  switch (provider) {
    case 'sendgrid':
      requiredVars['SENDGRID_API_KEY'] = process.env.SENDGRID_API_KEY;
      break;
    case 'gmail':
      requiredVars['GMAIL_USER'] = process.env.GMAIL_USER;
      requiredVars['GMAIL_APP_PASSWORD'] = process.env.GMAIL_APP_PASSWORD;
      break;
    case 'smtp':
      requiredVars['SMTP_HOST'] = process.env.SMTP_HOST;
      requiredVars['SMTP_PORT'] = process.env.SMTP_PORT || '587';
      break;
  }
  
  let allVarsSet = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      const displayValue = key.includes('PASSWORD') || key.includes('KEY') 
        ? '***' + value.slice(-4) 
        : value;
      console.log(`   ✅ ${key}: ${displayValue}`);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      allVarsSet = false;
    }
  }
  
  if (!allVarsSet) {
    console.error('\n❌ Configuration Error: Missing required environment variables.');
    console.error('   Please check your .env file and the email-setup.md guide.\n');
    process.exit(1);
  }
  
  // Create transporter
  console.log('\n2. Creating email transporter...\n');
  
  let transporter;
  try {
    switch (provider) {
      case 'sendgrid':
        const apiKey = process.env.SENDGRID_API_KEY;
        console.log('   Using SendGrid SMTP relay');
        transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: apiKey,
          },
        });
        break;
        
      case 'gmail':
        console.log('   Using Gmail SMTP');
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });
        break;
        
      case 'smtp':
      default:
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        console.log(`   Using SMTP: ${host}:${port}`);
        
        if (host !== 'smtp.sendgrid.net' && host !== 'localhost') {
          console.warn('   ⚠️  WARNING: Direct SMTP may not work on Digital Ocean!');
          console.warn('   ⚠️  Consider using SendGrid instead (EMAIL_PROVIDER=sendgrid)');
        }
        
        transporter = nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === 'true' || port === 465,
          auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          } : undefined,
        });
        break;
    }
    
    console.log('   ✅ Transporter created successfully');
  } catch (error) {
    console.error('   ❌ Failed to create transporter:', error);
    process.exit(1);
  }
  
  // Verify connection
  console.log('\n3. Verifying connection...\n');
  
  try {
    await transporter.verify();
    console.log('   ✅ Connection verified successfully');
  } catch (error) {
    console.error('   ❌ Connection verification failed:');
    console.error('      ', error.message);
    console.error('\n   Troubleshooting tips:');
    console.error('   - Check your API key/password is correct');
    console.error('   - Ensure no extra spaces in .env file');
    console.error('   - If on Digital Ocean, use SendGrid or another service');
    console.error('   - Check docs/email-setup.md for detailed instructions\n');
    process.exit(1);
  }
  
  // Send test email
  console.log('\n4. Sending test email...\n');
  
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const testEmail = process.env.TEST_EMAIL_TO || fromEmail;
  
  console.log(`   From: ${fromEmail}`);
  console.log(`   To: ${testEmail}`);
  console.log(`   Subject: ABG Email Configuration Test`);
  
  try {
    const info = await transporter.sendMail({
      from: `"ABG Notifications Test" <${fromEmail}>`,
      to: testEmail,
      replyTo: process.env.SMTP_REPLY_TO_EMAIL || fromEmail,
      subject: 'ABG Email Configuration Test',
      text: `This is a test email from the ABG Website email notification system.

Configuration Details:
- Provider: ${provider}
- Time: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}

If you receive this email, your email configuration is working correctly!

---
AI Business Group
University of Michigan`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00274c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .success { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            td:first-child { font-weight: 600; width: 40%; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Email Test Successful</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>🎉 Congratulations!</strong><br>
                Your email configuration is working correctly.
              </div>
              
              <h2>Configuration Details</h2>
              <table>
                <tr>
                  <td>Provider</td>
                  <td>${provider}</td>
                </tr>
                <tr>
                  <td>Test Time</td>
                  <td>${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Environment</td>
                  <td>${process.env.NODE_ENV || 'development'}</td>
                </tr>
              </table>
              
              <p>
                This test email confirms that your ABG Website can successfully send emails. 
                Form submission receipts will now be delivered to users.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} AI Business Group | University of Michigan
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('   ✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    if (info.response) {
      console.log(`   Response: ${info.response}`);
    }
    
  } catch (error) {
    console.error('   ❌ Failed to send test email:');
    console.error('      ', error.message);
    console.error('\n   This could mean:');
    console.error('   - SMTP ports are blocked (common on Digital Ocean)');
    console.error('   - Invalid credentials');
    console.error('   - Sending limits reached');
    console.error('   - Network connectivity issues\n');
    process.exit(1);
  }
  
  // Success!
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests passed!\n');
  console.log('Your email configuration is working correctly.');
  console.log(`Check the inbox of ${testEmail} for the test email.\n`);
  
  if (provider === 'smtp' && process.env.SMTP_HOST !== 'smtp.sendgrid.net') {
    console.log('⚠️  Note: You are using direct SMTP.');
    console.log('   This may not work on Digital Ocean droplets.');
    console.log('   If you experience issues in production, switch to SendGrid:');
    console.log('   Set EMAIL_PROVIDER=sendgrid and add your SENDGRID_API_KEY\n');
  }
}

// Run the test
testEmailConfiguration().catch((error) => {
  console.error('\n❌ Test failed with unexpected error:', error);
  process.exit(1);
});
