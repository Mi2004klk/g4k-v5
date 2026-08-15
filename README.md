# Games4King Workplace OS

A single, modern workplace platform that brings **attendance, leave, people management, and company-wide visibility** together in one place — built for the whole team: business owners, HR, and employees.

---

## 🛠 What this product does

Games4King Workplace OS replaces scattered spreadsheets and punch machines with one connected system:

- **Sign in & Access** — secure login for everyone, with role-based views.
- **Daily Attendance** — clock in, take breaks, clock out, live running timers, automatic overtime/late tracking, and a personal calendar heat-map.
- **Leave Management** — request time off, route it to the right approver (employee → HR → admin), and track status live.
- **People Directory** — searchable company directory with direct messaging.
- **Owner & HR Control** — manage employees, departments, approvals, attendance oversight, company-wide reports, holidays, and settings.
- **Real-Time Updates** — notifications, messages, and dashboard changes appear live without refreshing.

---

## 🚀 Deployment Status
**Deployment is Perfect and Fully Synced.**
- **Frontend**: Live on **Vercel**.
- **Backend API**: Live on **Google Cloud Run**.
- **Database**: Live on **Supabase**.

---

## 💻 Developer Setup & Architecture

### Prerequisites
- Node.js 24.x
- PHP 8.4
- pnpm 9.x
- Composer

### Local Setup
1. Clone the repository
2. Frontend setup: `cd apps/web && pnpm install`
3. Backend setup: `cd apps/api && composer install`
4. Copy `.env.example` to `.env` in both directories and fill in the required values
5. Run migrations: `cd apps/api && php artisan migrate`
6. Start local servers:
   - Backend: `php artisan serve`
   - Frontend: `cd apps/web && pnpm dev`

### Architecture
- **Backend API**: Laravel 11 running on Google Cloud Run (containerized)
- **Frontend**: Next.js 14 running on Vercel
- **Database**: PostgreSQL hosted on Supabase (connection pooling enabled)
- **Real-time**: Pusher WebSocket integration for live chat and notifications

### Deployment Flow
- Push to `main` branch triggers:
  1. **Google Cloud Build** (`cloudbuild.yaml`): Builds backend Docker image, runs migrations, verifies endpoints, and deploys `g4k-api`, `g4k-worker`, and `g4k-scheduler` to Cloud Run.
  2. **Vercel**: Automatically pulls, builds, and deploys the Next.js web application.

---


ROLES AT A GLANCE

Admin
- Full control over the entire system
- Creates and manages HR accounts, employee accounts, and departments
- Can do everything HR and Employee can do
- Oversees everything from a company-wide organized view

HR
- Manages day-to-day team operations
- Creates projects, assigns tasks, handles employee leave requests, approves submitted work
- Communicates with the team through the app

Employee
- Works on assigned tasks and projects
- Logs own attendance, tracks own progress
- Communicates with HR and Admin through the app

---

SECTION 1 — SIGN IN (All Users)

Every user starts here, regardless of role.

Sign In Screen
- Display the landscape version of the company logo from the assets folder at the top of the page
- Short welcoming description shown below the logo
- Copyright text at bottom of page: Games4King Workplace OS
- Info icon beside the copyright — clicking or hovering shows a tooltip: Gen2k Conglomerate (2018) • Milestone 1
- User enters Email or Employee ID and Password
- Password is hidden by default with a toggle to show it
- Click Sign In — loading animation plays
- If login fails, an error message appears

Dual Role Login
- If a user has two roles (e.g., Employee + HR), a Role Selection screen appears after login
- All assigned roles are listed
- User taps the role they want for this session
- They land on the correct dashboard for that role

Forgot Password Flow
- A Forgot Password link is shown below the sign in form
- User enters their email or employee ID
- They receive a reset link
- They set a new password and are redirected to sign in

---

SECTION 2 — ADMIN MODULE

Admin has a full company-wide view.
Manages HR accounts, employee accounts, departments, projects, attendance, and approvals.

ADMIN DASHBOARD

First screen Admin sees after logging in. A company-wide summary.

