#!/usr/bin/env node

/**
 * Test Gmail API authentication
 */

const fs = require('fs');
const { google } = require('googleapis');

// Load .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const CLIENT_ID = envVars.GMAIL_CLIENT_ID;
const CLIENT_SECRET = envVars.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = envVars.GMAIL_REFRESH_TOKEN;

console.log('\n🔐 Testing Gmail API Authentication\n');
console.log('Client ID:', CLIENT_ID?.substring(0, 20) + '...');
console.log('Client Secret:', CLIENT_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('Refresh Token:', REFRESH_TOKEN?.substring(0, 20) + '...\n');

async function testAuth() {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    console.log('📧 Testing Gmail API access...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Try to get the user profile
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log('✅ Authentication successful!');
    console.log('   Email:', profile.data.emailAddress);
    console.log('   Messages total:', profile.data.messagesTotal);
    console.log('\n✅ Gmail API is working correctly!\n');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n📝 This error suggests:');
    console.error('   1. The OAuth client may not be authorized for Gmail API');
    console.error('   2. The client credentials may be from a different Google Cloud project');
    console.error('   3. The Gmail API may not be enabled for this project\n');
    console.error('🔧 To fix:');
    console.error('   1. Go to: https://console.cloud.google.com/apis/credentials');
    console.error('   2. Ensure the OAuth 2.0 Client ID matches:', CLIENT_ID);
    console.error('   3. Check that Gmail API is enabled: https://console.cloud.google.com/apis/library/gmail.googleapis.com');
    console.error('   4. Verify the refresh token was generated using this exact client ID\n');
  }
}

testAuth();
