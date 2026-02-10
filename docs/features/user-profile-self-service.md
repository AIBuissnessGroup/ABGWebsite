# User Profile Self-Service System

## Overview

The User Profile Self-Service System allows team members to manage their own profile information and project contributions without requiring admin intervention. This reduces the administrative burden while keeping team and project information current.

## Features

### 1. Personal Profile Management (`/profile`)

Team members can update their:
- **Basic Information**
  - School/College
  - Major
  - Graduation Year
  - Phone Number

- **Team Profile** (if linked to a team member)
  - Bio/Description
  - LinkedIn URL
  - GitHub URL
  - Profile Image URL

### 2. Project Contributions (`/profile/projects`)

Team members can:
- View all projects they're assigned to
- Edit their contribution description for each project
- See project status, progress, and details
- Track their role and achievements

## User Workflow

### For Regular Users

1. **Access Profile**
   - Click "Profile" link in the navigation bar
   - Or navigate directly to `/profile`

2. **Edit Basic Info**
   - Click "Edit Profile" button
   - Update school, major, graduation year, or phone
   - Click "Save" to commit changes

3. **Edit Team Profile** (if linked)
   - Update bio, LinkedIn, GitHub, or profile image
   - Changes appear immediately on the public team page

4. **Manage Project Contributions**
   - Click "My Projects" card on profile page
   - For each project, click "Edit Contribution"
   - Describe your role, responsibilities, and achievements
   - Click "Save" to update

### For Administrators

1. **Create Team Member**
   - Use existing team management at `/admin/team`
   - Add team member with name, role, etc.

2. **Link User Account**
   - Click "🔗 Link User" button on team member card
   - Select user from dropdown
   - Click "Link User"
   - User now has self-service access to their profile

## API Endpoints

### Profile Management

- `GET /api/profile` - Get user profile and linked team member
- `PUT /api/profile` - Update user profile (restricted fields)
- `POST /api/profile/link` - Admin: Link user to team member
- `DELETE /api/profile/link` - Admin: Unlink user
- `GET /api/profile/projects` - Get user's projects
- `PUT /api/profile/projects` - Update project contribution

## Security & Permissions

### User Permissions
- Users can ONLY edit their own profile
- Users can ONLY update team member fields: bio, linkedIn, github, imageUrl
- Users CANNOT edit: name, role, year, major, featured, active, memberType, project
- Users can ONLY edit their own project contributions

### Admin Permissions
- Admins have full edit access to all fields
- Admins can link/unlink user accounts
- Admins can manage all team members and projects

## Database Schema

### User Collection
- Added `teamMemberId` field to link users to team members
- Added `profile` object for user-specific information

### TeamMember Collection
- No schema changes required
- Existing fields are used

### Project Collection
- Uses existing `teamMembers` array
- Each member can have a `contribution` field

## Testing

### Manual Testing Checklist

- [ ] User can view their profile
- [ ] User can edit basic information
- [ ] User can edit team profile (if linked)
- [ ] User can view their projects
- [ ] User can edit project contributions
- [ ] Changes appear on public pages
- [ ] Admin can link user accounts
- [ ] Permissions are properly enforced

---

**Last Updated**: February 2026