- Total employees (active / inactive) — compact widget, hover or click info icon for quick summary
- Active projects across all teams — compact widget, hover or click info icon for quick summary
- Today's overall attendance summary (present, absent, late) — compact widget, hover or click info icon
- Pending approvals (tasks, projects, leave requests from employees and HR) — extended widget with quick access, hover or click info icon
- Recent activity feed — extended view, dense data, all relevant platform activity shown, no useless data
- Quick task assignment widget — click button, form opens, fill details, assign employee, add

ADMIN — USER MANAGEMENT

HR Accounts
- Create a new HR account: name, email, employee ID, department, designation
- Edit any HR account profile
- Assign or change the department an HR manages
- Deactivate or delete an HR account
- Reset an HR account password
- View an HR member's activity log

Employee Accounts
- Create a new employee account: name, email, employee ID, department, team, designation
- Edit any employee profile
- Assign or reassign employees to departments and teams
- Assign a dual role (e.g., an employee who is also an HR)
- Deactivate or delete an employee account
- Reset an employee password
- View an employee's activity log

ADMIN — DEPARTMENT MANAGEMENT

Admin is the only one who can create and manage departments.

- Create a new department: name, description
- Edit department name or details
- Assign one or more HR members to a department
- Assign employees to a department
- View all departments and their full member list
- Archive or delete a department

ADMIN — ATTENDANCE

Admin has a full attendance view across the entire company.

- View attendance for every employee and HR member
- Filter by date, department, or individual person
- Calendar view with heat map (company-wide, same as HR/Employee view)
- Click any date for any person to see their full day summary
- Manually correct an attendance entry if there is an error
- Approve or reject HR leave requests
- View leave history for all users
- Export attendance data as a report

ADMIN — PROJECTS

Admin can see and manage all projects, regardless of which HR created them.

- View all active and completed projects across all departments
- Create a new project directly (same capability as HR)
- Assign employees per project, create team for project, allocate tasks per employee under project, add QA form to be filled on submission
- Edit any project's details
- Archive or delete any project
- View progress of every project in the company
- Approve or request revision on any completed project submission
- Access every project's chat

ADMIN — TASK MANAGEMENT

- View all tasks across all projects and all personal task lists
- Create tasks and assign to any employee (individual, team, or company-wide)
- Edit or reassign any task
- Approve or reject task submissions from any employee
- Monitor task completion rates

ADMIN — CHAT

- Access the Company Global Chat
- Access every project chat in the company
- Direct chat with any HR member or employee
- Post company-wide announcements visible to all users

ADMIN — REPORTS

- Attendance reports (by date range, department, or individual)
- Project completion reports
- Task completion statistics
- Employee productivity summary
- Export any report as PDF or spreadsheet

ADMIN — SYSTEM SETTINGS

- Company profile: logo, company name, timezone
- Define standard working hours
- Manage the company holiday calendar
- Set password policies: minimum length, expiry, etc.
- Configure session and device rules
- Notification preferences for the whole system

ADMIN — PROFILE

- View and edit own profile
- Change password
- View all logged-in devices
- Log out from any device remotely

---

SECTION 3 — HR MODULE

HR manages the team. Creates projects, assigns tasks, handles attendance oversight, and processes approvals.

HR DASHBOARD

First screen HR sees each day. A team-level overview.

- How many employees are present, absent, or late today
- Number of active projects
- Pending leave requests needing HR approval
- Pending task and project submissions needing review
- Quick task assignment widget — assign tasks directly from the dashboard to any employee
- When a task is assigned from this widget, it immediately appears in the employee's task list
- When the employee completes it, a notification is automatically posted in the Global Chat

HR — ATTENDANCE

HR's Own Attendance
- Clock In when shift starts
- Start Break when stepping away
- End Break when returning
- Clock Out when done for the day
- Full shift timeline saved automatically

HR's Own Attendance History
- Calendar view with heat map showing active days
- Click or hover any date to see: clock-in time, breaks, clock-out time, total hours, projects worked on, tasks completed

HR's Own Leave Requests
- Submit a leave request: choose dates, write reason, submit
- Goes to Admin for approval
- View history of own leave requests and their status: Pending / Approved / Rejected

