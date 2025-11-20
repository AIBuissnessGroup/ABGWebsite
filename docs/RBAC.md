# Role-Based Access Control (RBAC) for Admin Dashboard

This system implements fine-grained access control for admin pages based on user roles.

## Overview

Instead of granting full admin access to everyone with an `ADMIN` role, the system now allows specific executive roles (VPs) to access only the pages relevant to their responsibilities.

## How It Works

### 1. Permissions File (`src/lib/permissions.ts`)

Defines which roles can access which admin pages:

```typescript
export const PAGE_PERMISSIONS: Record<AdminPage, UserRole[]> = {
  'events': ['ADMIN', 'PRESIDENT', 'VP_EXTERNAL', 'VP_OPERATIONS', 'VP_MARKETING', 'VP_CONFERENCES'],
  'recruitment': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  // ... etc
};
```

### 2. Protection Component (`src/components/admin/AdminPageProtection.tsx`)

Provides a higher-order component to protect admin pages:

```typescript
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';

function MyAdminPage() {
  // Your page content
}

export default withAdminPageProtection(MyAdminPage, 'events');
```

### 3. Access Denied Page (`src/app/admin/access-denied/page.tsx`)

Shows a user-friendly message when access is denied, explaining which roles are required.

## Usage

### Protecting an Admin Page

1. **Import the protection HOC:**
```typescript
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';
```

2. **Wrap your component:**
```typescript
function EventsPage() {
  // Your page implementation
  return <div>Events Management</div>;
}

export default withAdminPageProtection(EventsPage, 'events');
```

3. **That's it!** The page will now:
   - Redirect unauthenticated users to sign-in
   - Redirect users without any admin access to unauthorized page
   - Redirect users without specific permission to access-denied page
   - Show the page only to users with appropriate roles

### Checking Permissions in Code

```typescript
import { canAccessAdminPage, getAccessibleAdminPages } from '@/lib/permissions';
import { useAdminPageAccess } from '@/components/admin/AdminPageProtection';

// In a component
function MyComponent() {
  const { data: session } = useSession();
  const canAccessEvents = canAccessAdminPage(session.user.roles, 'events');
  
  if (!canAccessEvents) {
    return <div>No access to events</div>;
  }
  
  return <div>Events content</div>;
}

// Using the hook
function MyComponent() {
  const hasAccess = useAdminPageAccess('events');
  
  if (!hasAccess) {
    return <div>No access</div>;
  }
  
  return <div>Content</div>;
}
```

### Conditionally Showing Navigation Links

```typescript
import { getAccessibleAdminPages } from '@/lib/permissions';

function AdminNav() {
  const { data: session } = useSession();
  const accessiblePages = getAccessibleAdminPages(session.user.roles);
  
  return (
    <nav>
      {accessiblePages.includes('events') && (
        <Link href="/admin/events">Events</Link>
      )}
      {accessiblePages.includes('recruitment') && (
        <Link href="/admin/recruitment">Recruitment</Link>
      )}
    </nav>
  );
}
```

## Permission Matrix

| Page | Roles with Access |
|------|------------------|
| **Core Admin** |
| Dashboard | ADMIN, PRESIDENT |
| Users | ADMIN, PRESIDENT |
| Permissions | ADMIN, PRESIDENT |
| Settings | ADMIN, PRESIDENT, VP_TECHNOLOGY |
| Audit | ADMIN, PRESIDENT |
| Analytics | ADMIN, PRESIDENT, VP_OPERATIONS, VP_MARKETING, VP_RECRUITMENT |
| **Events** |
| Events | ADMIN, PRESIDENT, VP_EXTERNAL, VP_OPERATIONS, VP_MARKETING, VP_CONFERENCES |
| **Recruitment** |
| Recruitment | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Coffee Chats | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Interviews | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Member Levels | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| Waitlists | ADMIN, PRESIDENT, VP_RECRUITMENT, VP_OPERATIONS |
| **Projects** |
| Projects | ADMIN, PRESIDENT, VP_OPERATIONS, VP_TECHNOLOGY, VP_EDUCATION |
| **Content** |
| Newsroom | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL |
| Newsletter | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL, VP_OPERATIONS |
| Notifications | ADMIN, PRESIDENT, VP_MARKETING, VP_EXTERNAL, VP_OPERATIONS |
| About | ADMIN, PRESIDENT, VP_MARKETING, VP_OPERATIONS |
| **Partnerships** |
| Internships | ADMIN, PRESIDENT, VP_EXTERNAL, VP_SPONSORSHIPS, VP_OPERATIONS |
| Companies | ADMIN, PRESIDENT, VP_EXTERNAL, VP_SPONSORSHIPS, VP_OPERATIONS |

## Adding New Protected Pages

1. **Add the page to AdminPage type in `permissions.ts`:**
```typescript
export type AdminPage = 
  | 'existing-pages'
  | 'your-new-page'; // Add here
```

2. **Add permissions mapping:**
```typescript
export const PAGE_PERMISSIONS: Record<AdminPage, UserRole[]> = {
  // ... existing mappings
  'your-new-page': ['ADMIN', 'PRESIDENT', 'VP_RELEVANT_ROLE'],
};
```

3. **Protect your page:**
```typescript
// src/app/admin/your-new-page/page.tsx
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';

function YourNewPage() {
  return <div>Content</div>;
}

export default withAdminPageProtection(YourNewPage, 'your-new-page');
```

## API Route Protection

For API routes, check permissions manually:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminPage } from '@/lib/permissions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!canAccessAdminPage(session.user.roles, 'events')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Your API logic here
}
```

## Assigning Roles to Users

Roles are assigned through the Users admin page (`/admin/users`):

1. Only ADMIN and PRESIDENT can access the users page
2. Select a user and edit their roles
3. Available executive roles:
   - VP_EXTERNAL
   - VP_OPERATIONS
   - VP_EDUCATION
   - VP_MARKETING
   - VP_CONFERENCES
   - VP_FINANCE
   - VP_COMMUNITY
   - VP_SPONSORSHIPS
   - VP_RECRUITMENT
   - VP_TECHNOLOGY

## Notes

- **ADMIN role** has access to everything (superuser)
- **PRESIDENT role** also has access to everything
- Other roles have limited access based on their responsibilities
- Multiple roles can be assigned to a single user
- Pages can require multiple different roles (user needs any one of them)
