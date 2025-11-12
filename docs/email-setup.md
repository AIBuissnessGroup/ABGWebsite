# Email Notification Setup Guide

## Important: Digital Ocean SMTP Restrictions

**⚠️ Digital Ocean blocks outbound SMTP traffic on ports 25, 587, and 465 by default.**

This is to prevent spam and abuse. If you're hosting on Digital Ocean, you **cannot** use standard SMTP servers without special configuration. You must use one of the email service providers listed below.

## Recommended Email Providers for Digital Ocean

### Option 1: SendGrid (Recommended) ⭐

**Why SendGrid?**
- ✅ Free tier: 100 emails/day
- ✅ Works perfectly on Digital Ocean
- ✅ Easy to set up (just an API key)
- ✅ Reliable delivery and good reputation
- ✅ Detailed analytics and delivery monitoring

**Setup Steps:**

1. Create a SendGrid account at https://sendgrid.com/
2. Verify your email address
3. Create an API Key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Enable "Mail Send" permission
   - Copy the API key (you won't see it again!)

4. Add to your `.env` file:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
   SMTP_FROM_EMAIL=your-email@abgumich.org
   SMTP_REPLY_TO_EMAIL=your-reply-email@umich.edu
   ```

5. (Optional) Set up domain authentication:
   - Go to Settings → Sender Authentication
   - Authenticate your domain for better deliverability
   - Add the provided DNS records to your domain

**Testing:**
```bash
# Run the test script
npm run test:email
```

### Option 2: Gmail with App Password

**Good for:** Development, testing, or very low volume (< 500 emails/day)

**Setup Steps:**

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a password for "Mail" on "Other device"

3. Add to your `.env` file:
   ```env
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_REPLY_TO_EMAIL=your-reply-email@umich.edu
   ```

**Limitations:**
- Maximum 500 emails per day
- May trigger Gmail's spam filters if sending too quickly
- Not recommended for production

### Option 3: AWS SES (For High Volume)

**Good for:** High volume sending, cost-effective at scale

**Setup Steps:**

1. Create an AWS account if you don't have one
2. Go to Amazon SES in the AWS Console
3. Request production access (starts in sandbox mode)
4. Verify your sending domain or email addresses
5. Create SMTP credentials:
   - Go to SMTP Settings
   - Create SMTP credentials
   - Note the username and password

6. Add to your `.env` file:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   SMTP_FROM_EMAIL=your-email@abgumich.org
   SMTP_REPLY_TO_EMAIL=your-reply-email@umich.edu
   ```

**Note:** AWS SES SMTP works on Digital Ocean because it uses authenticated connections.

### Option 4: Mailgun

**Good for:** Alternative to SendGrid with similar features

**Setup Steps:**

1. Create a Mailgun account at https://www.mailgun.com/
2. Add and verify your domain
3. Get your SMTP credentials from Domain Settings

4. Add to your `.env` file:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASSWORD=your-mailgun-password
   SMTP_FROM_EMAIL=your-email@abgumich.org
   SMTP_REPLY_TO_EMAIL=your-reply-email@umich.edu
   ```

### Option 5: Digital Ocean Managed SMTP (Business Accounts)

If you have a Digital Ocean business account, you can request to enable SMTP:

1. Contact Digital Ocean support
2. Explain your legitimate use case
3. They may enable SMTP on your droplet

Once enabled, use standard SMTP configuration:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@abgumich.org
SMTP_REPLY_TO_EMAIL=your-reply-email@umich.edu
```

## Environment Variables Reference

### Required Variables (All Providers)

```env
# The email address that emails will be sent FROM
SMTP_FROM_EMAIL=notifications@abgumich.org

# (Optional) The email address where replies will go
# If not set, replies go to SMTP_FROM_EMAIL
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

### SendGrid Configuration

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=notifications@abgumich.org
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

### Gmail Configuration

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

### Direct SMTP Configuration

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_SECURE=false
SMTP_FROM_EMAIL=notifications@abgumich.org
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

## Testing Your Email Configuration

### Method 1: Using the test script

Create a test script to verify your email setup:

```bash
# Create and run the test
node scripts/test-email.js
```

### Method 2: Test through the application

1. Make sure your email configuration is in `.env`
2. Start the development server: `npm run dev`
3. Submit a test form with email receipts enabled
4. Check the console for email logs
5. Check your inbox for the receipt

### Method 3: Check logs in production

```bash
# SSH into your server
ssh root@159.89.229.112

# Check recent logs for email-related messages
sudo journalctl -u abg-website -n 100 | grep -i "email\|smtp"

# Follow logs in real-time
sudo journalctl -u abg-website -f | grep -i "email"
```

## Troubleshooting

### Emails not sending on Digital Ocean

**Symptom:** Emails work locally but not on Digital Ocean

**Solution:** You're likely hitting the SMTP port block. Switch to SendGrid:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-key-here
```

### "Authentication failed" error

**Check:**
1. Verify your API key or password is correct
2. Make sure there are no extra spaces in your `.env` file
3. For SendGrid, ensure the API key has "Mail Send" permission
4. For Gmail, ensure you're using an App Password, not your regular password

### "Connection timeout" error

**This usually means:**
1. The SMTP port is blocked (common on Digital Ocean)
2. The SMTP host is incorrect
3. A firewall is blocking the connection

**Solution:** Use SendGrid or another email service provider that works on Digital Ocean

### Emails going to spam

**Improve deliverability:**
1. Set up domain authentication (SPF, DKIM, DMARC)
2. Use a verified sending domain
3. Don't send too many emails too quickly
4. Include proper unsubscribe links
5. Avoid spam trigger words in subject lines

### Rate limiting errors

**Different providers have different limits:**
- Gmail: 500/day
- SendGrid Free: 100/day
- SendGrid Essentials: 40,000/month ($15/mo)
- AWS SES: 62,000/month (free tier)

**Solution:** Upgrade your plan or switch to a provider with higher limits

## Migration Guide

### Migrating from direct SMTP to SendGrid

1. Create SendGrid account and get API key
2. Update `.env` file:
   ```env
   # OLD (commented out)
   # EMAIL_PROVIDER=smtp
   # SMTP_HOST=old-smtp-server.com
   # SMTP_USER=old-user
   # SMTP_PASSWORD=old-password
   
   # NEW
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your-new-key
   ```

3. Test the configuration
4. Deploy to production:
   ```bash
   # SSH to server
   ssh root@159.89.229.112
   cd /var/www/ABGWebsite
   
   # Update .env file
   sudo nano .env
   # Add the new EMAIL_PROVIDER and SENDGRID_API_KEY lines
   
   # Restart the service
   sudo systemctl restart abg-website
   
   # Check logs
   sudo journalctl -u abg-website -f
   ```

5. Submit a test form to verify emails are working

## Best Practices

### Security
- ✅ Never commit `.env` files to git
- ✅ Use different API keys for development and production
- ✅ Rotate API keys periodically
- ✅ Use restricted API keys with minimum required permissions
- ✅ Store production keys securely (use a password manager)

### Monitoring
- ✅ Check email delivery logs regularly
- ✅ Monitor bounce rates
- ✅ Set up alerts for failed deliveries
- ✅ Keep track of sending volumes

### Email Content
- ✅ Include unsubscribe options (for marketing emails)
- ✅ Use clear, descriptive subject lines
- ✅ Include both HTML and plain text versions
- ✅ Test emails on multiple email clients
- ✅ Include contact information for support

## Support

If you continue to have issues:

1. Check the application logs: `sudo journalctl -u abg-website -n 100`
2. Review the SendGrid/provider dashboard for delivery issues
3. Ask in #tech-committee Slack channel
4. Contact Tech Lead for production access

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Digital Ocean SMTP Policy](https://docs.digitalocean.com/support/how-can-i-send-email-from-a-droplet/)
- [Email Deliverability Guide](https://sendgrid.com/blog/email-deliverability/)