Employee Attendance Overview (HR-only view)
- See every employee's shift status for today
- Filter by present, absent, or late
- View each employee's leave requests
- Approve or reject employee leave requests

Holidays and Company Events
- View the upcoming holiday calendar (managed by Admin)
- Receive a reminder notification 10 days before each holiday or company event

HR — PROJECTS

Creating and Managing a Project
- Create a new project: name, description, priority level, deadline, team
- Create team for project, allocate tasks per employee under project, add QA form to be filled on submission
- Edit project details at any time
- Mark a project as complete or archive it
- View progress of all projects

Assigning a Team to a Project
- Search for employees and add them to the project
- When an employee is added, they automatically get access to: the project, its task list, and its group chat

Managing Tasks Inside a Project
- Create tasks within a project
- Assign each task to one employee or multiple employees
- Create project-wide tasks visible to all team members
- Edit or delete tasks
- When an employee submits a completed task, HR gets a review request
- HR approves the task or requests a redo
- Employee sees the status update instantly

Project Sorting
- Sort any project list by: Created Date, Deadline, or Priority
- Each in Ascending or Descending order

Project Chat
- Each project has its own group chat
- Only assigned employees and HR can access it
- Task completion alerts appear in this chat automatically

Project Completion
- When employee submits the entire project as complete, HR receives a notification
- HR reviews and approves or requests a redo
- Employee sees the result
- Admin can see all of this from their view

Project History
- View a log of all completed projects with: team members, tasks completed, total time spent, completion date, and final approval status

HR — CHAT

- Global Chat: everyone in the company (Admin, HR, all Employees) in one shared conversation
- Project Chats: one chat per project, auto-created when a project is created, includes only that project's team, task completion alerts appear automatically
- Direct Chat: one-on-one with any employee or Admin
- Custom Group Chats: HR can create a group and add specific employees, employees can only see groups they are added to

Notification Center (inside Chat)
- Leave requests from employees
- Task submissions needing approval
- Project submissions needing approval
- Company announcements
- Upcoming holiday reminders
- Employee feedback or complaints

HR — PROFILE

- View and update own profile: photo, name, phone, designation
- Change password
- View all devices currently logged in to this account
- Log out from any specific device remotely
- Log out from the current device

---

SECTION 4 — EMPLOYEE MODULE

Employees use the app to do their work, track their time, and stay in communication with their team.

EMPLOYEE DASHBOARD

A personal daily summary.

- Total active projects currently assigned
- Total pending tasks across all projects
- Attendance widget on the right side: Start Shift, Pause for Break, End Shift — with a live running timer showing total time worked today
- Most recently worked task with a visual progress bar showing completion percentage
- Task approval status panel: Pending Approval / Approved / Redo Required (for all submitted tasks)

EMPLOYEE — ATTENDANCE

Own Attendance Actions
- Clock In → Start Break → End Break → Clock Out
- Full shift timeline saved automatically

Own Attendance History
- Calendar view with heat map
- Click any date to see: clock-in, breaks, clock-out, total hours, projects worked, tasks completed

Own Leave Requests
- Submit a leave request: choose date(s), write reason, submit
- Goes to HR for approval
- View history and current status: Pending / Approved / Rejected

EMPLOYEE — PROJECTS

Assigned Projects
- Employees only see projects they have been added to
- Each project shows: name, description, priority, deadline, current progress, and status

Tasks Inside a Project
- View all tasks assigned to them within that project
- Update task progress as they work
- Mark a task as complete and submit for HR approval after filling the QA form created by HR and Admin
- If permitted by HR, create their own tasks inside the project

Personal Task List (My Tasks)
- A private to-do list not tied to any project
- HR or Admin can assign tasks here
- Employee can also create their own personal tasks here

Sorting Projects
- Sort by: Created Date, Deadline, or Priority
- Ascending or Descending

Project Work Timer
- Each project has its own timer
- Start Timer when beginning work
- Pause Timer for breaks
- Resume Timer when returning
- End Session when done for the day
- Total time per project is tracked and logged

