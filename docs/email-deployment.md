# Quick Deployment Guide: Email Configuration

This guide helps you deploy the email notification system to Digital Ocean.

## Pre-Deployment Checklist

- [ ] Created SendGrid account (recommended)
- [ ] Generated SendGrid API key
- [ ] Verified sender email address
- [ ] Tested email configuration locally
- [ ] Updated production `.env` file

## Step-by-Step Deployment

### 1. Test Locally First

Before deploying to production, test your email configuration locally:

```bash
# Make sure your .env.local has the email settings
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-test-key
SMTP_FROM_EMAIL=test@example.com

# Run the test script
npm run test:email
```

If the test passes, you're ready to deploy.

### 2. SSH into Digital Ocean Server

```bash
ssh root@159.89.229.112
```

### 3. Navigate to Project Directory

```bash
cd /var/www/ABGWebsite
```

### 4. Pull Latest Changes

```bash
git pull origin main
```

### 5. Update Environment Variables

```bash
sudo nano .env
```

Add or update these lines:

```env
# Email Configuration (Digital Ocean Compatible)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-production-api-key-here
SMTP_FROM_EMAIL=notifications@abgumich.org
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

**Important:** 
- Use your **production** SendGrid API key (not test key)
- Make sure FROM_EMAIL is verified in SendGrid
- Save and exit (Ctrl+X, then Y, then Enter)

### 6. Install Dependencies (if needed)

```bash
npm install --production
```

### 7. Build the Application

```bash
npm run build
```

### 8. Restart the Service

```bash
sudo systemctl restart abg-website
```

### 9. Verify Service is Running

```bash
# Check service status
sudo systemctl status abg-website

# Should show "active (running)" in green
```

### 10. Check Logs for Email Configuration

```bash
# View recent logs
sudo journalctl -u abg-website -n 50 --no-pager

# Look for email-related messages like:
# "📧 Using SendGrid email provider"
```

### 11. Test in Production

1. Go to your website
2. Submit a test form that has email receipts enabled
3. Check the logs:
   ```bash
   sudo journalctl -u abg-website -f | grep -i "email"
   ```
4. Look for success messages like:
   ```
   📧 Attempting to send email receipt...
   ✅ Email sent successfully!
   ```

### 12. Verify Email Delivery

- Check the recipient's inbox
- If not in inbox, check spam folder
- Check SendGrid dashboard for delivery status

## Troubleshooting Production Issues

### Issue: Service won't start after restart

```bash
# Check for errors
sudo journalctl -u abg-website -n 100 --no-pager | grep -i error

# Common causes:
# - Syntax error in .env file
# - Missing required environment variables
# - Build failed
```

**Solution:**
```bash
# Verify .env syntax (no spaces around =)
cat .env | grep EMAIL

# Make sure all required vars are set
cat .env | grep -E "EMAIL_PROVIDER|SENDGRID_API_KEY|SMTP_FROM_EMAIL"
```

### Issue: Emails not being sent

```bash
# Watch logs in real-time while testing
sudo journalctl -u abg-website -f

# Then submit a test form in another window
```

**Check for these messages:**
- ❌ "SMTP_HOST is not configured" → Set EMAIL_PROVIDER=sendgrid
- ❌ "SENDGRID_API_KEY is not configured" → Add your API key
- ⚠️  "WARNING: Digital Ocean blocks outbound SMTP" → Switch to SendGrid
- ✅ "Email sent successfully!" → Working correctly

### Issue: "Invalid API key" error

**Solution:**
1. Verify API key in SendGrid dashboard
2. Make sure it has "Mail Send" permission
3. Check for extra spaces in .env file
4. Regenerate API key if needed

### Issue: Emails going to spam

**Solutions:**
1. Set up domain authentication in SendGrid:
   - Go to Settings → Sender Authentication
   - Add DNS records to your domain
   
2. Verify sender email address

3. Check email content for spam triggers

## Rolling Back (If Needed)

If something goes wrong:

```bash
# Check last working commit
git log --oneline -5

# Rollback to previous commit
git checkout [previous-commit-hash]

# Rebuild
npm run build

# Restart
sudo systemctl restart abg-website
```

## Post-Deployment Verification

After deployment, verify everything is working:

- [ ] Service is running: `sudo systemctl status abg-website`
- [ ] No errors in logs: `sudo journalctl -u abg-website -n 50`
- [ ] Website is accessible: `curl -I https://abgumich.org`
- [ ] Test form submission with email receipt
- [ ] Verify email received
- [ ] Check SendGrid dashboard for delivery stats

## Monitoring

Keep an eye on:

1. **Service logs** (daily):
   ```bash
   sudo journalctl -u abg-website -p err --since today
   ```

2. **SendGrid dashboard**:
   - Delivery rates
   - Bounce rates
   - Spam reports
   - API usage

3. **Email sending limits**:
   - Free tier: 100/day
   - Watch for approaching limits

## Getting Help

If you encounter issues:

1. Check logs: `sudo journalctl -u abg-website -n 100`
2. Review [docs/email-setup.md](./email-setup.md)
3. Ask in #tech-committee Slack
4. Check SendGrid documentation
5. Contact Tech Lead

## Summary

✅ **Success indicators:**
- Service shows "active (running)"
- No email errors in logs
- Test emails received
- SendGrid shows successful deliveries

❌ **Failure indicators:**
- Service failed to start
- "Connection timeout" errors
- "Invalid API key" errors
- Emails not received

Remember: Always test locally before deploying to production!
