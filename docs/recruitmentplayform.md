Main Objective: 
To create a fully integrated, dynamic recruitment system with an elevated UI housed within the ABG website that combines the functionality of existing systems and creates new ones. 

Sub-Objectives:
This system will combine pages and functionalities related to events and general timeline, applicant user profile interface, coffee chat sign up system, interview sign up, interview notification, interview administrator evaluation interfaces, and host the data of each cycle within the ABG website for administrators to access.
This system will create new elements by creating an intermediary space to track the progress of various applicants for administrators to view all application information of the user in one place.
This system will also automate the recruitment process by building a system to automatically filter applicants that will move on to the next stage of the recruitment process based on a rubric that is created by administrators.
The rubric used to evaluate and filter applicants to move onto each stage of the recruitment cycle will be dynamic. Administrators may edit this rubric at any time and the system will adapt in real time to produce the best candidates for the next round. Administrators may keep the same rubric from the previous cycle or write a new rubric when a new cycle begins.  
All new webpages, interfaces, and designs for these new elements will be coded and set up using the provided wireframes at the end of this document.
Whenever possible, use existing functionalities that the ABG website already has. 
The system will send out automatic notifications to applicants using ABG’s existing notification system. 

Authentication and Errors:
Like the rest of the ABG website, there are two different types of users: Administrators and Applicants
The General Set of Pages is Home, Projects, Events, Newsroom, Internships, and Team
Applicants can only see the portion of the ABG website designated to them. This involves:
Applicant Dashboard
Recruitment Main Page 
General Set
Administrators can
Administrator Dashboard (individual)
Recruitment Cycle Page
General Set 
If an Applicant or Administrator somehow navigates to a page they are not supposed to, the ABG website will automatically blur the page and have a small box appear in the center of the screen that says “Oops. You don’t have access to this page.”





Requirements:
Cycles
All Recruitment data will be organized by Cycle. Cycles will be a broad framework/class and each Cycle titled something along the lines of “Winter 2026 Cycle” or “Fall 2026 Cycle”. Cycles will have access to all Applicant Profiles. 
Applicant Profiles contain their application form responses and their Rubric. 
Administrators may create Cycles using the administrative interface.
Administrators may view each Cycle as a webpage. This webpage is sort of like a database. This webpage will show a table that lists a link to every application for that Cycle. 
There will be a sorting system that automatically produces the top applicants at the request of an administrator. For example, if the administrator wishes to see the top 30 applicants, the system will filter through the entire database of applicants for the current cycle and produce a list of applicants that have the highest scores according to the current Cycle’s rubric when the administrator requests. 
Applicants
Each application is linked to an applicant profile that will be accessed on an “Applicant Dashboard” webpage. 
Applicant information is organized on a user profile dashboard. Each applicant has a dashboard based on/linked to their gmail account. 
Each Applicant Dashboard will have the following sections:
Application Timeline
Lists all components of the application on the left hand side vertically in a timeline format and colors the event/task in green when it is attended or completed.
All components include: Application Form, Coffee Chat, Interview, and Status Update
Application Form
Applicants can either apply as a Business or Engineering Project Team Member. Applicants may have 1-2 different application questions based on whether they are applying for a Business or Engineering role. 
The application form is filled out and submitted on the ABG website’s Applicant Dashboard.
Coffee Chat 
Not Scheduled
Scheduled for *insert time and date*
Completed
Interview 
Not Scheduled
Scheduled for *insert time and date*
Completed 
Status
Pending
Approved
Green
Rejected 
Red
Both the Coffee Chat interface and the Interview interface are both “Events” that already have existing systems in place in the ABG repository. The Applicant Dashboard will link to the data embedded in those pages and show the applicant’s information from those pages. 
The user profile dashboard will display the applicant’s progress in the recruitment cycle, the applicant’s application form status, the date and time of their coffee chat, and the date and time of their interview. 
If any of that information is not yet selected, that section of the page will be on a default setting. 
Rubrics
Each applicant profile will be linked to two Rubric objects that are unique to each profile. APPLICANTS CANNOT SEE THEIR RUBRIC SCORES. ONLY ADMINISTRATORS CAN SEE RUBRIC SCORES.
If an applicant has applied in the past, that data will automatically roll over and be displayed when an administrator is viewing that profile. 
Each administrator evaluating the applicant will have a unique Rubric assigned to them that the administrator should edit. For example, Administrator X may be assigned to evaluate Applicant ABC using Anonymous Rubric 2. 
Applicants will have two rubrics evaluated by anonymous administrators who evaluate them at each stage in the recruitment process. 
The Rubrics will be labeled “Anonymous Rubric 1” and “Anonymous Rubric 2”
Rubrics will have three columns: Category, Notes, and Score
Each rubric object is linked to 5-7 categories/criteria that are created based on administrator input. Every applicant has the same rubric. Each criteria will be evaluated using a score that is based on a scale from 0 points to 10 points, with 10 points being the best rating. Partial points (ex. a score of 7.5/10)  with decimals can be administered. 
Criteria should be editable on the administrator’s interface. 
Some criteria will remain constant. These criteria will appear on every single rubric for every single applicant in every single cycle. 
Some Constant Criteria includes:
Python Knowledge
Behavioral Fit
Event Attendance
The overall score for each applicant will be taken by adding up their subsection scores for each criteria. For example, if a candidate is a 9/10 on Technical Competency and a 5/10 on Behavioral Fit and a 10/10 on Coffee Chat Performance and a 10/10 Event Attendance, their score is 9 + 5 + 10 + 10 or 34 points. With these criteria, the highest possible score for this applicant is 50. 