Completing and Submitting a Project
- Click Complete Project and write a short completion report
- HR and Admin are automatically notified
- Employee waits for: Approved or Redo Required
- Status is visible on the dashboard and in project history

Project History
- View a log of all completed projects with: time spent, tasks completed, completion date, and final approval result

EMPLOYEE — CHAT

- Global Chat: company-wide conversation, all employees, HR, and Admin
- Direct Chats: one-on-one with HR, one-on-one with Admin
- Group Chats: created by HR, employee can only see and participate in groups they have been added to
- Project Chats: when added to a project, employee automatically joins that project's chat room

EMPLOYEE — PROFILE

- View and edit own profile: photo, name, phone number
- Change password
- View all devices currently logged in
- Log out from any device remotely
- Log out from the current device

---

SECTION 5 — APPROVAL FLOWS

How work moves through the system from start to finish.

Task Approval
- Employee completes task → submits for review → HR gets notified → HR approves or requests redo → Employee sees status update on dashboard

Project Approval
- Employee submits completed project → HR and Admin are notified → HR reviews → Approves or requests redo → Employee sees the result

Employee Leave
- Employee submits leave request → HR gets notified → HR approves or rejects → Employee sees the result

HR Leave
- HR submits leave request → Admin gets notified → Admin approves or rejects → HR sees the result

Quick Task Assignment
- HR or Admin creates task from dashboard → immediately appears in employee's task list → employee works on it → submits → approval cycle begins

---

SECTION 6 — SYSTEM REQUIREMENTS

AUTHENTICATION
- Forgot password / password reset flow: SMTP and in-app with admin approval
- Account lockout after 5 failed login attempts within 10 minutes
- User can try again after the lockout period ends
- HR and Admin are notified if suspicious login activity is detected

NOTIFICATIONS
- Standalone notification system used only for alerts and reminders
- All project-related and submission notifications managed under the Chat area
- Bell icon with unread count added to every user's top bar
- Notification history and mark-as-read functionality included
- Top bar bell shows only high-priority alerts and system-level global notifications

SEARCH
- Search implemented only where useful and relevant
- No global search needed for this milestone
- Area-specific search added where data is complex to access (e.g., tables, reports)

FILE ATTACHMENTS
- No general file upload capability
- Profile picture update: implemented as a clean separate popup showing file format and size limits
- HR can attach files to projects as images using the same popup with file limit details
- Employees attach files as links or directory info when submitting tasks
- Full file attachment feature to be implemented separately later
- Chat supports file and image sharing

TASK DETAILS
- Each task has an individual priority level: Low / Medium / High / Urgent
- Tasks can be allocated as Global, Department-specific, or Role-specific from the task creation area
- Each task has its own due date
- Each task has reminders

REPORTS AND EXPORT
- Admin can pull: attendance reports, project completion reports, task statistics
- HR can pull limited versions of the same reports
- Export format: Excel as tables

EMPLOYEE ONBOARDING
- When a new account is created and the user logs in for the first time
- A simple setup guide or welcome screen greets them

OVERTIME HANDLING
- When an employee works beyond standard hours, it is tracked
- Added to their attendance info and shift summaries
- Shown as a separate heat map color on the attendance history view

EMPLOYEE COMPLAINT / FEEDBACK CHANNEL
- A private complaint form on the My Profile area
- Submission is sent as a direct message to HR or Admin who receives it
- Receiver also gets a global notification marked as high priority

TASK AND PROJECT MANAGEMENT
- Kanban board view for tasks: To Do / In Progress / Done — as an alternative to list view (both views implemented)
- Employees and HR can leave comments on individual tasks to discuss without switching to chat
- Task dependencies: HR can mark that Task B cannot start until Task A is done

COMMUNICATION
- @mention feature in all chats: typing @ opens a dropdown of people in that chat
- Read receipts in direct messages
- HR can pin important messages at the top of project chats

ATTENDANCE FEATURES
- Automatic reminder to employees who have not clocked in by the start of working hours
- Late badge shown on the employee's record if they clock in after the official start time
- HR can view a weekly or monthly attendance graph for each employee

