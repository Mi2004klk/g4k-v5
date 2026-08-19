# 🎮 Games4Kings Workplace OS — Complete User Guide

> **Version:** 2026-08-19 &nbsp;|&nbsp; **Audience:** All users (Employees, HR, Admins) &nbsp;|&nbsp; **Platform:** Web · Mobile · PWA

---

## 📋 Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Getting Started — Access & Login](#3-getting-started--access--login)
4. [Dashboard](#4-dashboard)
5. [Attendance & Time Tracking](#5-attendance--time-tracking)
6. [Leave Management](#6-leave-management)
7. [Projects & Tasks](#7-projects--tasks)
8. [Communications](#8-communications)
9. [Directory & People Management](#9-directory--people-management)
10. [Reports & Exports](#10-reports--exports)
11. [Settings (Admin Only)](#11-settings-admin-only)
12. [My Profile](#12-my-profile)
13. [Mobile Experience](#13-mobile-experience)
14. [How Everything Connects — Key Workflows](#14-how-everything-connects--key-workflows)
15. [Quick Reference — Rules & Limits](#15-quick-reference--rules--limits)

---

## 1. Platform Overview

**Games4Kings Workplace OS** is an all-in-one company management platform that handles attendance, projects, tasks, team communication, and HR operations — all in one place.

### What it does

| Area | What you can do |
|---|---|
| 🕐 **Attendance** | Clock in/out, track breaks, view history, manage leave |
| 📁 **Projects** | Create projects, assign tasks, track progress with QA forms |
| ✅ **Tasks** | Manage to-dos with deadlines, dependencies, timers, and approvals |
| 💬 **Communications** | Chat, announcements, notifications, file sharing |
| 👥 **People** | Employee directory, department management, HR tools |
| 📊 **Reports** | Export attendance, leave, productivity and project data |
| ⚙️ **Settings** | Company setup, schedules, policies, security |

### Works everywhere
- **Web browser** — full-featured desktop experience
- **Mobile app (PWA)** — installable on your phone, works like a native app
- **Offline support** — clock in/out and key actions work even without internet; everything syncs when you reconnect

---

## 2. User Roles & Permissions

The platform has **three roles**. A user can hold more than one role at a time (e.g., an HR manager who is also an employee). When you have multiple roles, you choose which one to operate as after signing in.

### Role Summary

| Feature | 👤 Employee | 👩‍💼 HR | 🔑 Admin |
|---|:---:|:---:|:---:|
| Clock in/out | ✅ | ✅ | ❌ (by design) |
| View own attendance | ✅ | ✅ | ✅ |
| View team attendance | ❌ | ✅ (own departments) | ✅ (all) |
| Request leave | ✅ | ✅ | ✅ |
| Approve leave | ❌ | ✅ (own departments) | ✅ (all) |
| Create employee accounts | ❌ | ✅ | ✅ |
| Create HR/Admin accounts | ❌ | ❌ | ✅ |
| Create & manage projects | ❌ | ✅ | ✅ |
| Create own tasks | ✅ | ✅ | ✅ |
| Approve tasks/projects | ❌ | ✅ | ✅ |
| View directory | ❌ | ✅ | ✅ |
| Post announcements | ❌ | ✅ | ✅ |
| Chat & messaging | ✅ | ✅ | ✅ |
| Run reports & exports | ❌ | ✅ (scoped) | ✅ (all) |
| Access settings | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |

> **Important scoping rules:**
> - HR managers only see employees in **their assigned departments**
> - Employees only see projects and tasks they are **members of**
> - **Nobody can approve their own requests** — ever

---

## 3. Getting Started — Access & Login

### 3.1 Signing In

Go to the login page and enter any one of:
- Your **email address**
- Your **employee ID** (e.g. `G4K-001`)
- Your **username**

Then enter your password and click **Sign In**.

> **Security note:** After **5 failed login attempts**, your account is locked for **10 minutes**. A live countdown shows how long until you can try again.

---

### 3.2 First Login — What to Expect

**Step 1 — Forced Password Change**
If an admin created your account or reset your password, you must set a new password before you can do anything else.

**Step 2 — Onboarding (first login only)**
A quick 3-step setup:
1. **Profile** — add your phone number and emergency contact
2. **Password** — optional password update
3. **Tour** — a guided walkthrough of the platform

**Step 3 — Role Selection (multi-role users only)**
If you have more than one role (e.g. Employee + HR), choose which role to operate as. You can switch roles by signing out and signing back in.

---

### 3.3 Forgot Password

1. Click **Forgot Password** on the login page
2. Enter your email, employee ID, or username
3. You'll receive a **secure reset link** valid for 60 minutes
4. If email isn't configured at your company, your Admin will provide the link directly

---

### 3.4 Sessions & Devices

- Your session stays active for **15 minutes**, then silently refreshes in the background — you won't be logged out unexpectedly
- View and manage all your active sessions under **My Profile → Security & Devices**
- **Revoke** any session remotely — useful if you forgot to log out on another device
- Revoking your current session logs you out immediately

---

### 3.5 Security Alerts

The system automatically detects unusual login activity (such as a login from a new IP address) and:
- Notifies all HR and Admin users
- Sends you an email alert (if email is configured)

---

## 4. Dashboard

The dashboard is your home screen, customized to your role. Every widget on the dashboard:
- Loads independently (you'll see a placeholder while it loads)
- Can be **dragged** to rearrange
- Can be **collapsed** to save space
- **Remembers your layout** across all your devices
- Is **clickable** to open the full detail view

### 4.1 What Each Role Sees

#### 👤 Employee Dashboard
| Widget | What it shows |
|---|---|
| 📢 **Announcements** | Company/team announcements (dismissible) |
| 📁 **Active Projects** | Projects you're a member of |
| ✅ **Pending Tasks** | Tasks assigned to you |
| 🔄 **Task Approval Status** | Status of tasks you've submitted for review |
| 📈 **Recent Task Progress** | Your latest task with a progress bar |
| 🗓️ **Upcoming Holidays** | Next holidays on the company calendar |
| 📝 **Quick Notes** | Personal notepad |
| 🕐 **Time Clock** | Clock in/out from the dashboard |

#### 👩‍💼 HR Dashboard
| Widget | What it shows |
|---|---|
| 👥 **Team Attendance Today** | Present/absent/late/on leave counts for your teams |
| ⏳ **Pending Approvals** | Leave and task submissions waiting for your decision |
| 🚨 **Team Activity** | Late arrivals, open shifts |
| ⚡ **Quick Task** | Create and assign a task instantly |
| 📢 **Announcements** | Company-wide and team announcements |
| 🗓️ **Upcoming Holidays** | Holiday calendar |
| 🕐 **Time Clock** | Your own clock in/out |

#### 🔑 Admin Dashboard
| Widget | What it shows |
|---|---|
| 👥 **Total Employees** | Active/inactive count with department breakdown |
| 📁 **Active Projects** | Company-wide project count |
| 🕐 **Today's Attendance** | Company snapshot |
| ⏳ **Pending Approvals** | Leave + task + project submissions — approve/reject directly from here |
| 📋 **Recent Activity** | Company-wide audit feed |
| ⚡ **Quick Task** | Create and assign a task instantly |

### 4.2 Quick Task (HR & Admin)

The **Quick Task** widget lets you create and assign a task in seconds:
1. Search for and select an employee
2. Enter a title, description, priority, and due date
3. Click **Create** — the task appears in the employee's task list immediately

---

## 5. Attendance & Time Tracking

Navigate to **Attendance & Time** in the sidebar.

### 5.1 Clocking In & Out

The **Time Clock** is the main widget for tracking your work hours. Here's how the flow works:

```
Not Started → Clock In → [Working] → Start Break → [On Break] → End Break → [Working] → Clock Out
```

| Button | What it does |
|---|---|
| **Clock In** | Start your work shift |
| **Start Break** | Pause your shift for a break |
| **End Break** | Resume working |
| **Clock Out** | End your shift for the day |

> **Good to know:**
> - Clocking out while on a break automatically ends your break first
> - If you accidentally close the app, **"Continue Shift"** lets you resume with a confirmation
> - The clock works **offline** — punches are saved and sync when you're back online
> - Duplicate punches are automatically prevented (safe to retry)

**What the clock shows while you're working:**
- A live timer showing hours, minutes, and seconds worked
- Your break history with durations
- Whether you're **Late** (calculated by your work schedule + a grace period)
- **Overtime** when you exceed your scheduled hours

---

### 5.2 Attendance History

Your full history is shown as a **color-coded calendar**:

| Color | Meaning |
|---|---|
| 🟢 Green | Present |
| 🟡 Amber | Late arrival |
| 🔵 Blue | Overtime |
| 🟣 Purple | On leave |
| ⬜ Gray | Absent |
| 🏖️ Light Blue | Public holiday |

Click any day to see:
- Full punch timeline (clock in, breaks, clock out)
- Which device you used
- Time logged per project/task
- Total hours worked and overtime

---

### 5.3 Attendance Corrections (HR & Admin)

HR managers and Admins can fix mistakes in attendance records:

1. Open the team attendance console
2. Find the employee and the day to correct
3. Click **Correct Attendance**
4. Add, edit, or remove punch events
5. Preview the corrected totals before saving
6. Enter a **reason** (required) and save

The employee is automatically notified of any corrections, and a full audit record is kept.

---

### 5.4 Team Attendance Console (HR)

HR managers see a real-time view of their team's attendance:

- **Today's Status tab:** Live table showing every team member's status, clock-in/out times, breaks, and hours worked
  - Click any employee row to see their full day breakdown, attendance history, and trends
- **Trends & Graphs tab:** Weekly/monthly charts and a year-view heatmap of team attendance

The table updates automatically when team members clock in or out — no need to refresh.

---

### 5.5 Company Attendance Console (Admin)

Admins get a company-wide attendance view with three tabs:

1. **Calendar Heatmap** — See each day's overall attendance rate at a glance. Click any day to jump to detailed data
2. **Overview Table** — Filter by date range, department, employee, or status. Export any view
3. **Analytics & Trends** — KPI cards and weekly/monthly trend graphs

---

## 6. Leave Management

### 6.1 Requesting Leave (All roles)

Go to **Attendance & Time → My Leave → New Request**

Fill in:
- **Leave Type:** Casual / Sick / Earned / Unpaid
- **Start Date:** Must be **tomorrow or later** (can't request retroactive leave)
- **End Date:** Must be on or after the start date
- **Reason:** Required (up to 1,000 characters)

> Your form is **auto-saved every 30 seconds** — if you accidentally close the page, your draft will be waiting when you return.

**What happens next:**
- Employee requests → routed to their HR manager
- HR requests → routed to Admin
- The approver gets an instant in-app notification
- Nobody can approve their own request

**The system automatically checks:**
- ✅ Date overlaps with other requests
- ✅ Your remaining leave balance (12 days/year per type by default)

---

### 6.2 Leave Decisions (HR & Admin)

Go to **Attendance & Time → Team Leave Approvals**

- See all pending requests from your managed departments (HR) or all employees (Admin)
- Filter by employee name or search
- **Approve** or **Reject** each request
  - Rejecting requires a written reason

**What happens when leave is approved:**
- Attendance days for the full period are automatically marked as "On Leave"
- The employee's leave balance is updated
- The employee gets an instant notification with the decision

---

### 6.3 Viewing Leave History

Under **My Leave**, you can see all your past requests with:
- Dates, leave type, and reason
- Status (Pending / Approved / Rejected)
- Who approved/rejected and their reason

---

### 6.4 Public Holidays

The **Holidays** sub-tab shows all company holidays. Recurring holidays automatically repeat each year (holidays falling on Feb 29 move to Feb 28 in non-leap years).

---

## 7. Projects & Tasks

Navigate to **Projects & Tasks** in the sidebar.

### 7.1 Projects

#### Who sees what?
- **Managers (HR/Admin):** See all projects in their scope
- **Employees:** Only see projects they are members of

#### Project Cards show:
- Name, description, and priority (Low / Medium / High / Urgent)
- Deadline and current status
- Progress percentage (based on task completion)
- Team member avatars

#### Creating a Project (HR/Admin)
Click **New Project** and fill in:
- Name, description, priority, department, and team
- Start and end dates (end must be on or after start)
- Team members (search and add multiple people)
- Cover image (optional)
- QA form (optional quality assurance checklist)
- **Allow Employee Tasks** toggle — whether employees can create tasks for themselves in this project

**When a project is created**, a dedicated group chat is automatically created with all project members.

---

### 7.2 Task Views

Tasks can be viewed in **4 different ways** — toggle between them using the buttons at the top:

#### 📋 Kanban Board (default)
Tasks displayed as cards in columns:

| Column | Meaning |
|---|---|
| **To Do** | Not started yet |
| **In Progress** | Being worked on |
| **Review** | Submitted for approval |
| **Done** | Completed and approved |

- Drag cards between columns to update status
- Right-click a card for quick actions

#### 📄 List View
A data table with filters, search, bulk actions, and pagination. Great for managing many tasks at once.

#### 📅 Timeline (Gantt Chart)
Visual bars showing each task's duration from creation to due date. Dependency arrows show which tasks are blocked by others.

#### 🔧 QA Form Builder (Managers only)
Build quality assurance checklist templates that attach to tasks or projects. Supported field types: text, long text, checkboxes, yes/no, multiple choice, slider, date, and file upload.

---

### 7.3 Task Detail

Click any task to open its detail sheet. You'll find:

**Overview tab**
- Description, assignees, priority, due date
- Progress slider (managers can set %)
- Dependencies (which tasks must be done first)
- Recurrence settings (daily/weekly/monthly)

**Comments tab**
- A live discussion thread for the task
- Press **Enter** to send, **Shift+Enter** for a new line

**Time tab**
- Log time spent on the task (minimum 1 minute)
- Full time-log history that rolls up into project reports

**Activity tab**
- Complete history of everything that's happened on this task

---

### 7.4 Submitting a Task for Review (Employees)

When your work is done:
1. Open the task
2. Click **Submit for Review**
3. Write a completion note (required)
4. Fill in any required QA form fields
5. Submit — your manager is notified immediately

Your dashboard **Task Approval Status** widget shows the result when it's reviewed.

---

### 7.5 Reviewing Tasks (HR/Admin)

When an employee submits a task, you'll get a notification. Open the task to see:
- Their completion note
- Filled QA form answers

Then either:
- **Approve** → Task moves to Done; employee is notified; optionally posts a completion message to chat
- **Request Redo** → Enter a reason; task goes back to the employee to fix

---

### 7.6 Project Submission & Approval

Once all tasks are complete, an employee can submit the **whole project** for completion:

1. Open the project page
2. Click **Submit for Completion**
3. Write a completion report (required)
4. Fill in the project's QA form (if attached)
5. Submit — HR and Admin are notified

Managers review the submission inline and either approve (marking the project complete) or request a redo.

---

### 7.7 Task Rules to Know

- A task **cannot be completed** if it has unfinished dependencies (blockers)
- Dependency cycles are automatically detected and rejected
- Employees can only edit: status, progress, due date, and description (not assignees or QA settings)
- Recurring tasks automatically create the next occurrence when the current one is approved

---

## 8. Communications

Navigate to **Chat** in the sidebar — three tabs: **Chat · Announcements · Notifications**

### 8.1 Chat

#### Conversation Types
| Type | Who's in it | Created by |
|---|---|---|
| **Global** | Everyone in the company | Auto-created at setup |
| **Project** | Project members only | Auto-created when a project is made |
| **Direct (DM)** | You + one other person | Anyone — click "New Message" or message from someone's profile |
| **Group** | Multiple people | HR or Admin |

#### Sending Messages
- Press **Enter** to send
- Press **Shift+Enter** to add a new line
- Type **@name** to mention someone — they'll get a notification with your message
- Attach files or images (up to **10 MB** per file — images and PDFs preview inline)

#### Read Receipts (Direct Messages)
- ✓ = Sent
- ✓✓ = Read

#### Pinned Messages
Managers can pin important messages in project chats — they appear in a bar at the top of the conversation.

#### Conversation List
- Unread conversations are highlighted with a colored border and badge count
- Pin your most-used conversations to the top of the list
- Search across all your conversations

---

### 8.2 Announcements

Announcements are company or team-wide messages from HR and Admin.

| Priority | What happens |
|---|---|
| **Normal** | Appears in the announcements feed |
| **High** | Appears in feed + sends a notification to everyone |
| **Urgent** | Appears in feed + sends an urgent notification to everyone |

- React to announcements with emojis
- Dismiss them from your dashboard widget with the ✕ button
- Pinned announcements always appear at the top

---

### 8.3 Notifications

#### The Bell Icon (top bar, every page)
- Shows a count of high-priority unread notifications
- Click to see recent items, mark as read, or open the full notification center

#### Notification Center (Chat → Notifications tab)
- Full history of all your notifications
- Filter by type (leave decisions, task updates, @mentions, etc.)
- Mark individual notifications or all as read
- Search through your notification history

#### What triggers a notification?
- Leave request approved or rejected
- Task assigned to you
- Task or project approved or sent back for redo
- Someone @mentions you in a chat
- High or urgent announcements
- Suspicious login on your account
- A report export is ready to download
- Personal reminders you've set
- Upcoming shift reminders (15 min before)

---

## 9. Directory & People Management

Navigate to **Directory** in the sidebar (HR and Admin only).

### 9.1 Corporate Directory

A searchable company directory showing all employees. Filter by department or designation. Each card shows:
- Photo, name, job title, department, and roles
- Contact info (visible based on each person's privacy setting)

**From any employee card, you can:**
- Start a direct message
- View their full employee record

> **Privacy settings:** Employees control who sees their contact info. "Public" shows full contact details; "Private" shows only name and role.

---

### 9.2 Employee Management (HR & Admin)

Manage the employee roster from a full-featured table with search, filters, and bulk actions.

#### Creating a New Employee
Click **Add Employee** and fill in:
- Name, email (must be unique), username, phone
- Employee ID (auto-generated as `G4K-###` if left blank)
- Department → Team (team list updates based on department)
- Job designation and work schedule
- Roles (Employee / HR / Admin)

**What happens automatically:**
1. A secure temporary password is generated
2. The employee gets an email with their login details (if email is configured) — otherwise the manager sees the temp password to share manually
3. The employee must change their password on first login
4. They walk through the onboarding steps

#### Other Employee Actions
| Action | What it does |
|---|---|
| **Edit** | Update any employee details |
| **Activate/Deactivate** | Enable or disable account access |
| **Reset Password** | Generate a new temp password and force a change |
| **Delete** | Soft-delete the account (recoverable); immediately revokes all their sessions |
| **Export** | Export selected or filtered employees to Excel |

---

### 9.3 Departments

View and manage company departments.

- Auto-assigned code (e.g. `DEP-001`)
- Shows headcount and status

**Department Detail Sheet (3 tabs):**

| Tab | What you manage |
|---|---|
| **Employees** | See and sync who's in this department |
| **HRs** | Assign which HR managers oversee this department — this controls what HR can see across the entire platform |
| **Teams** | Create and delete sub-teams within the department |

> **Important:** Departments cannot be deleted while employees are assigned to them.

---

### 9.4 Designations (Job Titles)

Manage the master list of job titles used across the company. Shows name, how many employees hold the title, and active status.

- Cannot be deleted while any employee holds the designation

---

### 9.5 Employee Record (Full 360° View)

Click any employee to open their complete record — 5 tabs:

| Tab | What you see |
|---|---|
| **Personal Info** | Profile fields, department, designation, work schedule |
| **Attendance** | Full attendance history with calendar |
| **Leave History** | All their leave requests and decisions |
| **Projects & Tasks** | All their assignments with statuses |
| **Activity Log** | Their full audit trail (logins, actions taken) |

---

## 10. Reports & Exports

Navigate to **Reports & Analytics** in the sidebar (HR and Admin only).

### 10.1 Built-in Reports

#### Attendance Summary
Filter by date range and department to see attendance KPIs and summaries.

#### Leave Summary
Overview of leave taken across the company or a specific department.

**Saved Views:** Save any set of filters as a named view so you can re-apply it with one click later.

---

### 10.2 Report Builder

Pick a dataset and generate a custom report:

| Dataset | What it contains |
|---|---|
| **Tasks & Deliverables** | All task data with statuses and completion dates |
| **Projects & Milestones** | Project progress and completion data |
| **Employee Directory** | Employee roster with all profile fields |
| **Productivity** | Task completion rate (80%) + time logged score (20%) |

---

### 10.3 How Exports Work

Every export in the platform — from any page — works the same way:

1. Click **Export** anywhere in the app
2. The export job runs **in the background** (you can keep working)
3. When ready, you get a **bell notification**
4. Go to **Reports → Export History** to download your file (Excel/CSV/PDF)

Exports never freeze or slow down the app.

---

## 11. Settings (Admin Only)

Navigate to **Settings** from your user menu. All 12 tabs are described below.

### ⚙️ Company Profile
Set your company name, short name, timezone, and upload your company logo.

### 🕐 Work Schedules
Create shift templates that define:
- Start and end times
- Break duration and grace period (how many minutes late before someone is marked "Late")
- Which days of the week are working days

The **default schedule** is used for overtime and late calculations across the entire platform.

### 🔐 Policies
Control security settings:
- Password requirements (minimum length, complexity rules)
- How long access tokens last
- Maximum number of devices a user can be logged into simultaneously
- Password expiry period

### 🗓️ Holidays
Add, edit, or delete company holidays. Mark holidays as **recurring** to repeat them annually.

### 📧 Mail / SMTP
Configure your email server so the platform can send:
- New employee welcome emails (with temp passwords)
- Password reset links
- Weekly summary reports
- Suspicious login alerts

Use **Send Test Email** to verify the configuration. Credentials are masked after saving.

### 🔔 Notifications
Control which events trigger emails vs. in-app notifications (per event type).

### 🔢 Auto-Numbering
Set the format and starting number for employee IDs, department codes, and company IDs. Preview the format live before saving.

### ⏰ Reminders
Configure:
- How many minutes before a shift starts employees get a reminder
- How many minutes after shift start HR is alerted about employees who haven't clocked in

### 🔑 Security Requests
When email isn't configured, employees can still request a password reset. Those requests appear here for Admins to:
- **Approve** → Generate a one-time link to share with the employee
- **Reject** → Decline the request

### 📋 Audit Log
An immutable record of every important action taken in the system:
- Who did it, what they did, and when
- Before and after values for any changes
- IP address of the action
- Filter by action type, user, or date range
- Exportable

### 🧪 Demo Data
Populate the platform with sample data for testing, or purge it when ready to go live. Purging never touches real user data.

### 🔄 System Jobs
Monitor background job health — see how many jobs are pending or failed, and **retry** failed jobs individually.

---

## 12. My Profile

Click your avatar in the top right → **Profile**

### Profile Header
- Upload or drag-drop a profile photo (max 2 MB)
- See your name, roles, and quick attendance stats

### General Info tab
- Update your name, phone number
- Choose your job designation from the company list
- View your department and company (read-only)

### Security & Devices tab
- **Change Password** — validated against company policy
- **Active Sessions** — see every device you're currently logged into
  - View device type, IP address, and when it was last used
  - **Revoke** any session remotely
  - Revoking your current session logs you out immediately

### Preferences & Support tab

| Setting | Options |
|---|---|
| **Directory Visibility** | Public (shows full contact info) or Private (name and role only) |
| **Theme** | Light / Dark / System |
| **Display Density** | Comfortable / Compact |
| **Hidden Widgets** | Restore any dashboard widgets you've dismissed |
| **Feedback / Complaint** | Send a message directly to your HR/Admin |

**Submitting Feedback:**
Select category (Suggestion or Complaint), write your subject and message — it's delivered as a direct message to your managing HR/Admin plus a high-priority notification.

---

## 13. Mobile Experience

The mobile layout is optimized for quick, on-the-go use.

### Bottom Navigation Bar
| Icon | Goes to |
|---|---|
| 🏠 | Dashboard |
| 📁 | Projects & Tasks |
| 🟢 **FAB** | **Attendance** (big green button — always accessible) |
| 💬 | Chat |
| 👤 | Profile |

### Mobile-Specific Features
- The **Time Clock** is the hero widget — front and center on the attendance screen
- Chat opens as a **full-screen thread** with a back button
- The hamburger menu (☰) opens the full navigation as a slide-over panel
- Kanban board columns **snap** when swiping; use **long-press** to drag tasks
- Pinned items appear in the mobile drawer for quick access

---

## 14. How Everything Connects — Key Workflows

### 🚀 Setting Up a New Company (Admin)
1. Sign in and complete onboarding
2. **Settings** → Set company profile, logo, work schedule, password policy, and email
3. **Settings** → Add public holidays
4. **Directory → Departments** → Create departments → Assign HR managers → Create sub-teams
5. **Directory → Designations** → Create job titles
6. **Directory → Employee Management** → Add HR and employee accounts (they receive welcome emails)
7. HR then creates projects, assigns tasks, and the team gets to work

---

### 📅 A Typical Employee Day
```
📱 Phone buzzes 15 min before shift
  → Sign in
  → Clock In (Late badge appears if past grace period)
  → Open pinned project
  → Start project timer
  → Work... pause for breaks using Start/End Break
  → Update task progress
  → Submit task for review (write note + fill QA form)
  → Continue working
  → 📬 Notification arrives with approval decision
  → Clock Out
  → View day summary + overtime in attendance history
```

---

### ✅ Task Approval Flow
```
Manager creates task → Employee gets notification
  → Employee works (comments, logs time, checks dependencies)
  → Employee submits (note + QA form required)
  → Manager reviews QA answers
  → APPROVE → Task Done + employee notified + optional chat message posted
    → If recurring, next task auto-created
  → REDO → Manager gives reason → Employee fixes and resubmits
```

---

### 📁 Project Completion Flow
```
Project created → Project chat auto-created
  → Tasks assigned and completed (see Task flow above, repeated)
  → Employee submits project (completion report + QA form)
  → Status → "In Review" → HR & Admin notified
  → Manager reviews submission
  → APPROVE → Project marked complete with timestamp
  → REDO → Reason given → Back to active
```

---

### 🏖️ Leave Request Flow
```
Employee submits leave (future date, balance checked)
  → HR notified (or Admin if HR is submitting)
  → HR reviews → APPROVE or REJECT (reason required to reject)
  → APPROVED:
    → Attendance days marked as "On Leave" for the full period
    → Leave balance updated
    → Employee notified
  → REJECTED:
    → Employee notified with the rejection reason
```

---

### 👁️ Attendance Oversight (HR/Admin Daily)
```
HR opens team attendance console (live updates as people clock in)
  → Reviews late arrivals and no-shows
  → Opens member sheet for anyone with issues
  → Adds attendance correction if needed (reason required)
    → Employee notified of correction
    → Audit record created
  → Exports weekly/monthly data when needed
  → Receives automated weekly summary email every Sunday
```

---

## 15. Quick Reference — Rules & Limits

### Login & Security
| Rule | Limit |
|---|---|
| Login attempts before lockout | 5 attempts |
| Lockout duration | 10 minutes |
| Password reset link validity | 60 minutes |
| Access token duration | 15 minutes (auto-refreshed) |
| Session refresh duration | 7 days |

### Leave Requests
| Rule | Detail |
|---|---|
| Earliest start date | Tomorrow (no same-day or past requests) |
| Leave types | Casual, Sick, Earned, Unpaid |
| Default leave balance | 12 days/year per type |
| Reason maximum length | 1,000 characters |
| Rejection reason | Required (no reason = cannot reject) |

### Tasks
| Rule | Detail |
|---|---|
| Title maximum length | 255 characters |
| Priority levels | Low, Medium, High, Urgent |
| Employee can edit | Status, progress, due date, description |
| Submitting requires | Completion note (required) + any QA form fields |
| Dependency rule | Blocked tasks cannot be submitted until blockers are done |

### Files & Uploads
| Type | Limit |
|---|---|
| Chat file attachments | 10 MB per file |
| Profile photo | 2 MB |

### Chat & Messages
| Rule | Detail |
|---|---|
| Self-DM | Not allowed |
| Attachment size | 10 MB max |
| Supported file previews | Images, PDFs |

### Attendance Corrections
| Rule | Detail |
|---|---|
| Reason required | Yes (maximum 500 characters) |
| Who can correct | HR (their departments) and Admin (everyone) |
| Audit trail | Full record kept with before/after values |

### Pins & Shortcuts
| Rule | Limit |
|---|---|
| Maximum pinned items per user | 100 |

### Pagination
All tables support: **20, 50, or 100 rows per page**

---

### 🎨 Status Color Guide

| Color | Meaning |
|---|---|
| ⬜ **Gray** | Not started |
| 🔵 **Blue** | In progress |
| 🟡 **Amber** | Pending review or approval |
| 🟢 **Green** | Approved / Completed / Done |
| 🔴 **Red** | Rejected / Redo required / Overdue |

---

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Open command palette (search, navigate, quick actions) |
| `Ctrl/Cmd + N` | Create new (context-aware) |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + /` | Show shortcut help |
| `Escape` | Close current dialog or panel |

---

*This document reflects the Games4Kings Workplace OS as of **2026-08-19**.*
*For known issues and the resolution roadmap, see `finalization.md`.*
