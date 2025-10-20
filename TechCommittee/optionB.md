# Option B: Lead Tech Committee Member Workflow
**Platform Leadership and Subproject Management**

---

## 🎯 Overview
As a Lead Tech Committee Member, you'll take ownership of larger features, manage subprojects, mentor other contributors, and help shape the technical direction of the ABG platform.

---

## 🚀 Getting Started

### Step 1: Complete Full Setup
Follow all steps from Option A, plus:

1. **Request Production Access** (After proving reliability)
   - Digital Ocean console access
   - SSH key setup for server access
   - Production database access (read-only initially)

2. **Additional Tools**
   - MongoDB Compass (for database management)
   - Postman or Insomnia (for API testing)
   - SystemD service management knowledge

3. **Review Production Infrastructure**
   - Understand deployment pipeline
   - Learn server architecture
   - Review monitoring and logging

---

## 🔐 Environment Management Strategy

### For Lead Members
You'll manage three environment configurations:

#### 1. Local Development (Your Machine)
```env
# .env.local - Full development credentials
DATABASE_URL="mongodb://[development-db]"
NEXTAUTH_URL="http://localhost:3001"
# All features enabled for testing
```

#### 2. Staging Environment (Optional)
```env
# Similar to production but separate database
# For testing before production deployment
```

#### 3. Production Environment (Digital Ocean Server)
```env
# .env on production server
# Full production credentials
# Managed via SSH access
```

### Security Responsibilities
- **Never commit** `.env` files to GitHub
- Use `.env.example` for documentation (without real values)
- Rotate credentials if compromised
- Use principle of least privilege

---

## 📋 Lead Member Responsibilities

### 1. Technical Leadership
- **Code Reviews**: Review all PRs from focused contributors
- **Architecture Decisions**: Propose and implement system improvements
- **Documentation**: Keep technical docs up-to-date
- **Mentorship**: Help onboard and guide new contributors

### 2. Subproject Management
You might lead initiatives like:
- **Event System Overhaul**: Enhanced event management features
- **Mobile App Integration**: API development for future mobile app
- **Analytics Dashboard**: Admin insights and metrics
- **Performance Optimization**: Speed improvements and caching

### 3. DevOps Responsibilities
- **Deployments**: Manage production deployments
- **Monitoring**: Watch for errors and performance issues
- **Backups**: Ensure database backups are working
- **Security**: Keep dependencies updated, review security

---

## 🔄 Advanced Development Workflow

### Feature Planning
1. **Gather Requirements**
   - Meet with stakeholders (ABG leadership)
   - Document user stories
   - Break down into tasks

2. **Technical Design**
   - Write design document
   - Consider scalability and performance
   - Review with other leads

3. **Task Delegation**
   - Assign tasks to focused contributors
   - Create GitHub issues with clear descriptions
   - Set milestones and deadlines

4. **Implementation & Review**
   - Write critical/complex code yourself
   - Review all contributor PRs
   - Ensure code quality standards

5. **Testing & Deployment**
   - Test thoroughly in staging
   - Plan deployment timing
   - Monitor post-deployment

### Pull Request Review Checklist
When reviewing PRs:
- ✅ Code follows project conventions
- ✅ TypeScript types are properly used
- ✅ No security vulnerabilities introduced
- ✅ Performance considered (no N+1 queries, etc.)
- ✅ Mobile responsive (if UI changes)
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Error handling implemented
- ✅ Console warnings/errors fixed
- ✅ Comments explain complex logic

---

## 🖥 Production Deployment Process

### Understanding the Service Setup

The ABG website runs as a SystemD service called `abg-website.service`:

```bash
# Check service status
sudo systemctl status abg-website

# View service configuration
sudo cat /etc/systemd/system/abg-website.service
```

**Typical service file (`abg-website.service`):**
```ini
[Unit]
Description=ABG Website Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ABGWebsite
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/ABGWebsite/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=abg-website

[Install]
WantedBy=multi-user.target
```

---

### Standard Deployment