ADMIN FEATURES
- Admin receives a weekly summary report automatically delivered to their email every Sunday
- Audit log showing every important action in the system: who created what, who approved what, when

USER EXPERIENCE
- Dark mode option — both modes are colorful
  - White mode: colorful with colors and gradients, similar style to ClickUp
  - Dark mode: clean color usage, similar to Adobe products, consistent color implementation
- Tooltips added where relevant
- Quick-action shortcuts on each dashboard so common tasks are one tap away

EMPLOYEE-SPECIFIC
- Employees can set personal reminders on their own tasks
- Employees can add a brief note when submitting a completed task explaining their work, alongside the QA form created by HR and Admin

---

SECTION 7 — UX PATTERNS AND GLOBAL BEHAVIORS

BREADCRUMB NAVIGATION
- Shown below the top bar on detail screens
- Shows the user where they are in the app
- Example: Projects → Website Redesign → Task List → Design Homepage
- Each crumb is a clickable link back to that level
- Especially helpful for nested areas like the project area

PINNED ITEMS (FAVORITES)
- Every project, task, and employee profile can be pinned
- A small star or pin icon appears on hover
- Pinned items appear in a Pinned section at the bottom of the sidebar as quick-jump links, after the primary navigation items
- User can remove pins when no longer relevant
- Can pin each task, each project, and other areas that are not already in the sidebar

DASHBOARD WIDGETS
- Each widget loads independently (if one is slow, the rest still show)
- Each widget is clickable to go deeper (e.g., "12 active projects" links to the projects page)
- A small refresh icon appears on hover for each widget
- Widgets can be optionally dismissed or rearranged by the user

FORMS
- Required fields are marked clearly (all customizable by HR and Admin when creating)
- Validation happens as the user types (triggered on pause after typing, not only on submit)
- Error messages appear directly under the field that has the problem
- A loading state plays on the submit button during save
- Success confirmation appears as a toast notification at the bottom right
- Long forms are broken into sections with clear headings
- Save as Draft available for all forms except quick actions
- Draft is restored the next time the form is opened

LOADING STATES
- Skeleton Loaders: gray shimmering placeholders in the exact shape of the content, shown while a page or widget is loading
- Button Loading State: button text changes to a small animated dot-loader and becomes non-clickable on submit, preventing double submissions
- Progress Bars: all progress bars animate from 0% to their current value when they first appear on screen

EMPTY STATES
- Every list or section that could be empty shows a helpful message instead of a blank space
  - No projects: "No projects assigned yet. Check back soon or ask your HR."
  - No tasks: "All clear! No tasks pending right now."
  - No notifications: "You're all caught up."
  - No messages: "No messages yet. Start the conversation."
- Each empty state includes a small illustration (simple relevant icons, or the animated logo from the assets folder — mp4 cached and used where relevant)
- Each empty state optionally includes a relevant action button

TOAST NOTIFICATIONS
- Small pop-up messages at the top right of the screen
- Auto-dismiss after 4 seconds
- Each toast has an X to dismiss manually
  - Green (Success): e.g., "Task submitted successfully."
  - Red (Error): e.g., "Something went wrong. Please try again."
  - Amber (Warning): e.g., "Your session will expire in 5 minutes."
  - Blue (Info): e.g., "Rajan has started their shift."

INLINE EDITING
- Anywhere a short piece of text is shown (task name, project name, department name), hovering shows a small pencil icon
- Clicking the pencil icon turns the text into an editable field in place
- Press Enter to save, Escape to cancel
- No form, no navigation — instant edit

CONFIRMATION DIALOGS
- All destructive actions (delete, deactivate, reject, end session) show a confirmation modal before executing
  - Title: "Are you sure?"
  - Description of what will happen
  - Cancel button and Confirm button
  - Confirm button is red for destructive actions

HOVER STATES AND TOOLTIPS
- Every icon-only button has a tooltip showing its label on hover
  - Example: pause button on the timer shows "Pause Work Session"
  - Example: bell icon shows "Notifications (3 unread)"
