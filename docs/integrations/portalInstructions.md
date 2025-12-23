/**
 * GITHUB COPILOT – ABG RECRUITMENT PORTAL IMPLEMENTATION SPEC
 *
 * Overall goal:
 * Build a recruitment portal UI (at https://portal.domain.org) that plugs into
 * the existing ABG website infra. The UI should visually follow the attached
 * screenshot (sidebar + dashboard cards + tasks), but use ABG colors / fonts.
 *
 * Tech stack (reuse existing):
 * - Next.js 14+ with App Router and TypeScript
 * - TailwindCSS for styling
 * - MongoDB (Mongoose models) using the existing connection helper
 * - Existing ABG Events / Notifications models + utilities
 * - Existing auth system with 2 roles: "ADMIN" and "APPLICANT"
 *
 * High-level architecture:
 * - Create a new "Portal" area in the Next.js app router:
 *   app/portal/(portal-layout)/...
 * - All recruitment pages live under /portal/* and are protected by auth.
 * - Use a shared <PortalShell> layout component that implements the sidebar,
 *   top bar, and main content area modeled after the reference screenshot.
 * - Applicants and Admins share the same shell but see different nav items and
 *   different content.
 * - If a user reaches a page they don’t have access to, blur the whole page
 *   content and show a centered modal with the message:
 *   "Oops. You don’t have access to this page."
 *
 * ROUTING
 * =======
 * Public site (already exists):
 *   - https://domain.org/...
 *   - /recruitment should now simply redirect to https://portal.domain.org
 *
 * Portal subdomain:
 *   - https://portal.domain.org/  => Applicant or Admin dashboard depending on role
 *   - /portal/applicant/dashboard => Applicant dashboard
 *   - /portal/admin/dashboard     => Admin dashboard (individual)
 *   - /portal/admin/cycles        => Cycles index ("Main Cycle Page" list)
 *   - /portal/admin/cycles/[cycleId]          => Single cycle view
 *   - /portal/admin/applicants/[applicantId]  => Applicant profile (admin view)
 *   - /portal/admin/settings/rubric           => Rubric template editor per cycle
 *
 * Role guards:
 *   - Create a helper `assertAdmin()` and `assertApplicant()` or similar.
 *   - In server components / API routes, check session.role === "ADMIN" or "APPLICANT".
 *   - If the user is authenticated but lacks permission, render the blurred view
 *     with the "Oops. You don’t have access to this page." modal.
 *
 * LAYOUT / UI
 * ===========
 * Layout should match the reference screenshot:
 *
 * 1. LEFT SIDEBAR
 *    - Sticky full height, teal / dark gradient background to match ABG branding.
 *    - Logo at the top: "ABG Portal" (or ABG mark) similar size to ":RECRUIT".
 *    - Sections:
 *      For ADMIN:
 *        - Dashboard
 *        - Recruitment
 *          - Cycles
 *          - Applicants
 *          - Events (link to existing events admin)
 *        - Admin
 *          - Reports
 *          - Settings
 *      For APPLICANT:
 *        - Dashboard
 *        - Recruitment
 *          - Current Cycle
 *          - Events
 *    - Selected item gets a lighter background and a left accent bar.
 *
 * 2. TOP BAR
 *    - Breadcrumb on the left: e.g. "Home / Dashboard".
 *    - Right side: search icon + small avatar circle with initials.
 *
 * 3. MAIN DASHBOARD (ADMIN)
 *    - First row: 3 metric cards + one promo card (like "Marketplace") modeled
 *      exactly after screenshot.
 *      Example metrics:
 *        - Card 1: "Today’s new applications" + integer count.
 *        - Card 2: "Pending evaluations" (applications assigned to this admin).
 *        - Card 3: "Today’s events" (count from Events system).
 *        - Card 4: a static graphic for "Recruitment Cycle" or "Manage cycles".
 *    - Second row:
 *        Left: large "Upcoming events" card: use existing Events collection.
 *        Right: "Tasks" card with tabs "Pending" and "Completed".
 *            - Pending tasks examples: "Review application for John Doe",
 *              "Score coffee chat for Jane Roe" etc.
 *            - Each task shows:
 *              - title
 *              - priority badge (NORMAL / HIGH)
 *              - due date/time
 *              - a circular check icon to mark complete (POST to API).
 *    - Third row:
 *        - "Pinned Applicants" or "Pinned Jobs" style card, similar to "Pinned Jobs"
 *          card in screenshot. Display top 5 applicants pinned by admin.
 *
 * 4. MAIN DASHBOARD (APPLICANT)
 *    - Use same general layout, but cards are:
 *      Top row:
 *        - A card for "Current Cycle: Winter 2026" with status.
 *        - A card for "Application Status" (Pending / Submitted / Advanced / Rejected).
 *        - A card for "Next Event" (from Events + attendance tracking).
 *        - Optional promo card for "ABG Events".
 *      Second row:
 *        - Left: "Events Timeline" (vertical timeline of key recruitment events).
 *        - Center: "Application Form" or "Application Submitted" state.
 *        - Right: two stacked cards:
 *            * Coffee Chat status: Not Scheduled / Scheduled / Completed
 *            * Interview status: Not Scheduled / Scheduled / Completed
 *      Application center card:
 *        - BEFORE open: show countdown timer until open.
 *        - WHILE open and not submitted: show editable form fields.
 *        - AFTER submission: disable form and display "Your application is submitted."
 *        - AFTER moving to next round: message "Congratulations! You have been
 *          selected to move onto the next round..." plus button(s) to open
 *          coffee chat / interview signup pages in new tabs.
 *
 * DATA MODELS (MONGODB / MONGOOSE)
 * =================================
 *
 * 1) RecruitmentCycle
 *    Collection: recruitmentCycles
 *    Fields:
 *      - _id
 *      - name           (e.g. "Winter 2026 Cycle")
 *      - slug           ("winter-2026")
 *      - startDate      (Date)
 *      - endDate        (Date)
 *      - status         ("DRAFT" | "ACTIVE" | "CLOSED")
 *      - rubricTemplateId (ObjectId => RubricTemplate, nullable)
 *      - events: [{
 *          eventId: ObjectId (reference to existing Events collection),
 *          label: string, // e.g. "Mass Meeting"
 *          order: number
 *        }]
 *      - createdAt, updatedAt
 *
 * 2) ApplicantProfile
 *    Collection: applicantProfiles
 *    Fields:
 *      - _id
 *      - userId         (reference to existing User model, email is .edu)
 *      - currentCycleId (reference to RecruitmentCycle)
 *      - roleAppliedFor ("BUSINESS" | "ENGINEERING")
 *      - timeline: [{
 *          cycleId: ObjectId,
 *          items: [{
 *            key: "APPLICATION" | "COFFEE_CHAT" | "INTERVIEW" | "STATUS_UPDATE" | "EVENT",
 *            label: string,
 *            status: "PENDING" | "COMPLETED" | "SKIPPED",
 *            completedAt?: Date,
 *            eventId?: ObjectId
 *          }]
 *        }]
 *      - coffeeChat: {
 *          status: "NOT_SCHEDULED" | "SCHEDULED" | "COMPLETED",
 *          eventId?: ObjectId,
 *          slotStart?: Date,
 *          slotEnd?: Date
 *        }
 *      - interview: {
 *          status: "NOT_SCHEDULED" | "SCHEDULED" | "COMPLETED",
 *          type?: "TECHNICAL" | "BEHAVIORAL",
 *          eventId?: ObjectId,
 *          slotStart?: Date,
 *          slotEnd?: Date
 *        }
 *      - status: "PENDING" | "ADVANCED" | "REJECTED" | "OFFERED"
 *      - createdAt, updatedAt
 *
 * 3) Application
 *    Collection: applications
 *    Fields:
 *      - _id
 *      - applicantProfileId (ObjectId)
 *      - cycleId            (ObjectId)
 *      - roleAppliedFor     ("BUSINESS" | "ENGINEERING")
 *      - responses: { [questionId: string]: string }
 *      - submitted: boolean
 *      - submittedAt?: Date
 *      - lastEditedAt: Date
 *
 * 4) RubricTemplate
 *    Collection: rubricTemplates
 *    Fields:
 *      - _id
 *      - cycleId: ObjectId
 *      - name: string
 *      - criteria: [{
 *          key: string,          // e.g. "python_knowledge"
 *          label: string,        // "Python Knowledge"
 *          minScore: number,     // default 0
 *          maxScore: number,     // default 10
 *          constant: boolean     // true => always present across cycles
 *        }]
 *      - createdAt, updatedAt
 *
 * 5) Rubric
 *    Collection: rubrics
 *    Fields:
 *      - _id
 *      - applicantProfileId: ObjectId
 *      - cycleId: ObjectId
 *      - name: "Anonymous Rubric 1" | "Anonymous Rubric 2"
 *      - evaluatorAdminId: ObjectId (User id for Admin)
 *      - scores: [{
 *          criterionKey: string,        // matches RubricTemplate.criteria.key
 *          score: number,               // 0–10, may be decimal (e.g. 7.5)
 *          notes: string
 *        }]
 *      - totalScore: number             // sum(scores[].score)
 *      - createdAt, updatedAt
 *
 * NOTE: An applicant will have exactly two Rubric documents per cycle.
 * Past cycles remain associated via cycleId and should be visible to admins.
 *
 * BUSINESS LOGIC
 * ==============
 *
 * Automatic scoring and filtering:
 * - For each applicant in a cycle, the "overall score" is:
 *      totalScore = average of the two evaluator Rubric.totalScore values.
 * - On the Main Cycle Page, add controls to:
 *      * Sort applicants by totalScore, name, or roleAppliedFor.
 *      * "Show top N applicants" where N is number input.
 *        Implementation: query all applicants for this cycle, join Rubric data,
 *        compute scores in aggregation pipeline, then return the top N.
 *
 * Dynamic rubric editing:
 * - Admins edit rubric criteria per cycle via /portal/admin/settings/rubric.
 * - When they update the RubricTemplate for a cycle:
 *      * Existing rubric documents should be updated to include any new
 *        criteria with null/0 scores.
 *      * Removing a criterion should either be disallowed if used, or should
 *        mark it as "archived" instead of fully deleting to keep history.
 * - Constant criteria (Python Knowledge, Behavioral Fit, Event Attendance)
 *   must always exist in the template and cannot be removed, only relabeled.
 *
 * Applicant visibility:
 * - Applicants NEVER see any Rubric data. Only Admin pages fetch Rubric models.
 *
 * EVENTS + ATTENDANCE + NOTIFICATIONS INTEGRATION
 * ===============================================
 *
 * - Use existing Events collection and event check-in / attendance logic.
 * - For each event in a RecruitmentCycle, store the eventId in the cycle.events[].
 * - The applicant timeline and card statuses (Coffee Chat, Interview, Events
 *   Timeline) should be derived from:
 *      * Event attendance (checked-in flag)
 *      * CoffeeChat / Interview slot assignment on ApplicantProfile
 * - Whenever an admin changes an applicant's status (e.g. moves them to the
 *   next round, sets up an interview, etc.), call the existing Notification
 *   service to send an email / in-portal notification.
 *   Example (pseudo):
 *      await sendNotification({
 *        userId: applicantProfile.userId,
 *        type: "RECRUITMENT_STATUS_UPDATE",
 *        metadata: { cycleId, newStatus }
 *      })
 *
 * PERMISSIONS + ERROR STATES
 * ==========================
 *
 * - All /portal routes require authenticated session.
 * - If not authenticated, redirect to existing login flow.
 * - If authenticated but wrong role:
 *      * Show page with blurred background (use CSS backdrop-filter: blur)
 *      * Centered card: "Oops. You don’t have access to this page."
 * - Admin pages must be server-side protected (do not render data client-side
 *   unless role has been validated).
 *
 * EXAMPLE USER FLOWS
 * ==================
 *
 * Applicant (John):
 * 1. Signs in to https://portal.domain.org with his umich .edu account.
 * 2. If he has no ApplicantProfile for the active cycle, create one and link it.
 * 3. On the dashboard:
 *    - Left: Events Timeline, with checkmarks for events he has attended.
 *    - Center: application form card with timer (if not live) or form (if live).
 *    - Right: Coffee Chat and Interview cards showing "No time selected"
 *      until assigned.
 * 4. John fills out the application and clicks "Submit".
 *    - Confirm modal.
 *    - After confirm, mark `submitted = true`, `submittedAt = now`, freeze form.
 * 5. If admins advance him to next round and schedule interviews, the status
 *    and right-side cards update automatically. Buttons link out to existing
 *    signup pages in new tabs.
 *
 * Admin (Jacob):
 * 1. Signs in and is directed to /portal/admin/dashboard.
 * 2. The dashboard shows:
 *    - Today’s new applications
 *    - Pending evaluations assigned to him
 *    - Today’s events
 *    - Upcoming events card
 *    - Task list with "Review" / "Score" tasks.
 * 3. Navigates to /portal/admin/cycles/[cycleId]:
 *    - Sees table of all applicants with:
 *        * name
 *        * roleAppliedFor
 *        * application status
 *        * average rubric score
 *        * attendance summary
 *    - Can sort by score, name, or role.
 *    - Can request "Top N" applicants, which filters the table.
 * 4. Clicks an applicant row to open /portal/admin/applicants/[applicantId]:
 *    - Sees Application responses, attendance, and two anonymous rubrics.
 *    - Can edit rubric scores and notes inline; totalScore recalculates.
 *
 * DEPLOYMENT – portal.domain.org
 * ==============================
 *
 * Steps Copilot should not automate but code should assume:
 * - The Next.js app will be deployed behind a reverse proxy or hosting service
 *   that supports multiple custom domains.
 * - Configure DNS:
 *      * Add CNAME or A record for `portal.domain.org` pointing to the same
 *        frontend host used for the main ABG site (e.g. Amplify/Netlify/Vercel).
 * - In app config:
 *      * Ensure Next.js recognizes `portal.domain.org` as a valid domain.
 *      * /portal routes should render both when accessed via
 *        https://domain.org/portal and https://portal.domain.org/ .
 *      * Optionally add a redirect rule:
 *          from: /recruitment
 *          to: https://portal.domain.org/
 *
 * IMPLEMENTATION ORDER (for Copilot to assist step-by-step)
 * ========================================================
 * 1. Create Mongoose models: RecruitmentCycle, ApplicantProfile, Application,
 *    RubricTemplate, Rubric.
 * 2. Implement /portal layout shell (sidebar + top bar + main container).
 * 3. Implement role-aware Nav and route guards (blurred unauthorized page).
 * 4. Build Applicant Dashboard UI and connect it to Application +
 *    ApplicantProfile + Events data.
 * 5. Build Admin Dashboard UI with metrics, upcoming events, and tasks.
 * 6. Build Main Cycle Page (+ API route) that fetches applicants with rubric
 *    scores and supports sorting/filtering/top N.
 * 7. Build Applicant Admin view page with application, attendance, and rubrics.
 * 8. Build RubricTemplate editor and wiring for dynamic rubric criteria.
 * 9. Integrate with existing Notifications service for status updates.
 * 10. Seed "Winter 2026 Cycle" data and verify end-to-end Applicant + Admin flows.
 */
