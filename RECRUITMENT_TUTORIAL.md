# ABG Interview System Tutorial for Recruitment Team

## Overview
The ABG website now includes a complete interview booking system with two main pages:
1. **Public Interview Booking Page** (`/interviews`) - For students to book slots
2. **Admin Interview Management Page** (`/admin/interviews`) - For recruitment team management

---

## 🎯 Public Interview Booking Page (`/interviews`)

### What Students See
- **Calendar View**: Interactive calendar showing available interview slots
- **Filter Options**: 
  - Room filter (In-Person vs Virtual)
  - Time filter (Morning, Afternoon, Evening)
- **Booking Process**: Students can click available slots and book them
- **Access Control**: Only approved students (on whitelist) can book interviews

### Student Experience
1. Student visits `/interviews`
2. System checks if their @umich.edu email is approved
3. If approved: They see available slots and can book
4. If not approved: They see a message to contact recruitment team
5. After booking: Automatic Google Calendar invite sent

### Key Features for Students
- ✅ Real-time availability updates
- ✅ Automatic calendar integration
- ✅ Email confirmations
- ✅ Easy cancellation (if needed)
- ✅ Mobile-responsive design

---

## 🛠️ Admin Interview Management (`/admin/interviews`)

### Access Requirements
- Must be logged in as admin
- Visit `/admin/interviews`

### Dashboard Overview
The admin page shows:
- **Summary Stats**: Total slots, booked slots, available slots
- **Approved Students Whitelist**: List of students who can book interviews
- **Interview Slots Management**: All scheduled interview slots
- **Application Viewer**: View student applications with file attachments

---

## 📋 Admin Functions Guide

### 1. Managing Approved Students (Whitelist)

**Adding Students:**
1. Click "Add Email" button in the Approved Students section
2. Enter the student's @umich.edu email address
3. Click "Add to Whitelist"
4. Student can now book interview slots

**Removing Students:**
1. Find the student in the whitelist
2. Click the "Remove" button next to their email
3. Student will no longer be able to book new slots

### 2. Managing Interview Slots

**Viewing All Slots:**
- Green badges = Available slots
- Blue badges = Booked slots
- Each slot shows: Date, Time, Room, Student (if booked)

**Canceling Booked Interviews:**
1. Find the booked slot (blue badge)
2. Click "Cancel Interview" button
3. Slot becomes available again
4. Student receives cancellation notification

### 3. Viewing Student Applications

**How to View Applications:**
1. Find a booked interview slot
2. Click "View Application" button next to the student's name
3. A popup modal opens with their complete application

**What You'll See in Applications:**
- **Student Information**: Name, email, submission date
- **All Form Responses**: Every question and their answers
- **File Attachments**: 
  - Images display as previews
  - Documents show download options
  - PDF files can be downloaded
- **Debug Information**: Technical details if files don't load properly

**File Handling:**
- ✅ **Images**: Automatic preview (JPG, PNG, GIF, etc.)
- ✅ **Documents**: Download button for PDFs, Word docs, etc.
- ✅ **Error Handling**: If preview fails, download option is always available
- ✅ **Debug Mode**: Shows technical info if files don't display

---

## 🔧 Common Admin Tasks

### Weekly Workflow
1. **Review Applications**: Check new applications that came in
2. **Update Whitelist**: Add approved students to interview whitelist
3. **Monitor Bookings**: Check which slots are being booked
4. **Review Student Files**: Look at portfolios, resumes, cover letters

### Before Interview Day
1. **Export Schedule**: Use the calendar view to see the day's interviews
2. **Review Applications**: Read through each student's application
3. **Prepare Questions**: Based on their submitted materials

### Troubleshooting

**If a student says they can't book:**
1. Check if their email is in the whitelist
2. Verify they're using their @umich.edu email
3. Confirm there are available slots for their preferred times

**If application files won't display:**
1. Try the "Download" button - files can always be downloaded
2. Check the debug information in the yellow box
3. Most file issues are resolved by downloading instead of preview

**If you need to cancel many interviews:**
1. Use the individual "Cancel Interview" buttons
2. Each cancellation automatically notifies the student

---

## 📊 Understanding the System

### Student Flow
1. Student submits application form
2. Recruitment team reviews application
3. If approved: Student email added to whitelist
4. Student can now book interview slot
5. Student receives calendar invite
6. Admin can view their application anytime

### Data Integration
- **Applications**: Pulled from form submissions
- **Interview Slots**: Managed through admin interface
- **Calendar**: Automatic Google Calendar integration
- **Whitelist**: Controls who can book interviews

---

## 🚨 Important Notes

### Security
- Only @umich.edu emails can access the system
- Whitelist provides additional access control
- Admin functions require admin login

### File Privacy
- Student files are only visible to logged-in admins
- Files are securely stored and transmitted
- Download tracking for audit purposes

### System Limits
- Students can book one slot at a time
- Slots can be canceled and rebooked
- All actions are logged for tracking

---

## 📞 Support

If you encounter any issues:
1. Check this tutorial first
2. Try refreshing the page
3. Verify you're logged in as admin
4. Contact the technical team with specific error messages

---

## 🎉 Quick Start Checklist

**For New Recruitment Cycles:**
- [ ] Create interview slots for the semester
- [ ] Review incoming applications
- [ ] Add approved students to whitelist
- [ ] Monitor bookings and cancellations
- [ ] Review applications before interviews

**Daily Tasks:**
- [ ] Check for new bookings
- [ ] Review student applications
- [ ] Update whitelist as needed
- [ ] Handle any cancellations

The system is designed to be intuitive and require minimal training. The most common tasks are adding students to the whitelist and viewing their applications before interviews.