```bash
# 1. SSH into Digital Ocean server
ssh root@159.89.229.112

# 2. Navigate to project directory
cd /var/www/ABGWebsite

# 3. Pull latest changes from GitHub
git pull origin main

# 4. Install any new dependencies
npm install --production

# 5. Build for production
npm run build

# 6. Restart the service
sudo systemctl restart abg-website

# 7. Check service status (should show "active (running)")
sudo systemctl status abg-website

# 8. View recent logs
sudo journalctl -u abg-website -n 50 --no-pager

# 9. Verify site is up
curl -I https://abgumich.org
# Should return: HTTP/1.1 200 OK
```

---

### Emergency Rollback

```bash
# If deployment breaks production

# 1. SSH into server
ssh root@159.89.229.112
cd /var/www/ABGWebsite

# 2. Find last working commit
git log --oneline -10

# 3. Revert to previous commit
git checkout [commit-hash]
# Example: git checkout abc123f

# 4. Rebuild
npm run build

# 5. Restart service
sudo systemctl restart abg-website

# 6. Verify
sudo systemctl status abg-website
curl -I https://abgumich.org

# 7. After confirming it works, reset main branch (if needed)
git checkout main
git reset --hard [working-commit-hash]
```

---

### Monitoring & Logs

```bash
# Check service status
sudo systemctl status abg-website

# View real-time logs (follow mode)
sudo journalctl -u abg-website -f

# View last 100 lines of logs
sudo journalctl -u abg-website -n 100 --no-pager

# View logs from today
sudo journalctl -u abg-website --since today

# View logs from specific time
sudo journalctl -u abg-website --since "2025-10-20 10:00:00"

# View error logs only
sudo journalctl -u abg-website -p err

# Check server resources
htop

# Check memory usage
free -h

# Check disk space
df -h

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check Nginx status
sudo systemctl status nginx
```

---

### Service Management Commands

```bash
# Start the service
sudo systemctl start abg-website

# Stop the service
sudo systemctl stop abg-website

# Restart the service (most common for deployments)
sudo systemctl restart abg-website

# Reload without dropping connections (if supported)
sudo systemctl reload abg-website

# Enable service to start on boot
sudo systemctl enable abg-website

# Disable service from starting on boot
sudo systemctl disable abg-website

# Check if service is enabled
sudo systemctl is-enabled abg-website

# Check if service is active
sudo systemctl is-active abg-website

# View service configuration
sudo systemctl cat abg-website

# Reload SystemD configuration (after editing service file)
sudo systemctl daemon-reload
```

---

### Updating the Service Configuration

If you need to modify the service (environment variables, user, etc.):

```bash
# 1. Edit the service file
sudo nano /etc/systemd/system/abg-website.service

# 2. Reload SystemD to recognize changes
sudo systemctl daemon-reload

# 3. Restart the service with new configuration
sudo systemctl restart abg-website

# 4. Verify it's working
sudo systemctl status abg-website
```

---

### Pre-Deployment Checklist

Before deploying to production:

- [ ] **Code Review**: All PRs approved and merged
- [ ] **Local Testing**: Tested on local machine with dev database
- [ ] **Dependencies**: All new packages documented and vetted
- [ ] **Environment Variables**: Check if `.env` needs updates
- [ ] **Database Migrations**: Run migrations if schema changed
- [ ] **Breaking Changes**: Document any breaking changes
- [ ] **Rollback Plan**: Know the last working commit hash
- [ ] **Communication**: Notify team of deployment window
- [ ] **Backup**: Ensure recent database backup exists

---

### Post-Deployment Verification

After deploying:

```bash
# 1. Check service is running
sudo systemctl status abg-website

# 2. Check for errors in logs
sudo journalctl -u abg-website -n 50 | grep -i error

# 3. Test website functionality
curl https://abgumich.org
curl https://abgumich.org/api/health  # If you have a health endpoint

# 4. Test authentication
# Manually: Try logging in via browser

# 5. Check database connectivity
# Run a test query via MongoDB Compass or mongosh

# 6. Monitor for 10-15 minutes
sudo journalctl -u abg-website -f
# Watch for any errors or warnings

# 7. Check Google Analytics or monitoring tools
# Verify traffic is flowing normally

# 8. Test key features
# - User login
# - Event sign-up
# - Form submissions
# - Admin dashboard (if applicable)
```

---

## 🗄 Database Management

### Connecting to Production DB

**⚠️ CAUTION**: Production database contains real user data. Only query, never delete without multiple backups!

