#!/usr/bin/env node

/**
 * Gmail Token Monitor Service
 * 
 * This service monitors the Gmail API token and automatically refreshes it
 * when it's about to expire. Runs continuously in the background.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

const CLIENT_ID = envVars.GMAIL_CLIENT_ID;
const CLIENT_SECRET = envVars.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = envVars.GMAIL_REFRESH_TOKEN;

console.log('\n📧 Gmail Token Monitor Service Starting...\n');
console.log('Client ID:', CLIENT_ID?.substring(0, 20) + '...');
console.log('Monitoring interval: Every 30 minutes');
console.log('Token validation on startup...\n');

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing Gmail API credentials in .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function validateToken() {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Validating Gmail token...`);
    
    // Try to get a fresh access token
    const { token } = await oauth2Client.getAccessToken();
    
    if (!token) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to get access token`);
      return false;
    }
    
    // Test the token by making a Gmail API call
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log(`[${new Date().toISOString()}] ✅ Token is valid`);
    console.log(`   Email: ${profile.data.emailAddress}`);
    console.log(`   Messages: ${profile.data.messagesTotal}`);
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Token validation failed:`, error.message);
    
    if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired or revoked')) {
      console.error('\n⚠️  CRITICAL: Refresh token is invalid or expired!');
      console.error('   Action required: Run "node scripts/refresh-gmail-token.js" to get a new token\n');
      
      // Send alert (could integrate with Slack here)
      await sendAlert('Gmail token expired - manual refresh needed');
    }
    
    return false;
  }
}

async function sendAlert(message) {
  // Send Slack notification if webhook is configured
  const slackWebhook = envVars.SLACK_WEBHOOK_URL;
  
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Gmail Token Alert`,
          attachments: [{
            color: 'danger',
            text: message,
            footer: 'ABG Email Service Monitor',
            ts: Math.floor(Date.now() / 1000)
          }]
        })
      });
      console.log(`[${new Date().toISOString()}] 📢 Alert sent to Slack`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ⚠️  Failed to send Slack alert:`, err.message);
    }
  }
}

async function monitorLoop() {
  await validateToken();
  
  // Check every 30 minutes
  setInterval(async () => {
    await validateToken();
  }, 30 * 60 * 1000); // 30 minutes
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📧 Gmail Token Monitor Service stopping...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n📧 Gmail Token Monitor Service stopping...');
  process.exit(0);
});

// Start monitoring
monitorLoop().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
