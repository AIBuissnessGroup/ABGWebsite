# Recruitment Portal Testing Guide

This document provides a comprehensive testing checklist for the ABG Recruitment Portal.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure you're logged in** with a `@umich.edu` Google account

3. **Admin access required** for admin portal tests (check `ADMIN_EMAILS` env var or database `users` collection for roles)

---

## Part 1: Admin Portal Tests

### 1.1 Recruitment Cycles

**Navigate to:** `/admin/recruitment-portal`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Click "Create Cycle" button | Modal/form appears |  |
| 2 | Fill in cycle details (name, slug, dates) and submit | New cycle appears in list |  |
| 3 | Click on a cycle to view details | Cycle settings page loads |  |
| 4 | Edit cycle name and save | Changes persist after refresh |  |
| 5 | Toggle "Active" status | Only one cycle can be active at a time |  |
| 6 | Set portal open/close dates | Dates save correctly |  |
| 7 | Set application deadline | Deadline saves correctly |  |

### 1.2 Recruitment Events

**Navigate to:** `/admin/recruitment-portal/[cycleId]/events`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Click "Add Event" button | Event form appears |  |
| 2 | Create event with title, dates, location | Event appears in list |  |
| 3 | Enable RSVP with capacity limit | RSVP settings save |  |
| 4 | Edit an existing event | Changes persist |  |
| 5 | Delete an event | Event removed from list |  |
| 6 | Click "View RSVPs" on an event | RSVP list modal/panel opens |  |
| 7 | Mark an RSVP as attended | Attendance status updates |  |

### 1.3 Interview Slots

**Navigate to:** `/admin/recruitment-portal/[cycleId]/slots`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Click "Add Slot" button | Slot form appears |  |
| 2 | Create coffee chat slot with date/time | Slot appears in list |  |
| 3 | Create interview_round1 slot | Slot appears with correct type |  |
| 4 | Create interview_round2 slot | Slot appears with correct type |  |
| 5 | Edit slot time/location | Changes persist |  |
| 6 | Delete a slot | Slot removed from list |  |
| 7 | View bookings for a slot | Bookings list appears |  |

### 1.4 Application Questions

**Navigate to:** `/admin/recruitment-portal/[cycleId]/questions`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Add a text field question | Question appears |  |
| 2 | Add a textarea question | Question appears |  |
| 3 | Add a select question with options | Options save correctly |  |
| 4 | Add a file upload question (resume) | File field appears |  |
| 5 | Mark a question as required | Required indicator shows |  |
| 6 | Reorder questions | New order persists |  |
| 7 | Create track-specific questions (business/engineering) | Questions show for correct track |  |
| 8 | Save all questions | Toast confirms save |  |

### 1.5 Applications Management

**Navigate to:** `/admin/recruitment-portal/[cycleId]/applications`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | View list of applications | Applications display with status |  |
| 2 | Filter by stage (submitted, coffee_chat, etc.) | List filters correctly |  |
| 3 | Filter by track (business/engineering) | List filters correctly |  |
| 4 | Click on an application | Detail view opens |  |
| 5 | View applicant's responses | All answers display |  |
| 6 | View applicant's files (resume, headshot) | Files accessible |  |
| 7 | Change application stage | Stage updates |  |
| 8 | Add internal notes | Notes save |  |

### 1.6 Reviews

**Navigate to:** Application detail page → Reviews tab

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Add scores for an applicant | Scores save |  |
| 2 | Add written comments | Comments save |  |
| 3 | Select recommendation (accept/reject/hold) | Selection saves |  |
| 4 | View other reviewers' submissions | Other reviews visible (if permitted) |  |
| 5 | Edit your own review | Changes persist |  |

### 1.7 Email Communications

**Navigate to:** `/admin/recruitment-portal/[cycleId]/emails` (if exists) or use send-emails API

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Select recipients by stage | Correct applicants selected |  |
| 2 | Compose email with subject/body | Email form works |  |
| 3 | Send test email to self | Email received |  |
| 4 | Send bulk email | All recipients receive email |  |
| 5 | View sent email history | Email logs display |  |

---

## Part 2: Applicant Portal Tests

> **Note:** Use a non-admin `@umich.edu` account for realistic testing, or test with admin account understanding admin sees extra UI elements.

### 2.1 Portal Access

**Navigate to:** `/portal`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Access portal before `portalOpenAt` | "Portal not yet open" message |  |
| 2 | Access portal after `portalCloseAt` | "Portal closed" message |  |
| 3 | Access portal during open period | Dashboard loads |  |
| 4 | View cycle name and deadline | Correct info displays |  |

### 2.2 Application Flow

**Navigate to:** `/portal/application`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Click "Start Application" | Application form loads |  |
| 2 | Select track (business/engineering) | Track-specific questions appear |  |
| 3 | Fill in text fields | Values save (check autosave) |  |
| 4 | Fill in textarea fields | Values save |  |
| 5 | Select from dropdown | Selection saves |  |
| 6 | Upload resume (if required) | File uploads successfully |  |
| 7 | Upload headshot (if required) | File uploads successfully |  |
| 8 | Leave page and return | Draft preserved (autosave) |  |
| 9 | Submit incomplete application | Validation errors show for required fields |  |
| 10 | Complete all required fields and submit | Success message, status changes to "submitted" |  |
| 11 | Try to edit after submission | Application locked (view only) |  |

### 2.3 Events & RSVP

