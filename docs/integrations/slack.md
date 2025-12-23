# Slack integration setup

The forms admin console can route notifications to both a classic Slack webhook URL and to specific channels or users through a bot token. Use this guide to wire everything together in your local `.env.local` and production deployment.

## 1. Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SLACK_WEBHOOK_URL` | ✅ | Legacy webhook used for the default broadcast notification when a submission is received. |
| `SLACK_BOT_TOKEN` | ✅ (for targeted recipients) | Bot token used to look up channels/users from the admin console and send DMs or channel messages for each form. |
| `NEXTAUTH_URL` | ✅ | Used to generate absolute links in Slack messages (e.g., the *Open submission* button). |
| `ABG_GOOGLE_CLIENT_ID`, `ABG_GOOGLE_CLIENT_SECRET` | ✅ | Required for admin authentication so the console can load Slack targets. |

Add both Slack variables to your `.env.local`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/.../...
SLACK_BOT_TOKEN=xoxb-############################
```

Never commit the actual token or webhook URL to the repository.

## 2. Install the Slack app and scopes

1. Create a Slack app inside your workspace (or reuse an existing one).
2. Under **OAuth & Permissions**, add the following bot scopes so the new admin UI can search for targets and deliver notifications:
   - `chat:write`
   - `im:write`
   - `conversations:read`
   - `users:read`
3. Install the app to your workspace and copy the **Bot User OAuth Token** (`xoxb-...`). Paste this value into `SLACK_BOT_TOKEN`.

The legacy webhook can remain active so teams that rely on the global broadcast continue to receive updates.

## 3. Testing locally

After updating `.env.local`, restart `npm run dev` so Next.js reloads the environment variables. You can dry-run Slack delivery with:

```bash
npm run test:slack
```

The script reads `.env.local`, sends a simple webhook message, and exercises the new targeted notification path. If the targeted message fails, the script logs detailed Slack API errors so you can adjust scopes or permissions without digging into production logs.

## 4. Troubleshooting checklist

- **No channels or users in the admin console?** Confirm the bot token has `conversations:read` and `users:read` and that the app is installed in the workspace.
- **Webhook notification missing?** Double-check `SLACK_WEBHOOK_URL` and that the incoming webhook app is still active.
- **Targeted DM fails?** Ensure the bot has access to message the user (some workspaces block unsolicited DMs) and that `im:write` is granted.
- **Links point to the wrong host?** Set `NEXTAUTH_URL` to match the environment (e.g., `http://localhost:3001` while developing).

Keeping these variables in sync across environments lets the rebuilt admin console mirror the Google Forms experience while keeping stakeholders in the loop via Slack.
