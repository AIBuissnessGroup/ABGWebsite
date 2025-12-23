/**
 * Test script for Slack notifications
 * Run this to verify your Slack webhook is working
 * 
 * Usage: node --loader ts-node/esm scripts/test-slack-notification.ts
 * Or add to package.json and run: npm run test-slack
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { notifyFormSubmission, notifySlack } from '../src/lib/slack';

async function testSlackNotification() {
  console.log('Testing Slack notification...');

  // Test 1: Simple notification
  console.log('\n1. Sending simple notification...');
  const simpleResult = await notifySlack({
    title: '🧪 Test Notification',
    message: 'This is a test notification from your ABG website!',
    color: 'good',
    fields: [
      { title: 'Test Field', value: 'Test Value', short: true },
      { title: 'Timestamp', value: new Date().toISOString(), short: true },
    ],
  });
  console.log('Simple notification result:', simpleResult ? '✅ Success' : '❌ Failed');

  // Test 2: Form submission notification
  console.log('\n2. Sending mock form submission notification...');
  const formResult = await notifyFormSubmission({
    formTitle: 'Test Application Form',
    formSlug: 'test-form',
    applicantName: 'John Doe',
    applicantEmail: 'johndoe@umich.edu',
    applicantPhone: '+1 (734) 555-0123',
    applicationId: '507f1f77bcf86cd799439011', // Mock MongoDB ObjectId
    responses: [
      {
        questionTitle: 'Why do you want to join ABG?',
        value: 'I am passionate about business and technology and want to connect with like-minded students.',
        questionId: 'question-1',
      },
      {
        questionTitle: 'What is your major?',
        value: 'Computer Science',
        questionId: 'question-2',
      },
      {
        questionTitle: 'Year in School',
        value: 'Junior',
        questionId: 'question-3',
      },
      {
        questionTitle: 'Resume',
        value: { fileName: 'john-doe-resume.pdf', fileSize: 102400, fileType: 'application/pdf', fileData: 'data:application/pdf;base64,mock' },
        questionId: 'question-4',
      },
      {
        questionTitle: 'Portfolio',
        value: { fileName: 'portfolio.zip', fileSize: 2048000, fileType: 'application/zip', fileData: 'data:application/zip;base64,mock' },
        questionId: 'question-5',
      },
    ],
    submissionUrl: 'https://abgumich.org/admin/forms/test-form',
  });
  console.log('Form submission notification result:', formResult ? '✅ Success' : '❌ Failed');

  // Test 3: Form submission without files
  console.log('\n3. Sending form submission without files...');
  const noFilesResult = await notifyFormSubmission({
    formTitle: 'Event Registration',
    formSlug: 'event-registration',
    applicantName: 'Jane Smith',
    applicantEmail: 'janesmith@umich.edu',
    applicationId: '507f1f77bcf86cd799439012',
    responses: [
      {
        questionTitle: 'Dietary Restrictions',
        value: 'Vegetarian',
        questionId: 'question-1',
      },
      {
        questionTitle: 'T-Shirt Size',
        value: 'Medium',
        questionId: 'question-2',
      },
      {
        questionTitle: 'Allergies',
        value: 'None',
        questionId: 'question-3',
      },
    ],
    submissionUrl: 'https://abgumich.org/admin/forms/event-registration',
  });
  console.log('No files notification result:', noFilesResult ? '✅ Success' : '❌ Failed');

  if (!simpleResult && !formResult && !noFilesResult) {
    console.log('\n⚠️  All tests failed. Please check:');
    console.log('   - Is SLACK_WEBHOOK_URL set in your .env.local?');
    console.log('   - Is the webhook URL valid?');
    console.log('   - Check your terminal for error messages');
  } else {
    console.log('\n✅ Test complete! Check your Slack channel for notifications.');
    console.log('   - Test 1: Simple notification');
    console.log('   - Test 2: Form with file attachments');
    console.log('   - Test 3: Form without files (should NOT show file section)');
  }
}

// Run the test
testSlackNotification().catch(console.error);
