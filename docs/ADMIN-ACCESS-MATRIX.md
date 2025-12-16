# Admin Page Access Control Matrix

## 🔑 Access by Role

### Full Access (All Pages)
- **ADMIN** - Full administrator access
- **PRESIDENT** - President has same access as admin

---

## 📊 By Admin Page

| Page | Who Has Access |
|------|----------------|
| **Core Administration** |
| Dashboard (`/admin`) | ADMIN, PRESIDENT |
| Users (`/admin/users`) | ADMIN, PRESIDENT |
| Permissions (`/admin/permissions`) | ADMIN, PRESIDENT |
| Settings (`/admin/settings`) | ADMIN, PRESIDENT, VP_TECHNOLOGY |
| Audit (`/admin/audit`) | ADMIN, PRESIDENT |
| **Analytics** |
| Analytics/Forms (`/admin/analytics`) | ADMIN, PRESIDENT, VP_OPERATIONS, VP_MARKETING, VP_RECRUITMENT |
| **Events** |
| Events (`/admin/events`) | ADMIN, PRESIDENT, VP_EXTERNAL, VP_OPERATIONS, VP_MARKETING, VP_CONFERENCES |
| **Recruitment** |
| Recruitment (`/admin/recruitment`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Recruitment Timeline (`/admin/recruitment-timeline`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Coffee Chats (`/admin/coffee-chats`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Interviews (`/admin/interviews`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Member Levels (`/admin/member-levels`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Waitlists (`/admin/waitlists`) | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| **Forms** |
| Forms (`/admin/forms`) | ADMIN, PRESIDENT, VP_OPERATIONS, VP_RECRUITMENT, VP_EXTERNAL |
| **Projects** |
| Projects (`/admin/projects`) | ADMIN, PRESIDENT, VP_OPERATIONS, VP_TECHNOLOGY, VP_EDUCATION |
| **Team** |
| Team (`/admin/team`) | ADMIN, PRESIDENT, VP_OPERATIONS, VP_RECRUITMENT |
| **Website Content** |
| About (`/admin/about`) | ADMIN, PRESIDENT, VP_MARKETING, VP_OPERATIONS |
| Join (`/admin/join`) | ADMIN, PRESIDENT, VP_MARKETING, VP_OPERATIONS, VP_RECRUITMENT |
| Hero (`/admin/hero`) | ADMIN, PRESIDENT, VP_MARKETING, VP_OPERATIONS |
| Content (`/admin/content`) | ADMIN, PRESIDENT, VP_MARKETING, VP_OPERATIONS |
| **Communications** |
| Newsroom (`/admin/newsroom`) | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL |
| Newsletter (`/admin/newsletter`) | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL, VP_OPERATIONS |
| Notifications (`/admin/notifications`) | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL, VP_OPERATIONS |
| **Partnerships** |
| Internships (`/admin/internships`) | ADMIN, PRESIDENT, VP_EXTERNAL, VP_SPONSORSHIPS, VP_OPERATIONS |
| Companies (`/admin/companies`) | ADMIN, PRESIDENT, VP_EXTERNAL, VP_SPONSORSHIPS, VP_OPERATIONS |
| **Development** |
| Changelog (`/admin/changelog`) | ADMIN, PRESIDENT, VP_TECHNOLOGY, VP_OPERATIONS |

---

## 👥 By VP Role

### VP_RECRUITMENT
- Recruitment
- Recruitment Timeline
- Coffee Chats
- Interviews
- Member Levels
- Waitlists
- Forms
- Team
- Join
- Analytics

### VP_OPERATIONS
- All recruitment pages (same as VP_RECRUITMENT)
- Events
- Forms
- Projects
- Team
- About, Join, Hero, Content
- Newsletter, Notifications
- Internships, Companies
- Changelog
- Analytics

### VP_EXTERNAL
- Events
- Forms
- Newsroom
- Newsletter, Notifications
- Internships, Companies

### VP_MARKETING
- Events
- About, Join, Hero, Content
- Newsroom
- Newsletter, Notifications
- Analytics

### VP_CONFERENCES
- Events

### VP_TECHNOLOGY
- Settings
- Projects
- Changelog

### VP_EDUCATION
- Projects

### VP_SPONSORSHIPS
- Internships
- Companies

### VP_FINANCE
- Currently no specific pages (can be added)

### VP_COMMUNITY
- Currently no specific pages (can be added)

---

## ⚠️ Important Notes

1. **ADMIN and PRESIDENT** have access to ALL pages regardless of restrictions
2. **Multiple roles can be assigned** to a single user (e.g., someone can be both VP_OPERATIONS and VP_MARKETING)
3. Pages are **currently NOT protected** - need to apply `withAdminPageProtection()` to each page
4. **Events page is the only one protected** as an example
5. Use `/scripts/add-rbac-protection.sh` to see which pages need protection

---

## 🚀 How to Apply Protection to a Page

Currently **only** `/admin/events` is protected. To protect other pages:

1. Add import:
```typescript
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';
```

2. Change function declaration:
```typescript
// From:
export default function MyAdminPage() { ... }

// To:
function MyAdminPage() { ... }
export default withAdminPageProtection(MyAdminPage, 'page-name');
```

See `docs/RBAC.md` for complete instructions.