```bash
# Using MongoDB Compass (GUI)
# Connection string:
mongodb://abgdev:[password]@127.0.0.1:27017/abg-website

# Using mongosh (command line)
# From the server:
mongosh --port 27017 -u abgdev -p --authenticationDatabase admin

# Enter password when prompted
# Then:
use abg-website
```

**For remote access (Lead Members only):**
```bash
# Must be connected via SSH tunnel
ssh -L 27017:localhost:27017 root@159.89.229.112

# Then in another terminal:
mongosh "mongodb://abgdev:PASSWORD@localhost:27017/abg-website?authSource=admin"
```

---

### Common Database Tasks

#### Backup Database (CRITICAL - Do this regularly!)

```bash
# On the server:
ssh root@159.89.229.112

# Create backup directory
sudo mkdir -p /backup/mongodb

# Run backup
mongodump --port 27017 \
  -u abgdev \
  -p "PASSWORD" \
  --authenticationDatabase admin \
  --db abg-website \
  --out /backup/mongodb/backup-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -lh /backup/mongodb/

# Compress backup
cd /backup/mongodb
tar -czf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d-*)/

# Download backup to local machine (from your computer)
scp root@159.89.229.112:/backup/mongodb/backup-*.tar.gz ~/Desktop/
```

#### Restore Database (Emergency Only!)

```bash
# Restore from backup
mongorestore --port 27017 \
  -u abgdev \
  -p "PASSWORD" \
  --authenticationDatabase admin \
  --db abg-website \
  /backup/mongodb/backup-YYYYMMDD-HHMMSS/abg-website/
```

#### Query Examples

```javascript
// Find all users
db.users.find().limit(10)

// Count total users
db.users.countDocuments()

// Find events happening this month
db.events.find({
  date: {
    $gte: new Date('2025-10-01'),
    $lt: new Date('2025-11-01')
  }
}).sort({ date: 1 })

// Find users by email
db.users.findOne({ email: "user@umich.edu" })

// Update a user's role (CAREFUL!)
db.users.updateOne(
  { email: "user@umich.edu" },
  { $set: { role: "admin" } }
)

// Check collection sizes
db.stats()

// Show all collections
show collections

// Check indexes
db.users.getIndexes()
db.events.getIndexes()
```

---

### Database Migration Scripts

Create scripts in `/scripts` directory for schema changes:

```typescript
// scripts/migrate-add-user-status.ts
import { connectToDatabase } from '../src/lib/mongodb';

async function migrate() {
  console.log('Starting migration: Add user status field');
  
  const { db } = await connectToDatabase();
  
  // Add status field to all users without one
  const result = await db.collection('users').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active', updatedAt: new Date() } }
  );
  
  console.log(`✅ Migration complete: ${result.modifiedCount} users updated`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

**Run migration on server:**
```bash
ssh root@159.89.229.112
cd /var/www/ABGWebsite

# Run with Node.js (if using .ts files, need ts-node)
npx ts-node scripts/migrate-add-user-status.ts

# Or if compiled to .js:
node scripts/migrate-add-user-status.js
```

---

## 🏗 Architecture Deep Dive

### Request Flow

```
User Browser
    ↓
Nginx (Port 80/443) - Reverse Proxy & SSL Termination
    ↓
Next.js Server (Port 3001) - Running as SystemD service
    ↓
NextAuth Middleware - Authentication check
    ↓
API Routes / Server Components
    ↓