- Long text truncated with "..." shows the full text in a tooltip on hover

DRAG AND DROP
- Task Ordering: tasks inside a project's task list can be reordered by dragging, new order saved automatically
- Dashboard Widget Reordering: each user can drag widgets to rearrange them to their preference, layout saved per user
- Task Kanban View: tasks can be dragged between columns (To Do / In Progress / Under Review / Done), dragging updates status automatically

STATUS BADGES
- Every task, project, and leave request has a small colored pill badge showing its current status
  - Gray: Not Started
  - Blue: In Progress
  - Amber: Pending Review / Pending Approval
  - Green: Approved / Completed
  - Red: Redo Required / Rejected / Overdue

LIVE TIMER DISPLAY
- Shift timer and project work timers display as HH:MM:SS counting upward
- When a timer has been running beyond the expected work duration, the timer text turns amber to signal overtime
- Timer continues running if the user navigates away
- Timer only stops when the user explicitly clicks End Shift or End Session

AUTO-SAVE
- All forms auto-save as a draft every 30 seconds
- If the user accidentally closes the tab or navigates away mid-form, a banner appears on return: "You have an unsaved draft. Continue editing?" with a restore button

KEYBOARD SHORTCUTS
- Ctrl+K: Open command palette
- Ctrl+N: Create new (context-aware: new task on task page, new project on projects page)
- Ctrl+/: Show all keyboard shortcuts (a help overlay)
- Escape: Close any open modal, dropdown, or panel
- Enter: Submit focused form or confirm dialog

PAGINATION
- Long lists (employee list, attendance logs, notifications) use pagination with page numbers
- Default: 20 items per page
- Dropdown to change to 50 or 100

FILTERS AND SORTING BAR
Every list page has a consistent filter bar below the page header.
- Search within the list (text input)
- Status filter (dropdown with checkboxes for each status)
- Date range filter (From and To date pickers)
- Department or team filter (where relevant)
- Priority filter (where relevant)
- Sort by dropdown + direction toggle (Ascending / Descending arrow button)
- Clear All Filters link (appears only when a filter is active)
- Active filters shown as removable chips below the filter bar

CHAT — READ / UNREAD STATE
- Unread conversations show a colored left border on the conversation item in the chat list
- Message count badge appears next to the conversation name
- Messages are marked as read the moment the conversation is opened and viewed

CHAT — @MENTION
- Typing @ in any chat input opens a dropdown of people in that chat
- Selecting a name inserts their mention
- The mentioned person receives a notification with the message snippet

ACTIVITY LOG (Per Item)
- Every project and task has an activity log accessible by clicking "View History" or the "Activity" tab
- Shows a chronological list of every action taken on that item
  - Example: "Created by Rajan on May 5"
  - Example: "Assigned to Priya on May 6"
  - Example: "Progress updated to 60% on May 10"
  - Example: "Submitted for review on May 12"
  - Example: "Approved by HR (Meena) on May 12"

GANTT CHART VIEW (HR and Admin — Projects)
- An optional view on the projects page
- Clicking "Timeline View" switches from the project list to a horizontal Gantt chart
- Each project is a horizontal bar spanning from its start date to its deadline
- Task milestones appear as small diamond markers on each bar

EMPLOYEE DIRECTORY
- A searchable directory available to everyone in the company
- Grid or list view of all employees
- Each card shows: photo, name, designation, department, and email/phone (if visible)
- Search by name, department, or designation
- Clicking a card shows a public profile view and a Send Message button that opens a direct chat

ANNOUNCEMENT BOARD (inside Chat area)
- Admin posts company-wide announcements (new policies, company news, important dates)
- HR can post team-level announcements
- Employees see all announcements relevant to them
- Announcements can be pinned to stay at the top
- Employees can react to announcements (thumbs up, etc.) — no comment section to keep it formal
- Notifications are sent to all relevant users when a new announcement is posted
- Announcements are also shown on the dashboard for all users so they are never ignored
- Can be closed using the X button on the dashboard

