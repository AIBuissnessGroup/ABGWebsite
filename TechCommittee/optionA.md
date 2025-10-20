# Option A: Focused Contributor Workflow
**Working on Specific Features**

---

## 🎯 Overview
As a Focused Contributor, you'll work on specific features or improvements to the ABG website. You'll develop locally on your machine, push to GitHub, and changes will be deployed to production.

---

## 🚀 Getting Started

### Step 1: Initial Setup (One-time)
1. **Install Required Software**
   - Node.js (v18 or higher): https://nodejs.org/
   - Git: https://git-scm.com/
   - VS Code (recommended): https://code.visualstudio.com/

2. **Clone the Repository**
   ```bash
   git clone https://github.com/AIBuissnessGroup/ABGWebsite.git
   cd ABGWebsite
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Request Environment Variables**
   - Contact Tech Lead (via Slack)
   - You'll receive a `.env.local` file with development credentials
   - Place this file in the root directory (never commit this file!)

5. **Verify Setup**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3001
   - You should see the ABG website running locally

---

## 🔐 Environment Variables Setup

You'll receive a **development environment file** that looks like this:

```env
# Development Database (Read-only or Development Instance)
DATABASE_URL="mongodb://[dev-credentials-here]"
MONGODB_URI="mongodb://[dev-credentials-here]"

# Auth Configuration
NEXTAUTH_SECRET="abg-secret-key-123"
NEXTAUTH_URL="http://localhost:3001"

# Google OAuth (Development Credentials)
GOOGLE_CLIENT_SECRET="[dev-secret]"
GOOGLE_CLIENT_ID="[dev-client-id]"

# Analytics (Development)
NEXT_PUBLIC_GA_MEASUREMENT_ID="[dev-or-none]"

# Admin Emails (Your email will be added for testing)
ADMIN_EMAILS="your-email@umich.edu"

# Twilio (Development Mode or Disabled)
TWILIO_ACCOUNT_SID="[dev-or-test]"
TWILIO_AUTH_TOKEN="[dev-or-test]"
TWILIO_PHONE_NUMBER="[dev-or-test]"

# Application Deadline
NEXT_PUBLIC_APPLICATION_DEADLINE="2025-09-22T23:59:00-04:00"
```

**Important Notes:**
- Development database will have limited/test data
- SMS features may be disabled in development
- OAuth will work for localhost:3001
- Never commit `.env.local` to GitHub

---

## 📋 Development Workflow

### Step 2: Choose Your Assignment
Your tech lead will assign you to work on specific features:
- **Forms improvements** (contact forms, application forms)
- **Event management** (event sign-ups, calendar views)
- **Recruitment system** (application review, candidate tracking)
- **UI/UX enhancements** (responsive design, accessibility)

### Step 3: Create a Feature Branch
```bash
# Make sure you're on main and up-to-date
git checkout main
git pull origin main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
# Example: git checkout -b feature/improve-event-signup-form
```

### Step 4: Develop Your Feature
1. **Run the development server**
   ```bash
   npm run dev
   ```

2. **Make your changes**
   - Edit files in `src/` directory
   - Changes auto-reload in browser
   - Use AI tools (ChatGPT, Copilot) to help implement features

3. **Test your changes**
   - Test all functionality works
   - Check on different screen sizes (mobile/desktop)
   - Verify no console errors

4. **Commit your work regularly**
   ```bash
   git add .
   git commit -m "Add: description of what you changed"
   ```

### Step 5: Push and Create Pull Request
```bash
# Push your branch to GitHub
git push origin feature/your-feature-name
```

Then:
1. Go to https://github.com/AIBuissnessGroup/ABGWebsite
2. Click "Compare & pull request"
3. Fill out the PR template:
   - What does this change?
   - How to test it?
   - Screenshots (if UI changes)
4. Request review from Tech Lead
5. Address any feedback

### Step 6: After Approval
- Tech Lead will merge your PR
- Your changes will be deployed to production
- Celebrate! 🎉

---

## 🛠 Common Tasks

### Adding a New Component
```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  description?: string;
}

export default function MyComponent({ title, description }: MyComponentProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
}
```

### Creating an API Route
```typescript
// src/app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Your logic here
  return NextResponse.json({ message: 'Success' });
}
```

### Working with the Database
```typescript
import { connectToDatabase } from '@/lib/mongodb';

const { db } = await connectToDatabase();
const users = await db.collection('users').find({}).toArray();
```

---

## 🆘 Getting Help

### When You're Stuck
1. **Check Documentation**
   - Next.js docs
   - Component comments in codebase
   
2. **Consulte AI Tools**
   - GitHub Copilot: Code suggestions and completions
   
3. **Ask on Slack**
   - #tech-committee channel
   - Don't hesitate to ask questions!
  

### Common Issues

**Issue**: "npm run dev" fails
- Solution: Delete `node_modules` and run `npm install` again

**Issue**: Database connection errors
- Solution: Check your `.env.local` file is present and correct

**Issue**: Authentication not working
- Solution: Make sure `NEXTAUTH_URL` is set to `http://localhost:3001`

---

## ✅ Best Practices

### Git Commits
- Commit often with clear messages
- Format: "Action: Description"
- Examples:
  - "Add: event signup form validation"
  - "Fix: mobile menu not closing"
  - "Update: improve button accessibility"

### Testing
- Test on both Chrome and Safari
- Check mobile responsiveness (use browser dev tools)
- Test with different user roles (admin vs regular user)

---

## 🎓 Learning Resources

### For Beginners
- Next.js Tutorial: https://nextjs.org/learn
- React Tutorial: https://react.dev/learn
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/

---
