#!/usr/bin/env node

/**
 * Gmail Token Refresh Worker
 * 
 * This worker proactively refreshes the Gmail access token every hour
 * to prevent the refresh token from expiring due to inactivity.
 * 
 * Google OAuth refresh tokens can expire if:
 * 1. Not used for 6 months
 * 2. OAuth app is in "Testing" mode (7-day expiry)
 * 3. User revokes access
 * 
 * This worker keeps the token active by:
 * - Refreshing the access token hourly
 * - Making a lightweight API call to verify the token works
 * - Sending Slack alerts if the token fails
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const STARTUP_DELAY_MS = 30 * 1000; // 30 seconds delay on startup

// Load environment variables from .env.production (for Docker/PM2) or .env.local (for local dev)
function loadEnvVars() {
  const envFiles = ['.env.production', '.env.local'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Loading environment from ${envFile}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]*)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove surrounding quotes
          value = value.replace(/^["']|["']$/g, '');
          envVars[key] = value;
        }
      });
      return envVars;
    }
  }
  
  // Fall back to process.env
  console.log('📁 Using process.env for configuration');
  return process.env;
}

const envVars = loadEnvVars();

const CLIENT_ID = envVars.GMAIL_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = envVars.GMAIL_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = envVars.GMAIL_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN;
const SLACK_WEBHOOK_URL = envVars.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

console.log('\n🔄 Gmail Token Refresh Worker Starting...\n');
console.log(`   Client ID: ${CLIENT_ID?.substring(0, 20)}...`);
console.log(`   Refresh Interval: ${REFRESH_INTERVAL_MS / 1000 / 60} minutes`);
console.log(`   Slack Alerts: ${SLACK_WEBHOOK_URL ? 'Enabled' : 'Disabled'}`);
console.log('');

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing Gmail API credentials');
  console.error('   Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

let successCount = 0;
let failureCount = 0;
let lastSuccessTime = null;

/**
 * Refresh the access token and validate it with a lightweight API call
 */
async function refreshAndValidateToken() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] 🔄 Refreshing access token...`);
    
    // Force refresh the access token
    const { token, res } = await oauth2Client.getAccessToken();
    
    if (!token) {
      throw new Error('No access token returned');
    }
    
    // Get token expiry info
    const credentials = oauth2Client.credentials;
    const expiryDate = credentials.expiry_date 
      ? new Date(credentials.expiry_date).toISOString() 
      : 'unknown';
    
    console.log(`[${timestamp}] ✅ Access token refreshed`);
    console.log(`   Token expires: ${expiryDate}`);
    
    // Make a lightweight API call to verify the token works
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log(`[${timestamp}] ✅ Token validated successfully`);
    console.log(`   Email: ${profile.data.emailAddress}`);
    
    successCount++;
    lastSuccessTime = new Date();
    
    // Log stats periodically
    if (successCount % 24 === 0) { // Every 24 hours
      console.log(`\n📊 Stats: ${successCount} successful refreshes, ${failureCount} failures`);
      console.log(`   Uptime: Token has been kept alive for ${Math.floor(successCount)} hours\n`);
    }
    
    return true;
  } catch (error) {
    failureCount++;
    console.error(`[${timestamp}] ❌ Token refresh failed:`, error.message);
    
    const isTokenExpired = 
      error.message.includes('invalid_grant') || 
      error.message.includes('Token has been expired') ||
      error.message.includes('Token has been revoked');
    
    if (isTokenExpired) {
      console.error('\n⚠️  CRITICAL: Refresh token is invalid or expired!');
      console.error('   The refresh token needs to be regenerated manually.');
      console.error('   Instructions:');
      console.error('   1. Go to https://developers.google.com/oauthplayground');
      console.error('   2. Use your own OAuth credentials (gear icon)');
      console.error('   3. Authorize Gmail scopes and get a new refresh token');
      console.error('   4. Update GMAIL_REFRESH_TOKEN in .env.production');
      console.error('   5. Restart the application\n');
      
      await sendSlackAlert(
        '🚨 Gmail Token Expired - Manual Action Required',
        `The Gmail refresh token has expired and needs to be regenerated.\n\n` +
        `*Error:* ${error.message}\n\n` +
        `*Action Required:*\n` +
        `1. Go to Google OAuth Playground\n` +
        `2. Generate a new refresh token\n` +
        `3. Update GMAIL_REFRESH_TOKEN in .env.production\n` +
        `4. Restart the application`,
        'danger'
      );
    } else {
      // Transient error - might recover
      console.error('   This may be a temporary error. Will retry next interval.\n');
      
      if (failureCount >= 3) {
        await sendSlackAlert(
          '⚠️ Gmail Token Refresh Failing',
          `The Gmail token refresh has failed ${failureCount} times.\n\n` +
          `*Last Error:* ${error.message}\n` +
          `*Last Success:* ${lastSuccessTime?.toISOString() || 'Never'}`,
          'warning'
        );
      }
    }
    
    return false;
  }
}

/**
 * Send a Slack alert
 */
async function sendSlackAlert(title, message, color = 'danger') {
  if (!SLACK_WEBHOOK_URL) {
    console.log('   (Slack alerts not configured)');
    return;
  }
  
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: title,
        attachments: [{
          color: color,
          text: message,
          footer: 'ABG Gmail Token Refresh Worker',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    });
    
    if (response.ok) {
      console.log(`[${new Date().toISOString()}] 📢 Slack alert sent`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ⚠️  Failed to send Slack alert:`, err.message);
  }
}

/**
 * Main loop
 */
async function main() {
  // Initial refresh after a short delay (let other services start)
  console.log(`⏳ Starting initial refresh in ${STARTUP_DELAY_MS / 1000} seconds...`);
  await new Promise(resolve => setTimeout(resolve, STARTUP_DELAY_MS));
  
  // Do initial refresh
  await refreshAndValidateToken();
  
  // Schedule periodic refreshes
  console.log(`\n⏰ Scheduling refresh every ${REFRESH_INTERVAL_MS / 1000 / 60} minutes\n`);
  
  setInterval(async () => {
    await refreshAndValidateToken();
  }, REFRESH_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Gmail Token Refresh Worker shutting down...');
  console.log(`   Total refreshes: ${successCount} successful, ${failureCount} failed`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Gmail Token Refresh Worker shutting down...');
  console.log(`   Total refreshes: ${successCount} successful, ${failureCount} failed`);
  process.exit(0);
});

// Start the worker
main().catch(error => {
  console.error('❌ Worker failed to start:', error);
  process.exit(1);
});