**Navigate to:** `/portal/events`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | View list of upcoming events | Events display with details |  |
| 2 | View past events | Past events section shows |  |
| 3 | RSVP to an event | "RSVP'd" badge appears |  |
| 4 | Cancel RSVP | RSVP removed |  |
| 5 | RSVP to event at capacity | "Event at capacity" error |  |
| 6 | RSVP after deadline | "Deadline passed" error |  |
| 7 | View attendance status for past events | Shows "Attended" or "Did not attend" |  |

### 2.4 Scheduling (Coffee Chats & Interviews)

**Navigate to:** `/portal/schedule` or `/portal`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | View available coffee chat slots | Slots display with times |  |
| 2 | Book a coffee chat slot | Booking confirmed |  |
| 3 | Cancel a booking | Slot freed up |  |
| 4 | Book same slot twice | Error: already booked |  |
| 5 | After advancing to interview stage, view interview slots | Interview slots appear |  |
| 6 | Book interview slot | Booking confirmed |  |
| 7 | View "My Bookings" | All bookings listed |  |

### 2.5 Dashboard Status

**Navigate to:** `/portal`

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Before starting application | "Not Started" status |  |
| 2 | After saving draft | "Draft" status |  |
| 3 | After submitting | "Submitted" status with date |  |
| 4 | After admin advances to coffee_chat | "Coffee Chat" stage shows |  |
| 5 | Progress bar updates with each stage | Visual progress indicator |  |
| 6 | View quick action cards | Events, Schedule, Application cards |  |

---

## Part 3: API Endpoint Tests

Use these curl commands or a tool like Postman. Replace `[cycleId]` with an actual cycle ID.

### 3.1 Portal APIs (Authenticated User)

```bash
# Get dashboard
curl -X GET http://localhost:3001/api/portal/dashboard \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# Get application
curl -X GET http://localhost:3001/api/portal/application \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# Save application draft
curl -X PUT http://localhost:3001/api/portal/application \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"track": "business", "responses": {"question1": "answer1"}}'

# Submit application
curl -X POST http://localhost:3001/api/portal/application/submit \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# RSVP to event
curl -X POST http://localhost:3001/api/portal/rsvp \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"eventId": "[eventId]"}'

# Cancel RSVP
curl -X DELETE "http://localhost:3001/api/portal/rsvp?eventId=[eventId]" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# Book a slot
curl -X POST http://localhost:3001/api/portal/booking \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"slotId": "[slotId]"}'
```

### 3.2 Admin APIs (Admin Only)

```bash
# List cycles
curl -X GET http://localhost:3001/api/admin/recruitment/cycles \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION"

# Create cycle
curl -X POST http://localhost:3001/api/admin/recruitment/cycles \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "Test Cycle",
    "slug": "test-2026",
    "portalOpenAt": "2026-01-01T00:00:00Z",
    "portalCloseAt": "2026-02-01T00:00:00Z",
    "applicationDueAt": "2026-01-15T23:59:59Z"
  }'

# List applications
curl -X GET "http://localhost:3001/api/admin/recruitment/applications?cycleId=[cycleId]" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION"

# Update application stage
curl -X PUT "http://localhost:3001/api/admin/recruitment/applications/[applicationId]" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_SESSION" \
  -d '{"stage": "coffee_chat"}'
```

---

## Part 4: Edge Cases & Error Handling

| # | Test Scenario | Expected Behavior | ✓/✗ |
|---|---------------|-------------------|-----|
| 1 | Access admin pages without login | Redirect to login |  |
| 2 | Access admin pages as non-admin user | 403 Forbidden |  |
| 3 | Access portal pages without login | Redirect to login |  |
| 4 | Submit application with missing required fields | Validation error with field names |  |
| 5 | Upload file exceeding size limit | Clear error message |  |
| 6 | Upload wrong file type | Clear error message |  |
| 7 | Double-click submit button | Only one submission processed |  |
| 8 | Network error during autosave | Error toast, retry on reconnect |  |
| 9 | Access non-existent cycle | 404 error |  |
| 10 | Access application from different cycle | Not found or access denied |  |

---

## Part 5: Database Verification

After testing, verify data in DocumentDB:

```javascript
// Connect to DocumentDB and check collections
db.recruitment_cycles.find({}).pretty()
db.recruitment_events.find({}).pretty()
db.recruitment_applications.find({}).pretty()
db.recruitment_rsvps.find({}).pretty()
db.recruitment_slots.find({}).pretty()
db.recruitment_bookings.find({}).pretty()
db.recruitment_reviews.find({}).pretty()
db.recruitment_questions.find({}).pretty()
db.recruitment_email_logs.find({}).pretty()
```

---

## Test Summary

| Section | Total Tests | Passed | Failed | Notes |
|---------|-------------|--------|--------|-------|
| 1.1 Cycles | 7 | | | |
| 1.2 Events | 7 | | | |
| 1.3 Slots | 7 | | | |
| 1.4 Questions | 8 | | | |
| 1.5 Applications | 8 | | | |
| 1.6 Reviews | 5 | | | |
| 1.7 Emails | 5 | | | |
| 2.1 Portal Access | 4 | | | |
| 2.2 Application Flow | 11 | | | |
| 2.3 Events & RSVP | 7 | | | |
| 2.4 Scheduling | 7 | | | |
| 2.5 Dashboard | 6 | | | |
| 4. Edge Cases | 10 | | | |
| **TOTAL** | **92** | | | |

---

## Known Issues / Notes

- [ ] Document any bugs found during testing here
- [ ] Note any features that need additional work

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |
| Reviewer | | | |