MongoDB (Port 27017) - Database queries
```

### Key System Components

#### SystemD Service (`abg-website.service`)
- Manages the Next.js process
- Auto-restarts on failure
- Logs to SystemD journal
- Starts on server boot

#### Nginx Configuration
- Reverse proxies requests to Next.js (port 3001)
- Handles SSL/TLS certificates
- Serves static files efficiently
- Rate limiting and security headers

**View Nginx config:**
```bash
sudo cat /etc/nginx/sites-available/abgumich.org
# Or:
sudo cat /etc/nginx/nginx.conf
```

#### Authentication Flow
1. User clicks "Sign in with Google"
2. NextAuth redirects to Google OAuth
3. User authorizes
4. Google redirects back with code
5. NextAuth exchanges code for tokens
6. Session created and stored in database
7. User redirected to dashboard

#### Middleware Protection
```typescript
// middleware.ts
// Protects routes like /dashboard, /admin
// Redirects unauthenticated users to /login
```

#### Server vs Client Components
- **Server Components** (default): Fetch data, access DB directly, run on server
- **Client Components** ('use client'): Interactive, use hooks, event handlers, run in browser

---

## 🎯 Subproject Examples

### Example 1: Enhanced Event Management

**Goal**: Improve event sign-up and management

**Tasks**:
1. Add event capacity limits
2. Implement waitlist functionality
3. Send SMS reminders before events (via Twilio)
4. Add calendar export (.ics files)
5. Admin dashboard for attendance tracking

**Delegation**:
- Contributor A: Calendar export feature
- Contributor B: Waitlist UI
- You (Lead): Core waitlist logic + SMS integration

**Technical Considerations**:
- Database schema changes (add `capacity`, `waitlist` fields)
- API routes for event sign-up with capacity checks
- Scheduled jobs for SMS reminders (cron or background worker)
- Export endpoint for .ics file generation

---

### Example 2: Analytics Dashboard

**Goal**: Give ABG leaders insights into engagement

**Tasks**:
1. Track event attendance rates
2. Show application funnel metrics
3. User engagement scores
4. Export reports to CSV
5. Visualizations with charts

**Technical Decisions**:
- Use Chart.js or Recharts for visualizations
- Cache expensive aggregation queries
- Build protected API endpoints (`/api/admin/analytics`)
- Admin-only access control via middleware
- Consider data aggregation scripts that run nightly

---

## 🔒 Security Best Practices

### Code Security
- ✅ Validate all user inputs (use Zod or similar)
- ✅ Sanitize data before database queries
- ✅ Use parameterized queries (prevent injection)
- ✅ Implement rate limiting on APIs
- ✅ Never expose sensitive data in logs
- ✅ Use environment variables for secrets
- ✅ Keep dependencies updated (`npm audit`)

### Authentication Security
- ✅ Use NextAuth session validation
- ✅ Implement CSRF protection (built into NextAuth)
- ✅ Check user permissions on server side
- ✅ Don't trust client-side checks alone
- ✅ Use secure session cookies (httpOnly, secure flags)

### Database Security
- ✅ IP whitelist on MongoDB (production: localhost only)
- ✅ Strong passwords for DB users
- ✅ Principle of least privilege (separate read/write users)
- ✅ Regular backups (automated daily)
- ✅ Monitor for unusual queries
- ✅ Never log sensitive data (passwords, tokens)

### Server Security
- ✅ Keep Ubuntu/OS updated: `sudo apt update && sudo apt upgrade`
- ✅ Configure firewall (UFW): Only allow necessary ports
- ✅ Use SSH keys (disable password auth)
- ✅ Regular security audits
- ✅ Monitor system logs: `sudo journalctl -p err`

---

## 📊 Performance Optimization

### Next.js Optimization

```typescript
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('./HeavyChart'), { 
  ssr: false,
  loading: () => <p>Loading chart...</p>
});

// Optimize images
import Image from 'next/image';
<Image 
  src="/photo.jpg" 
  width={500} 
  height={300} 
  alt="Description"
  priority={false} // Only true for above-the-fold images
/>

// Cache API responses with revalidation
export const revalidate = 3600; // Cache for 1 hour

// Use React Server Components for data fetching
async function EventList() {
  const events = await db.collection('events').find().toArray();
  return <div>{/* render events */}</div>;
}
```

### Database Optimization

```javascript
// Add indexes for frequently queried fields
db.users.createIndex({ email: 1 }, { unique: true });
db.events.createIndex({ date: -1 });
db.events.createIndex({ "attendees.userId": 1 });

// Use projection to fetch only needed fields
db.users.find({}, { 
  projection: { name: 1, email: 1, _id: 1 } 
});

