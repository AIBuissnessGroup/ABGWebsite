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
- **Deployment**: Digital Ocean Droplet with Nginx

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

### NextAuth.js
- Google OAuth integration for UMich emails
- Session management
- Protected routes via middleware
- Admin role system (12 admin emails configured)

### Security Features
- IP-restricted database access
- Environment variables for sensitive data
- Server-side authentication checks

---

## 🚀 Deployment Architecture

### Production Setup (Digital Ocean)
```
Internet → Nginx (Reverse Proxy) → Next.js App (Port 3001) → MongoDB
                                         
                                    
```

### Components
- **Nginx**: Handles SSL/TLS, serves static files, reverse proxy
- **Next.js**: Built for production (`npm run build`)

### Key Files
- `nginx.conf` - Nginx configuration
- `ecosystem.config.js` - PM2 configuration
- `abg-website.service` - SystemD service file

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
- Pull latest changes
- Run `npm run build`
- Restart PM2: `pm2 restart ecosystem.config.js`

---

## 🎯 Key Features to Know

### Current Functionality (Based on Structure)
- **User Authentication**: Google OAuth for UMich students
- **Event Management**: Creating, viewing, and signing up for events
- **Application System**: Recruitment and application forms
- **Admin Dashboard**: Special access for leadership
- **Member Directory**: User profiles and information
- **Analytics**: Google Analytics tracking

---

## 📚 Resources for Contributors

### Essential Links
- **Repository**: AIBuissnessGroup/ABGWebsite
- **Production Site**: https://abgumich.org
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

### Recommended Learning Path
1. React fundamentals (if new)
2. Next.js App Router basics
3. TypeScript basics
4. Tailwind CSS utilities
5. Using AI tools (Copilot) for development

---

## ❓ Questions?
- Slack workspace for real-time communication
- GitHub Issues for bug reports and feature requests
- Weekly Tech Committee meetings
