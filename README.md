# ABG Website Architecture Overview
**Tech Committee Onboarding Presentation**

---

## 📋 Table of Contents
1. Tech Stack Overview
2. Project Structure
3. Key Technologies
4. Database & Authentication
5. Deployment Architecture
6. Development Workflow

---

## 🛠 Tech Stack Overview

### Core Technologies
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB (hosted on Railway) with GridFS for file storage
- **Authentication**: NextAuth.js (Google OAuth)
- **Deployment**: Railway (Containerized Docker Environment)

### Scale
- **Production website**: https://abgumich.org

---

## 📁 Project Structure

```text
ABGWebsite/
├── src/
│   ├── app/          # Next.js App Router pages & API routes
│   ├── components/   # Reusable React components
│   ├── lib/          # Utilities, helpers, MongoDB and GridFS config
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript type definitions
├── public/           # Static assets (images, icons)
├── scripts/          # Build and utility scripts
├── instrumentation.ts# Background workers (Cron jobs for emails & token refresh)
├── middleware.ts     # Next.js middleware (auth/routing)
└── Configuration files (next.config.js, tailwind.config.js, Dockerfile, etc.)
```

---

## 🔑 Key Technologies Explained

### Next.js App Router (v15)
- **Server Components**: Faster page loads, better SEO, zero client-side JavaScript by default
- **API Routes**: Backend endpoints in `/src/app/api/`
- **File-based Routing**: Each folder in `/src/app/` becomes a route

### TypeScript
- Type safety catches bugs before runtime
- Better IDE support and autocomplete
- Self-documenting code

### Tailwind CSS
- Utility-first CSS framework
- Responsive design built-in
- Consistent styling across components

---

## 🔐 Database & Authentication

### MongoDB & GridFS
- **Hosting**: Hosted seamlessly on Railway
- **Connection**: Accessed via `MONGODB_URI` environment variable
- **File Storage**: Instead of local file storage, we use **MongoDB GridFS** (`src/lib/gridfs.ts`) to stream and store large files like resumes and audio recordings directly within the database. This ensures files survive container redeployments.

### NextAuth.js
- Google OAuth integration for UMich emails
- Session management and Protected routes via middleware
- Admin role system based on configured admin emails

### Security Features
- Environment variables for sensitive data (OAuth, Slack, API keys)
- Server-side authentication checks
- Separate dev/prod credentials via `.env.local`

---

## 🚀 Deployment Architecture

### Production Setup (Railway)
The entire application is deployed continuously via **Railway**. We use a containerized approach defined by our `Dockerfile`.

```text
GitHub (main branch) → Railway Builder → Docker Container (Node.js) → MongoDB Plugin (GridFS)
```

### Components
- **Railway**: Handles SSL/TLS, custom domains, automated builds, and zero-downtime deployments.
- **Docker**: The app is built into a standalone Next.js image to minimize runtime size.
- **Background Jobs**: Processes like scheduled emails and Gmail OAuth token refreshing are handled directly inside the Next.js process via `instrumentation.ts`, completely eliminating the need for external tools like PM2 or SystemD.

---

## 💻 Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables (`.env.local`)
4. Run dev server: `npm run dev`
5. Access at `http://localhost:3001`

### Making Changes
1. Create feature branch
2. Make changes locally
3. Test thoroughly
4. Commit and push to GitHub
5. Create a Pull Request against `main`
6. After review: merge PR

### Deployment Process
- Code merged to the `main` branch automatically triggers a new build on Railway.
- **No SSH access required.** Railway handles the build, routing, and zero-downtime container swap automatically!

---

## 🎯 Key Features to Know

### Current Functionality
- **User Authentication**: Google OAuth for UMich students
- **Event Management**: Creating, viewing, and signing up for events
- **Application System**: Recruitment and application forms with resume uploads (GridFS)
- **Admin Dashboard**: Special access for leadership with audio recording reviews (GridFS)
- **Member Directory**: User profiles and information
- **Automated Emails**: Integrated with Gmail API for automated receipt sending

### Integrations
- Google Gmail API & OAuth
- Slack Webhooks
- Twilio SMS
- OpenAI
- MongoDB GridFS

---

## 🔧 System Management (For Lead Members)

Gone are the days of SSHing into Linux servers. All system management is done via the **Railway Dashboard**:

- **View Live Logs**: Check the "Deployments" tab in Railway to see real-time container logs.
- **Restart Services**: Use the "Restart" button on the Railway project dashboard.
- **Environment Variables**: Managed securely in the Railway "Variables" tab.
- **Database Management**: View and query the database using **MongoDB Compass** by connecting to the Railway external database URL.

---

## 📚 Resources for Contributors

### Recommended Learning Path
1. React fundamentals
2. Next.js App Router basics
3. TypeScript basics
4. Tailwind CSS utilities
5. Using AI tools (ChatGPT, GitHub Copilot) for development

### Tools You'll Use
- **VS Code** - Code editor (recommended)
- **Git** - Version control
- **MongoDB Compass** - Database GUI (Lead Members)
- **Railway Dashboard** - Infrastructure monitoring (Lead Members)

---

## 🏗 Development vs Lead Member Tracks

### Focused Contributors (Option A):
- Work on specific features locally
- Push to GitHub for review
- Use local/development database
- Focus on coding and learning

### Lead Members (Option B):
- Railway Dashboard access
- Monitor production deployments and logs
- Code reviews and mentorship
- Database management via MongoDB Compass

---

## 💡 Key Takeaways

1. **Railway manages production** - No more SystemD or SSH access. Commits to `main` auto-deploy.
2. **GridFS manages files** - Because containers are ephemeral, all uploaded files are safely stored in MongoDB.
3. **Background jobs are native** - Handled in `instrumentation.ts`.
4. **AI-assisted development** - Use ChatGPT/Copilot to help code!
5. **Ask for help** - Tech Leads are here to support you.

---

**Welcome to the ABG Tech Committee! 🎉**

Questions? Reach out on Slack: #tech-committee
