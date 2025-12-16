#!/usr/bin/env node

/**
 * Gmail API Token Refresh Helper
 * 
 * This script helps you get a new refresh token for Gmail API
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '1045234004522-ocemq7esg2135t0a6471jfnueqkia77v.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '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';
const REDIRECT_URI = 'http://localhost:3005/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/drive.file'
];

console.log('\n📧 Gmail API Token Refresh\n');
console.log('This will open a browser window for you to authorize the app.');
console.log('Make sure you\'re logged into notificationsabg@gmail.com\n');

// Create a local server to receive the OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.indexOf('/oauth2callback') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:3005').searchParams;
      const code = qs.get('code');
      
      res.end('✅ Authorization successful! You can close this window and return to the terminal.');
      
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n\n✅ Successfully obtained new tokens!\n');
      console.log('Add this to your .env.local file:\n');
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      
      if (!tokens.refresh_token) {
        console.log('⚠️  No refresh token received. This might mean:');
        console.log('   - You already have an active token for this account');
        console.log('   - Try revoking access at: https://myaccount.google.com/permissions');
        console.log('   - Then run this script again\n');
      }
      
      server.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Error during OAuth callback:', e);
    server.close();
    process.exit(1);
  }
});

server.listen(3005, async () => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token even if already granted
  });
  
  console.log('Opening browser for authorization...\n');
  console.log('If the browser doesn\'t open, visit this URL:\n');
  console.log(authorizeUrl + '\n');
  
  try {
    await open(authorizeUrl);
  } catch (err) {
    console.log('Could not open browser automatically. Please open the URL above manually.\n');
  }
});