Example 1: User Story

John is a first year student at the University of Michigan who wishes to apply to ABG. When he attends the first ABG recruitment event, he creates an account on the ABG website using his .edu email address. (John signs in at portal.abgumich.org) This is the access point for the recruitment portal, and abgumich.org/recruitment will be changed to portal.abgumich.org 

The ABG website creates a new Applicant Profile page that John can access whenever he logs into the ABG website using his umich email. This profile landing page syncs across time and John may sign in and view his updated Applicant Profile at any point. After John has “checked in” at a specific event, his profile will show a green checkmark next to the name of that recruitment event in the “Events Timeline” where John can view all of the recruitment events and action items. Ex: Case/technical workshop or if he has done a coffee chat or filled out the application form. 

In the center of the page is John’s Application Form. When the Application Form is not live yet, John sees a timer counting down the days, hours, minutes, and seconds until the application is live. The right side of the dashboard shows a box for Coffee Chat and Interview Time Slot. Until John moves on to that portion of the recruitment Cycle (round 1 or round 2 roles), those boxes show “No time selected”. The left side of the dashboard is a vertical timeline that displays the progression of recruiting events for the current cycle. This is the Events Timeline.

After the application goes live, John can see the application questions on his user dashboard and is able to edit his questions until a deadline set by ABG administrators. John’s application form is editable until the deadline is reached or until he presses the red submit button at the bottom of the form. When he presses the submission button, a small notification comes up asking him to confirm his submission before fully submitting his application. After that point, the center of the page where the Application form is will display the message “Your application is submitted.”

After John has completed his application and submitted it, ABG administrators will view his application and score him. John earns a high score and he is selected to move onto the next round, which is a Behavioral Interview. The scoring process will take place on the administrator dashboard, and ABG will use the notification system already set up into the website to notify a user when or if they have moved to the next round or not. When John signs onto his ABG portal after this decision is made by ABG administrators, the Application box in the center of the screen will say “Congratulations! You have been selected to move onto the next round of the recruitment process. Please see the right hand side of the page to sign up for the next event.”

The right hand side of John’s application screen with the Interview and Coffee Chat sign up now shows a button where John can click and the button redirects him to the Coffee Chat sign up or Interview sign up page on a new tab. 

Example 2: Admin Story

Jacob is the VP of Recruitment at ABG. He is a junior at the University of Michigan and has an ABG administrator account linked to his .edu email. He has the VP of Recruitment role / admin role. 

When Jacob signs in, the ABG website sends him to the ABG Administrator Dashboard. As an administrator, Jacob can access the Recruitment Cycle Platform tab on the left, where all other ABG pages available for Administrators are also located. The two pages that are designated only for ABG administrators involved in that are Cycle: his Cycle Administrator Dashboard, and the Main Cycle page. 

On Jacob’s Cycle Administrator Dashboard, he sees his assigned users to evaluate. This page will update according to which stage of the Cycle is in place for administrators. The first stage of the Cycle is Application Evaluation, where Jacob will have anywhere from 5-20 applications to evaluate. Applications are one per Applicant and they are randomly assigned to two Administrators. (The final Application score will average the evaluations of both administrators). In this first stage of Application Evaluation, Jacob will be able to click and view the Application Form responses of the users and also edit their Rubric with comments and a score for each category. The ABG Recruitment system will automatically calculate the total score for that applicant. These comments and scores will sync live across the ABG platform so that other administrators can also see them on the Cycle page.

On the Main Cycle Page, Jacob can see the timeline for that Cycle in a panel on the left, as well as the main Cycle information in the center of the page. The main Cycle takes up most of the space on the page and is essentially a table listing a small peek/link into every single Applicant’s Applicant Profile. Jacob and other administrators can access all Applicant profiles and all Rubrics on this page. When Jacob opens up an Applicant Profile, it shows their Application Form responses as well as what both administrator evaluators have input into their Rubrics.

Jacob can filter the order that this spreadsheet is arranged in by Rubric Score, Applicant Name (A-Z, alphabetical), or Applicant Category (ie. Business or Engineering Applicant). When Jacob clicks onto one of the Applications, he will see the Application Form Responses, Attendance status, and Rubrics of that Applicant. 

Jacob can add new events, change details about events (ex. location, times), and view attendance for each event using a panel on the left side of the page demonstrating the timeline for that Cycle. When Jacob clicks on the event, a new tab will open directing him to the Events editing dashboard where he can change that information. Jacob and other administrators can also see who has signed up/checked in for each event or interview/coffee chat. Jacob can also access the notification system to notify applicants of any announcements.

Example 3: Winter 2026 Cycle
Everything below here is data we will input for this specific cycle.
The general framework of the Winter 2026 Recruitment Cycle will have 5 main events:
Mass Meeting
Applications open 
Speed Dating
Meet the Members
Coffee Chats set at certain times throughout the day and at certain days
Applications Due + Results sent via email
Technical Interview singup slots
Behavioral Interview sign up slots
Final Offers

User Interface:
Colors, fonts will be consistent with the rest of the ABG website
