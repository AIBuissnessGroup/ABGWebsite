# ABG Recruitment Portal — Complete Implementation Spec

## 0) Absolute constraints (do not violate)

1. **Authentication**

   * MUST reuse the **existing ABG Google user management system**
   * Use the same session retrieval, user model, and admin role checks already in the codebase
   * DO NOT create new auth providers, tables, or login flows

2. **Admin Dashboard**

   * This is **NOT a new admin app**
   * Recruitment lives as **another section inside the existing admin dashboard**

3. **No seeding**

   * NOTHING is preloaded
   * Admins manually create:

     * cycles
     * events
     * application questions
     * coffee chat slots
     * interview slots

4. **Everything is cycle-scoped**

   * No global recruitment state
   * Every record references a `cycleId`

5. **Autosave drafts**

   * Application responses must autosave continuously
   * Users must never lose progress

---

## 1) System overview

### Applicant Portal

* Hostname: `portal.abgumich.org`
* Shows a **cycle-specific dashboard** for the logged-in user
* Includes:

  * Application form (Business or Engineering)
  * Application status
  * Event list with RSVP
  * Coffee chat booking
  * Interview booking (gated by stage)
  * Calendar integrations
  * Autosaved drafts

### Admin Dashboard (existing)

Add a new section:

```
Admin
└── Recruitment
    ├── Cycles
    └── Cycle Detail
        ├── Settings
        ├── Events (RSVP + Attendance)
        ├── Application Questions
        ├── Slots (Coffee Chats / Interviews)
        ├── Applicants
        ├── Reviews (Scoring)
        └── Communications
```

---

## 2) Authentication & user management

**Do not reimplement auth.**

Implementation rules:

* Use existing Google sign-in + session helpers
* Use existing user collection
* Recruitment records reference the existing `userId`
* Admin access is determined using existing admin/role logic

If user is not authenticated:

* Redirect to the existing ABG sign-in flow

---

## 3) Core data models (all cycle-scoped)

### 3.1 Recruitment Cycles

```js
recruitment_cycles {
  _id,
  slug,
  name,
  isActive,
  portalOpenAt,
  portalCloseAt,
  applicationDueAt,
  createdAt,
  updatedAt
}
```

---

### 3.2 Recruitment Events (RSVP-enabled)

```js
recruitment_events {
  _id,
  cycleId,
  title,
  description,
  startAt,
  endAt,
  location,
  rsvpEnabled,
  calendarId,        // which Google calendar to use
  createdByAdminId,
  createdAt,
  updatedAt
}
```

---

### 3.3 Event RSVPs + Attendance

```js
recruitment_event_rsvps {
  _id,
  cycleId,
  eventId,
  userId,
  name,
  email,
  status: "going" | "cancelled",
  attendance: {
    attended: boolean,
    checkedInAt,
    checkedInByAdminId
  },
  gcal: {
    eventId,
    htmlLink,
    calendarId
  },
  createdAt,
  updatedAt
}
```

---

### 3.4 Application Questions (dynamic)

```js
recruitment_questions {
  _id,
  cycleId,
  track: "business" | "engineering" | "both",
  fields: [
    {
      key,
      label,
      type,              // text, textarea, select, multiselect, file, url
      required,
      options,
      maxLength,
      fileKind           // resume | headshot
    }
  ],
  updatedAt
}
```

---

### 3.5 Applications (autosaved drafts)

```js
recruitment_applications {
  _id,
  cycleId,
  userId,
  name,
  email,
  track,
  status: {
    stage: "not_started" | "in_progress" | "submitted" |
           "rejected_pre_interview" |
           "round1_invited" | "round1_scheduled" | "round1_rejected" |
           "round2_invited" | "round2_scheduled" | "round2_rejected" |
           "accepted",
    updatedAt,
    updatedByAdminId
  },
  answers,           // autosaved continuously
  files: {
    resume,
    headshot
  },
  submittedAt,
  deletedAt,
  createdAt,
  updatedAt
}
```

---

### 3.6 Slots (Coffee Chats & Interviews)

```js
recruitment_slots {
  _id,
  cycleId,
  kind: "coffee_chat" | "interview_round1" | "interview_round2",
  startAt,
  endAt,
  location,
  capacity,
  hosts: [{ name, email, userId }],
  isActive,
  createdAt,
  updatedAt
}
```

---

### 3.7 Bookings (shows who interviewed them)

