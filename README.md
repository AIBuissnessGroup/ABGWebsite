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
- **Framework**: Next.js 14+ (React-based)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (hosted on Digital Ocean)
- **Authentication**: NextAuth.js (Google OAuth)
- **Deployment**: Digital Ocean Droplet with SystemD + Nginx

### Scale
- **216 files**
- **~65,000 lines of code**
- Production website: https://abgumich.org

---

## 📁 Project Structure

```
ABGWebsite/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable React components
│   ├── lib/          # Utilities and helpers
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
├── scripts/          # Build and utility scripts
├── middleware.ts     # Next.js middleware (auth/routing)
└── Configuration files (next.config.js, tailwind.config.js, etc.)
```

---

## 🔑 Key Technologies Explained

### Next.js App Router
- **Server Components**: Faster page loads, better SEO
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

### MongoDB
- Hosted on Digital Ocean (IP-restricted for security)
- Collections likely include: users, events, applications, etc.
- Connected via Mongoose or native MongoDB driver
- Two instances: Production (port 27017) and Development (port 27018)

### NextAuth.js
- Google OAuth integration for UMich emails
- Session management
- Protected routes via middleware
- Admin role system (12 admin emails configured)

### Security Features
- IP-restricted database access
- Environment variables for sensitive data
- Server-side authentication checks
- Separate dev/prod credentials

---

## 🚀 Deployment Architecture

### Production Setup (Digital Ocean)
```
Internet → Nginx (Port 80/443) → Next.js App (Port 3001) → MongoDB (Port 27017)
           (SSL/TLS)              (SystemD Service)          (Production DB)
```

### Components
- **Nginx**: Handles SSL/TLS, serves static files, reverse proxy
- **SystemD**: Manages Next.js process as a service (`abg-website.service`)
- **Next.js**: Built for production (`npm run build`)
- **MongoDB**: Database server (two instances: prod + dev)

### Key Files
- `nginx.conf` - Nginx configuration
- `abg-website.service` - SystemD service file
- `/etc/systemd/system/abg-website.service` - Service location on server

### How SystemD Works
- Automatically starts Next.js on server boot
- Auto-restarts if the application crashes
- Manages logs via `journalctl`
- Runs as a background service

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
5. Create Pull Request
6. After review: merge and deploy

### Deployment Process
- Code pushed to `main` branch
- SSH into Digital Ocean server
- Pull latest changes: `git pull origin main`
- Install dependencies: `npm install`
- Build for production: `npm run build`
- Restart service: `sudo systemctl restart abg-website`
- Verify: `sudo systemctl status abg-website`

---

## 🎯 Key Features to Know

### Current Functionality (Based on Structure)
- **User Authentication**: Google OAuth for UMich students
- **Event Management**: Creating, viewing, and signing up for events
- **Application System**: Recruitment and application forms
- **Admin Dashboard**: Special access for leadership
- **Member Directory**: User profiles and information
- **SMS Notifications**: Twilio integration for alerts
- **Analytics**: Google Analytics tracking

### Environment Integrations
- Google Forms API
- Twilio SMS
- Google OAuth
- MongoDB

---

## 🔧 System Management Commands

### Common Commands (Lead Members)
```bash
# Check service status
sudo systemctl status abg-website

# Restart the service
sudo systemctl restart abg-website

# View logs
sudo journalctl -u abg-website -n 50

# Follow logs in real-time
sudo journalctl -u abg-website -f
```

### Development vs Production

**Development Environment:**
- Runs on your local machine (`localhost:3001`)
- Uses development database (port 27018)
- Hot reload (changes appear instantly)
- Development credentials

**Production Environment:**
- Runs on Digital Ocean server
- Uses production database (port 27017)
- Managed by SystemD service
- Production credentials (secure)

---

## 📚 Resources for Contributors

### Essential Links
- **Repository**: AIBuissnessGroup/ABGWebsite
- **Production Site**: https://abgumich.org
- **Slack integration guide**: [docs/integrations/slack.md](./docs/integrations/slack.md)
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

### Recommended Learning Path
1. React fundamentals (if new)
2. Next.js App Router basics
3. TypeScript basics
4. Tailwind CSS utilities
5. Using AI tools (ChatGPT, GitHub Copilot) for development

### Tools You'll Use
- **VS Code** - Code editor (recommended)
- **Git** - Version control
- **Node.js** - JavaScript runtime
- **MongoDB Compass** - Database GUI (Lead Members)
- **Postman/Insomnia** - API testing (Lead Members)

---

## 🏗 Development vs Lead Member Tracks

### Focused Contributors (Option A):
- Work on specific features locally
- Push to GitHub for review
- No server access needed
- Use development database
- Focus on coding and learning

### Lead Members (Option B):
- Full deployment access
- Manage production server
- Code reviews and mentorship
- Database management
- DevOps responsibilities
- Strategic planning

---

## 📊 Tech Committee Structure

```
VP of Technology
    ↓
Lead Tech Committee Members (2-3)
    ↓
Focused Contributors (5-10)
```

### Roles:
- **VP Tech**: Overall strategy, infrastructure ownership
- **Lead Members**: Subproject management, code review, deployments
- **Contributors**: Feature development, bug fixes, learning

---

## ❓ Questions?
- Slack workspace for real-time communication
- GitHub Issues for bug reports and feature requests
- Weekly Tech Committee meetings
- Office hours with Tech Leads

---

## 🚀 Getting Started Checklist

### Week 1: Setup
- [ ] Install Node.js, Git, VS Code
- [ ] Clone repository
- [ ] Get `.env.local` file from Tech Lead
- [ ] Run `npm install`
- [ ] Run `npm run dev` successfully
- [ ] Join Slack workspace

### Week 2: First Contribution
- [ ] Explore codebase
- [ ] Pick first issue (assigned by Lead)
- [ ] Create feature branch
- [ ] Make changes
- [ ] Create Pull Request
- [ ] Address feedback

### Week 3+: Active Development
- [ ] Regular contributions (5-10 hrs/week)
- [ ] Attend weekly meetings
- [ ] Ask questions when stuck
- [ ] Learn and grow!

---

## 💡 Key Takeaways

1. **SystemD manages production** - Not PM2, uses systemctl commands
2. **Two environments** - Development (local) and Production (server)
3. **Two databases** - Dev (port 27018) and Prod (port 27017)
4. **AI-assisted development** - Use ChatGPT/Copilot to help code
5. **You don't need to know everything** - Learn as you go!
6. **Ask for help** - Tech Leads are here to support you

---

**Welcome to the ABG Tech Committee! 🎉**

Questions? Reach out on Slack: #tech-committee
