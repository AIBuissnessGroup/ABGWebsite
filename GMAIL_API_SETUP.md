# Gmail API Setup for Email Notifications

Since Digital Ocean blocks SMTP ports (25, 587, 465), we use Gmail API with OAuth2 instead.

## Step 1: Enable Gmail API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Gmail API:
   - Go to **APIs & Services** > **Library**
   - Search for "Gmail API"
   - Click **Enable**

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **ABG Website Notifications**
   - User support email: **ContactABG@umich.edu**
   - Developer contact: **ContactABG@umich.edu**
   - Add scope: `https://mail.google.com/` (full Gmail access)
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **ABG Email Service**
   - Authorized redirect URIs: Add `https://developers.google.com/oauthplayground`
5. Save the **Client ID** and **Client Secret**

## Step 3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the **Settings** gear icon (top right)
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In the left sidebar, find **Gmail API v1**
6. Select: `https://mail.google.com/` (full access)
7. Click **Authorize APIs**
8. Sign in with the **notificationsabg@gmail.com** account
9. Click **Allow** to grant permissions
10. Click **Exchange authorization code for tokens**
11. Copy the **Refresh token** (you'll need this!)

## Step 4: Add Environment Variables

Add these to your `.env.local` (local) and production `.env`:

```env
# Gmail API OAuth2 Credentials
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REFRESH_TOKEN=your-refresh-token-here
GMAIL_USER_EMAIL=notificationsabg@gmail.com

# Reply-to email (MCommunity)
SMTP_REPLY_TO_EMAIL=ContactABG@umich.edu

# Keep this for backward compatibility
SMTP_FROM_EMAIL=notificationsabg@gmail.com
```

## Step 5: Test Locally

1. Make sure all environment variables are set
2. Run the dev server: `npm run dev`
3. Submit a form with email receipt enabled
4. Check the console logs for success/error messages

## Step 6: Deploy to Production

1. SSH into your Digital Ocean server
2. Edit `/var/www/ABGWebsite/.env` (or wherever your env file is)
3. Add the Gmail API environment variables
4. Restart the service: `systemctl restart abg-website.service`
5. Monitor logs: `journalctl -u abg-website.service -f`

## Important Notes

- The refresh token **never expires** unless explicitly revoked
- Keep your Client Secret and Refresh Token **secure**
- Gmail API has a sending limit: 500 emails/day (same as regular Gmail account)
- For production, consider adding the app to your Google Workspace for higher limits

## Troubleshooting

### "Invalid grant" error
- Your refresh token may have expired or been revoked
- Go back to OAuth Playground and generate a new refresh token

### "Access token not found"
- Check that GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are all set
- Verify the credentials are correct

### Email not sending
- Check server logs: `journalctl -u abg-website.service -f`
- Verify Gmail API is enabled in Google Cloud Console
- Check that notificationsabg@gmail.com has granted permissions

## Benefits of Gmail API over SMTP

✅ **Works on Digital Ocean** (no port blocking)  
✅ **More secure** (OAuth2 instead of app passwords)  
✅ **Better deliverability** (official Gmail API)  
✅ **Automatic token refresh** (handled by googleapis library)  
✅ **Same Gmail account** (notificationsabg@gmail.com)