```js
recruitment_bookings {
  _id,
  cycleId,
  slotId,
  applicationId,
  kind,
  applicant: { userId, name, email },
  hosts: [{ name, email, userId }],
  status: "booked" | "cancelled",
  gcal: {
    eventId,
    htmlLink,
    calendarId
  },
  createdAt,
  updatedAt
}
```

---

### 3.8 Collaborative Reviews (scoring + referrals)

```js
recruitment_reviews {
  _id,
  cycleId,
  applicationId,
  adminUserId,
  adminName,
  score: {
    overall,
    categories
  },
  recommendation: "yes" | "maybe" | "no",
  signal: "referral" | "neutral" | "deferral",
  signalReason,
  notes,
  createdAt,
  updatedAt
}
```

---

### 3.9 Email Logs (existing Gmail system)

```js
recruitment_email_logs {
  _id,
  cycleId,
  applicationId,
  to,
  templateKey,
  subject,
  status,
  sentByAdminId,
  createdAt
}
```

---

## 4) Applicant portal behavior

### 4.1 Dashboard structure

1. **Application Status Banner**
2. **Events + RSVP**
3. **Application Form (autosaving)**
4. **Coffee Chat Booking**
5. **Interview Booking (Round-gated)**
6. **Acceptance / Rejection Messaging**

---

### 4.2 Autosave drafts (critical)

* Every field change triggers:

  * debounced autosave (e.g. 1–2 seconds)
  * `POST /application/save`
* Drafts persist even if:

  * browser closes
  * network drops
  * user logs out
* Submission is a separate explicit action

---

### 4.3 Event RSVP

* Clicking “I’m Going”:

  * creates RSVP record
  * creates Google Calendar event
* Cancel RSVP:

  * deletes calendar event
  * marks RSVP cancelled
* Applicant only controls RSVP, not attendance

---

### 4.4 Booking logic

* Coffee chats always visible if slots exist
* Interview slots only visible when stage allows
* Booking:

  * creates calendar event
  * invites applicant + hosts
* Cancel booking:

  * deletes calendar event
  * frees slot

---

## 5) Admin dashboard functionality

### 5.1 Cycles

* Create/edit/archive cycles
* Control portal open/close + deadlines

---

### 5.2 Events

* Create/edit/delete events
* Enable RSVP
* View RSVPs
* Mark attendance (check-in)
* Bulk check-in UI
* See who attended vs RSVP’d

---

### 5.3 Application Questions

* Fully dynamic form builder
* Track-specific questions
* Resume + headshot enforced via file fields

---

### 5.4 Slots

* Create coffee chat & interview slots
* Assign hosts
* View bookings by:

  * day
  * host
  * interview round
* Force cancel bookings (with calendar cleanup)

---

### 5.5 Applicants

Admin must be able to:

* View drafts vs submitted
* View full applicant profile
* See:

  * application answers
  * resume/headshot
  * events RSVP’d + attended
  * coffee chats + interviewers
* Update stage
* Soft delete application

---

### 5.6 Reviews (collaborative scoring)

For each applicant:

* Every admin submits their own review
* Reviews are visible to all admins
* Shows:

  * average score
  * referral / deferral counts
  * reviewer names
* No auto-decisions — admin controls stage

---

### 5.7 Communications

* Use existing Gmail HTML templates
* Send:

  * rejection emails
  * interview invites
  * acceptance emails
* Bulk send by filter
* Log every email sent

---

## 6) Google Calendar integration (mandatory)

Used for:

* Event RSVPs
* Coffee chats
* Interviews

Rules:

* Store `eventId` + `htmlLink`
* Deleting RSVP/booking deletes calendar event
* Calendar selection is configurable per cycle/event

---

## 7) API expectations (non-exhaustive)

### Applicant

* Load dashboard (cycle-scoped)
* Autosave application
* Submit application
* RSVP events
* Book/cancel slots

### Admin

* Full CRUD for cycles, events, questions, slots
* Applicant list + detail
* Review upsert
* Stage updates
* Email sending

---

## 8) Final “done means done” checklist

This is **not complete** unless:

* Users can reload the page mid-application and lose nothing
* Admin can see:

  * who attended events
  * who interviewed someone
  * all reviews + referrals/deferrals
* Calendar events are created and removed correctly
* Emails send using existing infrastructure
* No auth logic is duplicated
* No data exists outside a cycle