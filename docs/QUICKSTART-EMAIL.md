# Quick Start: Email Notifications on Digital Ocean

**For Tech Leads deploying to Digital Ocean**

## TL;DR

Digital Ocean blocks standard SMTP. Use SendGrid instead. It takes 5 minutes to set up.

## 3-Step Setup

### 1. Get SendGrid API Key (2 minutes)

1. Go to https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Navigate to: Settings → API Keys → Create API Key
4. Choose "Restricted Access" → Enable "Mail Send" → Create
5. Copy the API key (starts with `SG.`)

### 2. Update Environment Variables (1 minute)

**Local (`.env.local`):**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.paste-your-key-here
SMTP_FROM_EMAIL=notifications@abgumich.org
SMTP_REPLY_TO_EMAIL=abg-team@umich.edu
```

**Production (on server):**
```bash
ssh root@159.89.229.112
cd /var/www/ABGWebsite
sudo nano .env
# Add the same 4 lines above
# Save: Ctrl+X, Y, Enter
```

### 3. Test and Deploy (2 minutes)

**Test locally:**
```bash
npm run test:email
```

**Deploy to production:**
```bash
# Already SSH'd into server
npm install --production
npm run build
sudo systemctl restart abg-website
sudo journalctl -u abg-website -f | grep -i email
```

## Verify It's Working

1. Submit a test form with email receipts enabled
2. Check logs: `sudo journalctl -u abg-website -f`
3. Look for: `✅ Email sent successfully!`
4. Check recipient's inbox

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Service won't start | Check `.env` syntax (no spaces around `=`) |
| "Invalid API key" | Verify key in SendGrid, check for typos |
| Emails not sending | Make sure `EMAIL_PROVIDER=sendgrid` is set |
| Emails in spam | Set up domain authentication in SendGrid |

## What Changed?

**Before:** Used direct SMTP (blocked by Digital Ocean)
**After:** Uses SendGrid's authenticated SMTP (works on Digital Ocean)

The code in `src/lib/email.ts` now supports multiple providers. No changes needed to form submission code.

## Why Does This Work?

- Digital Ocean blocks **unauthenticated** SMTP on ports 25, 587, 465
- SendGrid uses **authenticated** SMTP with API keys
- This bypasses Digital Ocean's block
- Same port (587), different authentication method

## Need More Details?

- **Full setup guide**: `docs/email-setup.md`
- **Deployment guide**: `docs/email-deployment.md`
- **Question answer**: `docs/digital-ocean-email-blocking.md`

## Commands Cheat Sheet

```bash
# Test email locally
npm run test:email

# SSH to server
ssh root@159.89.229.112

# Edit production env
cd /var/www/ABGWebsite
sudo nano .env

# Deploy changes
git pull origin main
npm install --production
npm run build
sudo systemctl restart abg-website

# Check status
sudo systemctl status abg-website

# View logs
sudo journalctl -u abg-website -f

# Filter email logs
sudo journalctl -u abg-website -f | grep -i email
```

## Production Checklist

- [ ] SendGrid account created
- [ ] API key generated
- [ ] `.env` updated on server
- [ ] Code deployed and built
- [ ] Service restarted
- [ ] Test email sent and received
- [ ] Logs show success messages

## Support

- Check logs first: `sudo journalctl -u abg-website -n 100`
- Ask in #tech-committee Slack
- Review full docs in `docs/` folder

---

**Time to complete:** ~5 minutes
**Cost:** Free (SendGrid free tier)
**Effort:** Low
**Impact:** High (email notifications work!)
