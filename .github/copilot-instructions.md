# ABG Website - AI Coding Instructions

## Architecture Overview

**Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + MongoDB + NextAuth.js

This is a full-stack organization website with:
- **Public pages**: Events, newsroom, recruitment, projects (`src/app/`)
- **Admin dashboard**: Role-protected management UI (`src/app/admin/`)
- **API routes**: RESTful endpoints (`src/app/api/`)

## Critical Patterns

### MongoDB Connection
Every DB connection requires TLS with the AWS RDS CA bundle:
```typescript
const client = new MongoClient(process.env.DATABASE_URL!, {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",  // Required for production
});
```
Always close connections after use. See [src/lib/auth.ts](src/lib/auth.ts) for the pattern.

### Role-Based Access Control (RBAC)
- **Role types** defined in [src/types/next-auth.d.ts](src/types/next-auth.d.ts): `USER`, `ADMIN`, `PRESIDENT`, `VP_*` roles
- **Page permissions** mapped in [src/lib/permissions.ts](src/lib/permissions.ts) - check `PAGE_PERMISSIONS` before adding admin routes
- **Protect admin pages** using `withAdminPageProtection` HOC from [src/components/admin/AdminPageProtection.tsx](src/components/admin/AdminPageProtection.tsx):
```typescript
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';
export default withAdminPageProtection(MyPage, 'events');
```

### Client vs Server Components
- Components with `'use client'` directive use React hooks and browser APIs
- Admin pages are client-side (`'use client'`) for session/auth hooks
- API routes handle server-side logic; avoid mixing DB calls in client components

### Authentication
- **Google OAuth only** via NextAuth - restricted to `@umich.edu` emails
- Admin emails configured via `ADMIN_EMAILS` env var (comma-separated)
- Session includes `user.roles[]` array - always check roles, not just email
- See [src/lib/auth.ts](src/lib/auth.ts) `authOptions` for auth flow

## Key Directories

| Path | Purpose |
|------|---------|
| `src/lib/` | Shared utilities: auth, email, slack, permissions, audit |
| `src/lib/site-content/` | CMS-like DB helpers for editable content |
| `src/components/admin/` | Admin UI components + `AdminPageProtection` HOC |
| `src/types/` | TypeScript definitions - extend `next-auth.d.ts` for session types |
| `scripts/` | CLI utilities for Gmail token refresh, Slack testing |

## External Integrations

- **Email**: Gmail API via OAuth2 ([src/lib/email.ts](src/lib/email.ts)) - tokens may expire, run `node scripts/refresh-gmail-token.js`
- **Slack**: Webhook + Bot API ([src/lib/slack.ts](src/lib/slack.ts)) - see [docs/integrations/slack.md](docs/integrations/slack.md)
- **Audit logging**: All admin actions logged to `AuditLog` collection ([src/lib/audit.ts](src/lib/audit.ts))

## Development Commands

```bash
npm run dev          # Start on port 3001 (clears .next cache first)
npm run build        # Production build
npm run clean        # Clear .next cache manually
```

## Environment Variables

Required for local dev (`.env.local`):
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS` - comma-separated admin email list
- `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN` (optional)
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (optional)

## Conventions

- Use `react-hot-toast` for notifications (already wrapped via `useAdminApi` hook)
- Admin API calls should use [src/hooks/useAdminApi.ts](src/hooks/useAdminApi.ts) for consistent error handling
- Tailwind classes only - no CSS modules or styled-components
- Icons from `@heroicons/react` and `react-icons`
- Animation via `framer-motion`

## Deployment

Production runs via Docker on Digital Ocean with Nginx reverse proxy. See [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml). Deployment flow:
1. Push to `main` branch
2. SSH to server, `git pull`, `npm install`, `npm run build`
3. `sudo systemctl restart abg-website`