// Limit and paginate large queries
const page = 1;
const limit = 20;
db.events.find()
  .sort({ date: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray();

// Use aggregation for complex queries
db.events.aggregate([
  { $match: { date: { $gte: new Date() } } },
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

### Server Optimization

```bash
# Check Next.js build for bundle size
npm run build
# Look for large bundles that can be optimized

# Enable Nginx gzip compression
sudo nano /etc/nginx/nginx.conf
# Add:
# gzip on;
# gzip_types text/plain text/css application/json application/javascript;

# Monitor server performance
htop  # CPU and memory
iotop # Disk I/O
```

---

## 🆘 Incident Response

### If Production Goes Down

#### 1. **Immediate Assessment**

```bash
# SSH into server
ssh root@159.89.229.112

# Check if service is running
sudo systemctl status abg-website

# If service is dead, check why
sudo journalctl -u abg-website -n 100 --no-pager
```

#### 2. **Quick Diagnostics**

```bash
# Check if Next.js port is listening
sudo netstat -tulpn | grep 3001

# Check system resources
df -h          # Disk space
free -h        # Memory
uptime         # Load average

# Check Nginx
sudo systemctl status nginx
curl -I http://localhost:3001  # Test Next.js directly
```

#### 3. **Common Issues & Fixes**

**Service Crashed:**
```bash
# Restart service
sudo systemctl restart abg-website
sudo systemctl status abg-website
```

**Out of Memory:**
```bash
# Check memory
free -h

# Identify memory hog
ps aux --sort=-%mem | head -10

# Restart service (temporary fix)
sudo systemctl restart abg-website

# Long-term: Upgrade droplet or optimize app
```

**Out of Disk Space:**
```bash
# Check disk usage
df -h

# Find large files/directories
du -sh /var/* | sort -h

# Clear logs if needed
sudo journalctl --vacuum-time=7d  # Keep last 7 days

# Clear old build files
cd /var/www/ABGWebsite
rm -rf .next
npm run build
```

**Database Connection Failed:**
```bash
# Check MongoDB
sudo systemctl status mongod

# If MongoDB is down
sudo systemctl start mongod

# Check database connectivity
mongosh --port 27017 --eval "db.adminCommand('ping')"
```

**Nginx Issues:**
```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check error logs
sudo tail -100 /var/log/nginx/error.log
```

#### 4. **Communication Protocol**

```
1. Post in #tech-committee Slack: "Production down - investigating"
2. Notify ABG leadership (VP, President)
3. Update every 15 minutes with status
4. After fix: "Production restored - [brief description of issue]"
```

#### 5. **Rollback Procedure**

```bash
cd /var/www/ABGWebsite

# Find last working commit
git log --oneline -10

# Rollback
git checkout [last-working-commit]
npm run build
sudo systemctl restart abg-website

# Verify
sudo systemctl status abg-website
curl -I https://abgumich.org
```

#### 6. **Post-Incident**

- [ ] Document what happened
- [ ] Identify root cause
- [ ] Create GitHub issue with details
- [ ] Implement prevention measures
- [ ] Update runbooks/documentation
- [ ] Schedule post-mortem meeting

---

## 👥 Mentorship Guidelines

### Helping Focused Contributors

**Do**:
- ✅ Be patient and encouraging
- ✅ Explain the "why" behind decisions
- ✅ Share helpful resources and documentation
- ✅ Give constructive, specific feedback
- ✅ Celebrate their wins (shout-outs in Slack!)
- ✅ Pair program when they're stuck
- ✅ Set realistic expectations

**Don't**:
- ❌ Write all the code for them
- ❌ Assume they know terminology
- ❌ Be condescending or dismissive
- ❌ Ignore their questions
- ❌ Rush through explanations
- ❌ Give vague feedback

### Code Review Tone Examples

```
❌ BAD: "This is wrong, it should be X"
✅ GOOD: "Great start! I'd suggest X instead because [reason]. What do you think?"

❌ BAD: "Why didn't you add tests?"
✅ GOOD: "Let's add some tests for this. I can show you how if you'd like!"

❌ BAD: "This code is messy"
✅ GOOD: "Consider extracting this logic into a separate function for better readability. Happy to explain!"

❌ BAD: "Read the docs"
✅ GOOD: "The Next.js docs have a great section on this: [link]. Let me know if you have questions!"
```

---

## 🎓 Advanced Learning Path

### Month 1-2: Foundation
- ✅ Master Next.js App Router and Server Components
- ✅ Deep dive into TypeScript advanced types
- ✅ Learn MongoDB aggregation and optimization
- ✅ Understand full deployment pipeline
- ✅ Learn SystemD service management

### Month 3-4: Architecture
- ✅ System design principles
- ✅ Scalability patterns (caching, load balancing)
- ✅ Security best practices (OWASP Top 10)
- ✅ API design (REST, GraphQL considerations)
- ✅ Database design patterns

### Month 5-6: Leadership
- ✅ Project management (Agile, Scrum basics)
- ✅ Technical writing and documentation
- ✅ Mentorship and code review skills
- ✅ DevOps practices (CI/CD, monitoring)
- ✅ Incident response and on-call management

### Recommended Resources

**Books:**
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Clean Code" by Robert C. Martin
- "The Pragmatic Programmer" by Hunt & Thomas

**Online:**
- Next.js Advanced Features: https://nextjs.org/docs
- MongoDB University (free courses): https://university.mongodb.com/
- System Design Primer (GitHub): https://github.com/donnemartin/system-design-primer
- Web Security Academy: https://portswigger.net/web-security

---

## 🏆 Path to VP of Technology

Lead Tech Committee Members are strong candidates for VP of Technology.

**What VP Tech Does**:
- Sets overall technical strategy and roadmap
- Manages entire tech team and operations
- Liaises with ABG executive board
- Owns production infrastructure and uptime
- Makes final technical and architectural decisions
- Budget planning for technical needs

**How to Stand Out**:
1. ✅ Successfully lead 2+ major subprojects end-to-end
2. ✅ Demonstrate reliability (deployments, on-call response)
3. ✅ Show mentorship and leadership skills
4. ✅ Propose strategic technical improvements proactively
5. ✅ Be proactive, not reactive (anticipate problems)
6. ✅ Communicate effectively with non-technical stakeholders
7. ✅ Maintain system stability and security

---

## ✅ Success Metrics

**You're succeeding as a Lead Member when:**

- ✅ Contributors come to you for help and guidance
- ✅ Your code reviews improve overall code quality
- ✅ Deployments happen smoothly without incidents
- ✅ You ship features on time and with quality
- ✅ The platform is more stable and performant
- ✅ Team velocity increases due to your contributions

---

## 🔧 Daily/Weekly Tasks

### Daily (5-10 minutes):
- [ ] Check Slack for urgent issues
- [ ] Review system logs for errors: `sudo journalctl -u abg-website -p err --since today`
- [ ] Check service status: `sudo systemctl status abg-website`
- [ ] Respond to contributor questions

### Weekly (1-2 hours):
- [ ] Review and merge PRs
- [ ] Check for dependency updates: `npm outdated`
- [ ] Review production logs for patterns
- [ ] Backup database (if not automated)
- [ ] Team sync meeting
- [ ] Plan next week's priorities

### Monthly (2-3 hours):
- [ ] Security audit (`npm audit`, dependency updates)
- [ ] Performance review (page load times, bundle sizes)
- [ ] Infrastructure health check
- [ ] Review and update documentation
- [ ] 1-on-1s with contributors
- [ ] Strategic planning with leadership

---

## 📝 Deployment Playbook

**Quick Reference for Common Deployment:**

```bash
# 1. SSH
ssh root@159.89.229.112

# 2. Navigate
cd /var/www/ABGWebsite

# 3. Pull
git pull origin main

# 4. Install
npm install --production

# 5. Build
npm run build

# 6. Restart
sudo systemctl restart abg-website

# 7. Verify
sudo systemctl status abg-website
sudo journalctl -u abg-website -n 20
curl -I https://abgumich.org
```

**Save as a shell script:**
```bash
sudo nano /usr/local/bin/deploy-abg.sh
# Paste the commands above
sudo chmod +x /usr/local/bin/deploy-abg.sh

# Use: /usr/local/bin/deploy-abg.sh
```

---

## 📞 Emergency Contacts

**In case of critical production issues:**

1. **#tech-committee Slack channel** - Post immediately
2. **President/VP Operations** - For user-facing incidents
3. **Digital Ocean Support** - For infrastructure issues

**Critical Issue Definition:**
- Site completely down (15+ minutes)
- Data loss or corruption
- Security breach
- Mass user login failures

---

Remember: **Leadership is about enabling others to succeed, not doing everything yourself.** Focus on multiplying your impact through delegation, documentation, and mentorship.

**Questions?** Ask in #tech-committee Slack or schedule office hours with @anthonyy-walker.
