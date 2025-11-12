# Digital Ocean Email Blocking - Summary

## Question
**Would Digital Ocean block the new email notification system the way it's setup?**

## Answer
**YES - Digital Ocean WOULD block the original email setup.**

## Why?

Digital Ocean blocks outbound SMTP traffic on ports 25, 587, and 465 by default to prevent spam and abuse. The original email notification system in this repository used nodemailer with direct SMTP connections, which would fail on Digital Ocean droplets.

## The Problem

The original implementation in `src/lib/email.ts` was configured as:

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,  // Port 587 is BLOCKED on Digital Ocean
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user, pass }
});
```

This configuration attempts to make outbound SMTP connections on port 587 (or 25/465), which Digital Ocean blocks.

## The Solution

We've updated the email system to support multiple email service providers that work on Digital Ocean:

### ✅ Recommended: SendGrid
- Uses authenticated SMTP that bypasses Digital Ocean's blocks
- Free tier: 100 emails/day
- Simple API key authentication
- Reliable delivery

### ✅ Alternative: Gmail
- Good for development/testing
- Limit: 500 emails/day
- Requires app password

### ✅ Alternative: AWS SES
- Cost-effective for high volume
- Works on Digital Ocean with authenticated SMTP

## How to Fix

### Quick Fix (Recommended)

1. Sign up for SendGrid at https://sendgrid.com/
2. Create an API key with "Mail Send" permission
3. Update your `.env` file:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key-here
SMTP_FROM_EMAIL=notifications@abgumich.org
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

4. Test it: `npm run test:email`
5. Deploy to production following `docs/email-deployment.md`

### What Changed

The `getTransporter()` function in `src/lib/email.ts` now:

1. Checks `EMAIL_PROVIDER` environment variable
2. Configures the appropriate provider (SendGrid, Gmail, or SMTP)
3. Shows warnings if using direct SMTP on Digital Ocean
4. Uses authenticated connections that bypass port blocks

## Digital Ocean's Policy

From Digital Ocean's documentation:

> "To prevent spam and abuse, we block outbound connections on ports 25, 587, and 465 (SMTP) on all droplets."

### Exceptions
- Business accounts can request SMTP to be enabled
- Must provide legitimate use case
- Not guaranteed to be approved

## Technical Details

### Why SendGrid Works on Digital Ocean

SendGrid's SMTP relay uses:
- **Port 587** (same as blocked ports)
- **But with API key authentication** instead of username/password
- Digital Ocean allows authenticated mail services
- Connection is verified as legitimate, not spam

### The Code Change

**Before (Blocked):**
```typescript
// Direct SMTP - BLOCKED on Digital Ocean
nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,  // BLOCKED!
  auth: { user: 'username', pass: 'password' }
})
```

**After (Works):**
```typescript
// SendGrid - WORKS on Digital Ocean
nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,  // Same port, but authenticated!
  auth: { 
    user: 'apikey',  // Literal string 'apikey'
    pass: 'SG.your-api-key'  // SendGrid API key
  }
})
```

## Testing

To verify your email setup works:

```bash
# Local testing
npm run test:email

# Production testing
1. SSH into server
2. Submit a test form
3. Check logs: sudo journalctl -u abg-website -f | grep -i email
4. Verify email received
```

## Documentation

Complete guides available:

- **Setup Guide**: `docs/email-setup.md` - How to configure each provider
- **Deployment Guide**: `docs/email-deployment.md` - Production deployment steps
- **Environment Template**: `.env.example` - All configuration options

## Summary

| Setup | Works on Digital Ocean? | Cost | Volume Limit |
|-------|------------------------|------|--------------|
| Direct SMTP | ❌ No (blocked) | Varies | Varies |
| SendGrid | ✅ Yes | Free/Paid | 100+/day |
| Gmail | ✅ Yes | Free | 500/day |
| AWS SES | ✅ Yes | Pay as you go | High |

**Recommendation:** Use SendGrid for production on Digital Ocean.

## Action Items

For immediate fix:

- [ ] Review `docs/email-setup.md`
- [ ] Sign up for SendGrid
- [ ] Get API key
- [ ] Update `.env` with SendGrid config
- [ ] Test locally: `npm run test:email`
- [ ] Deploy to production
- [ ] Submit test form to verify

## Additional Resources

- [Digital Ocean SMTP Policy](https://docs.digitalocean.com/support/how-can-i-send-email-from-a-droplet/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [This Repository's Email Setup Guide](./email-setup.md)

---

**Last Updated:** November 12, 2024
**Status:** ✅ Implemented and Documented