QUICK NOTES (Sticky Notes)
- A lightweight personal notes area accessible from the sidebar or command palette
- Create short notes for personal reminders
- Pin a note to appear on the dashboard
- Notes are private — only visible to the person who created them
- Not a full document editor — just a quick notepad

RECURRING TASKS
- When creating a task, HR can set it to repeat
- Recurrence option is placed in an advanced collapsed area inside the task creation form to avoid cluttering the main view
- Repeat options: Daily, Weekly on specific days, Monthly on a specific date
- Task automatically recreates itself when the current instance is completed
- HR is notified each time a recurring task is completed
- HR can turn off the recurrence at any time

SHIFT REMINDER NOTIFICATIONS
- 15 minutes before standard work start time: employee receives an alert — "Your shift starts in 15 minutes. Don't forget to clock in!"
- If an employee has not clocked in 30 minutes after start time: HR receives an alert about that specific employee being late or absent
- Reminder times are configurable in System Settings

---

SECTION 8 — MOBILE BEHAVIOR

MOBILE NAVIGATION
- Bottom navigation bar with a maximum of 5 icons, instead of a sidebar
- Sidebar converts to a full-screen menu accessible via a hamburger icon
- The attendance widget is the largest and most prominent element on the mobile dashboard — one big Start Shift button that cannot be missed

MOBILE ATTENDANCE WIDGET
- Full-width Start Shift button in green
- Once started: full-width timer display with a Take Break button and an End Shift button, color coded
- Minimum touch target: 48px height on all buttons

MOBILE CHAT
- Chat list on the first view, conversation opens as a full-screen second view
- Back button returns to the chat list
- Message input bar stays fixed at the bottom, above the keyboard

MOBILE FORMS
- One field per screen option for important forms (leave request, task completion) — each field appears full-screen and swiping advances to the next
- Or a standard scrollable single-screen form with large tap targets
- Date pickers use native mobile date pickers for familiarity

OFFLINE BEHAVIOR
- If internet connection drops: a banner appears — "You're offline. Some features may not be available."
- Shift timer continues running locally and syncs when reconnected
- Forms can still be filled out and are queued for submission when connection returns
- Chat shows "Not connected" and queues messages

---

SECTION 9 — SCREEN MAP (App at a Glance)

SHARED SCREENS (All Roles)
Sign In → Role Selection → Dashboard → Chat → Profile → Notifications

ADMIN-ONLY SCREENS
User Management (HR Accounts, Employee Accounts) → Department Management → Company Settings → Reports → Full Attendance Overview → All Projects Overview → All Task Overview → Audit Log

HR SCREENS
HR Dashboard → HR Attendance (own) → Employee Attendance Overview → Leave Requests (own + employee review) → Projects (create, manage, assign) → Tasks (create, assign, approve) → Project History → Chat (Global + Project + Direct + Groups) → Notification Center → HR Profile

EMPLOYEE SCREENS
Employee Dashboard → Attendance (own) → Leave Requests (own) → Projects (assigned only) → My Tasks (personal list) → Project Timer → Project History → Chat (Global + Project + Direct + Groups) → Employee Profile

SIDEBAR NAVIGATION

Admin Sidebar
- Dashboard
- Team
  - Attendance
  - HR Accounts
  - Employee Accounts
- Projects
  - Projects with Team
  - Tasks
  - Progress
  - Global Tasks
  - Project-specific Tasks
- Tasks (personal tasks as to-do, reminder)
- Chat
- Reports
- My Profile
  - Departments
  - Settings

HR Sidebar
- Dashboard
- Attendance
  - My Attendance
  - Employee Attendance
  - Leave Requests
- Projects
  - Projects with Team
  - Tasks
  - Progress
  - Global Tasks
  - Project-specific Tasks
  - Personal Tasks as to-do
- Chat
- My Profile

Employee Sidebar
- Dashboard
- Attendance
  - My Attendance
  - Leave Requests
- Projects
  - Projects with Team
  - Tasks
  - Progress
  - Global Tasks
  - Project-specific Tasks
  - Personal Tasks as to-do
- Chat
- My Profile

---

Milestone-3 V2 re-wiring : Reference Document — Games4King Workplace OS
