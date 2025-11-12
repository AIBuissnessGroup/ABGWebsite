#!/usr/bin/env node

/**
 * Gmail API Setup Helper
 * 
 * This script helps you set up Gmail API credentials for the email notification system.
 * Run this after following the steps in GMAIL_API_SETUP.md
 */

console.log('\n📧 Gmail API Setup Helper\n');
console.log('This will help you configure Gmail API for email notifications.\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  {
    key: 'GMAIL_CLIENT_ID',
    prompt: 'Enter your Gmail API Client ID:\n(e.g., 123456789-abc.apps.googleusercontent.com)\n> '
  },
  {
    key: 'GMAIL_CLIENT_SECRET',
    prompt: '\nEnter your Gmail API Client Secret:\n(e.g., GOCSPX-abc123...)\n> '
  },
  {
    key: 'GMAIL_REFRESH_TOKEN',
    prompt: '\nEnter your Gmail API Refresh Token:\n(Get from https://developers.google.com/oauthplayground)\n> '
  },
  {
    key: 'GMAIL_USER_EMAIL',
    prompt: '\nEnter the Gmail address to send from:\n(default: notificationsabg@gmail.com)\n> ',
    default: 'notificationsabg@gmail.com'
  },
  {
    key: 'SMTP_REPLY_TO_EMAIL',
    prompt: '\nEnter the reply-to email address:\n(default: ContactABG@umich.edu)\n> ',
    default: 'ContactABG@umich.edu'
  }
];

const answers = {};
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion >= questions.length) {
    generateEnvFile();
    readline.close();
    return;
  }

  const q = questions[currentQuestion];
  readline.question(q.prompt, (answer) => {
    answers[q.key] = answer.trim() || q.default || '';
    currentQuestion++;
    askQuestion();
  });
}

function generateEnvFile() {
  console.log('\n\n✅ Configuration complete!\n');
  console.log('Add these lines to your .env file:\n');
  console.log('# Gmail API Configuration');
  
  for (const [key, value] of Object.entries(answers)) {
    console.log(`${key}=${value}`);
  }
  
  console.log('\n\n📝 Next steps:');
  console.log('1. Copy the lines above to your .env.local file');
  console.log('2. For production, add them to your server\'s .env file');
  console.log('3. Test by submitting a form with email receipts enabled');
  console.log('4. Check logs with: journalctl -u abg-website.service -f\n');
  
  console.log('📖 For detailed setup instructions, see GMAIL_API_SETUP.md\n');
}

// Start the questionnaire
console.log('Before running this, make sure you\'ve:');
console.log('1. ✓ Enabled Gmail API in Google Cloud Console');
console.log('2. ✓ Created OAuth 2.0 credentials');
console.log('3. ✓ Generated a refresh token using OAuth Playground\n');
console.log('See GMAIL_API_SETUP.md for detailed instructions.\n');

readline.question('Ready to continue? (y/n) > ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n');
    askQuestion();
  } else {
    console.log('\nSetup cancelled. Run this script when you\'re ready!\n');
    readline.close();
  }
});
