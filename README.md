# 🏢 Games4Kings Workplace OS
## Complete Product Documentation

> **Version:** 2026-08-19 &nbsp;|&nbsp; **Platform:** Web · Mobile · PWA &nbsp;|&nbsp; **Audience:** All Users, HR Managers, Administrators & Clients

---

## 📋 Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Getting Started — Sign In & Onboarding](#3-getting-started--sign-in--onboarding)
4. [Dashboards](#4-dashboards)
5. [Attendance & Time Tracking](#5-attendance--time-tracking)
6. [Leave Management](#6-leave-management)
7. [Projects & Tasks](#7-projects--tasks)
8. [Communications — Chat, Announcements & Notifications](#8-communications--chat-announcements--notifications)
9. [Directory & People Management](#9-directory--people-management)
10. [Reports & Exports](#10-reports--exports)
11. [System Settings (Admin Only)](#11-system-settings-admin-only)
12. [My Profile](#12-my-profile)
13. [Mobile Experience](#13-mobile-experience)
14. [UX Patterns & Global Behaviors](#14-ux-patterns--global-behaviors)
15. [Approval Workflows (End-to-End)](#15-approval-workflows-end-to-end)
16. [Key End-to-End Workflows](#16-key-end-to-end-workflows)
17. [App Navigation Map & Sidebar Structure](#17-app-navigation-map--sidebar-structure)
18. [Security & Privacy](#18-security--privacy)
19. [Quick Reference — Rules & Limits](#19-quick-reference--rules--limits)
20. [Status Color Guide & Keyboard Shortcuts](#20-status-color-guide--keyboard-shortcuts)

---

## 1. Platform Overview

**Games4Kings Workplace OS** is an all-in-one company management platform that unifies attendance tracking, project management, team communication, HR operations, and reporting into a single, integrated system. Three user types — Admin, HR, and Employee — all sign into the same login page and land in their own tailored area. Tasks flow from HR to employees, attendance is tracked in real time, approvals move through a defined chain, and all communication happens inside the app.

### 1.1 What the Platform Covers

| Area | What You Can Do |
|---|---|
| 🕐 **Attendance & Time** | Clock in/out, track breaks, view full history, manage overtime, handle leave requests |
| 📁 **Projects** | Create, assign, and track projects with team collaboration and quality assurance forms |
| ✅ **Tasks** | Manage to-do items with priorities, deadlines, dependencies, recurrence, timers, and approvals |
| 💬 **Communications** | Chat company-wide, in project teams, or one-on-one; share files; post announcements; receive notifications |
| 👥 **People & Directory** | Browse a searchable employee directory, manage departments, and handle HR administration |
| 📊 **Reports & Analytics** | Export attendance, leave, productivity, project, and task data |
| ⚙️ **System Settings** | Configure company profile, work schedules, policies, holidays, email, and security |

### 1.2 Where It Works

| Platform | Details |
|---|---|
| **Web Browser** | Full-featured desktop experience with all capabilities |
| **Mobile App (PWA)** | Installable on your phone directly from the browser — works like a native app |
| **Offline Support** | Clock in/out and key actions work without internet; everything syncs automatically when connection returns |

---

## 2. User Roles & Permissions

The platform has **three distinct roles**. A user can hold more than one role at the same time (for example, someone who is both an Employee and an HR manager). When you have multiple roles, you choose which one to operate under after signing in.

### 2.1 Role Descriptions

#### 👤 Employee
- Works on tasks and projects assigned by HR or Admin
- Logs their own attendance and tracks personal progress
- Submits completed tasks and projects for approval
- Communicates with HR, Admin, and team members through the app
- Creates personal to-do items in their private task list

#### 👩‍💼 HR (Human Resources Manager)
- Manages day-to-day operations for their assigned departments
- Creates projects, assigns tasks, and monitors employee progress
- Processes employee leave requests and reviews submitted work
- Oversees attendance records for their departments only
- Communicates with their team and Admin through the app
- Has no visibility into departments they are not assigned to manage

#### 🔑 Admin (Administrator)
- Has full, company-wide control over the entire platform
- Creates and manages HR accounts, employee accounts, and departments
- Oversees all projects, tasks, and approvals across every department
- Accesses system settings, audit logs, and complete company-wide reports
- Handles HR leave requests for approval
- **Does not clock in or out** — by design, Admins manage and review attendance rather than logging it themselves

### 2.2 Full Permissions Matrix

| Feature | 👤 Employee | 👩‍💼 HR | 🔑 Admin |
|---|:---:|:---:|:---:|
| **Attendance** | | | |
| Clock in / out | ✅ | ✅ | ❌ By design |
| View own attendance history | ✅ | ✅ | ✅ |
| View team attendance | ❌ | ✅ Own departments | ✅ All |
| Correct attendance entries | ❌ | ✅ Own departments | ✅ All |
| Export attendance data | ❌ | ✅ Scoped | ✅ All |
| **Leave** | | | |
| Submit a leave request | ✅ | ✅ | ✅ |
| Approve employee leave | ❌ | ✅ Own departments | ✅ All |
| Approve HR leave | ❌ | ❌ | ✅ |
| View own leave history | ✅ | ✅ | ✅ |
| View team leave history | ❌ | ✅ Own departments | ✅ All |
| **People Management** | | | |
| Create employee accounts | ❌ | ✅ | ✅ |
| Create HR accounts | ❌ | ❌ | ✅ |
| Create Admin accounts | ❌ | ❌ | ✅ |
| Edit employee profiles | ❌ | ✅ | ✅ |
| Deactivate / delete accounts | ❌ | ✅ | ✅ |
| Manage departments | ❌ | ❌ | ✅ |
| Manage job designations | ❌ | ❌ | ✅ |
| **Projects & Tasks** | | | |
| View own assigned projects | ✅ | ✅ | ✅ |
| View all company projects | ❌ | ❌ | ✅ |
| Create & manage projects | ❌ | ✅ | ✅ |
| Create own tasks | ✅ | ✅ | ✅ |
| Create & assign tasks to others | ❌ | ✅ | ✅ |
| Approve tasks and projects | ❌ | ✅ | ✅ |
| Build QA forms | ❌ | ✅ | ✅ |
| **Communications** | | | |
| Chat & direct messaging | ✅ | ✅ | ✅ |
| Post company-wide announcements | ❌ | ❌ | ✅ |
| Post team-level announcements | ❌ | ✅ | ✅ |
| Create custom group chats | ❌ | ✅ | ✅ |
| Pin messages in project chats | ❌ | ✅ | ✅ |
| **Directory** | | | |
| View employee directory | ✅ | ✅ | ✅ |
| Send direct messages | ✅ | ✅ | ✅ |
| **Reports** | | | |
| View & export reports | ❌ | ✅ Limited/scoped | ✅ Full |
| **Administration** | | | |
| Access system settings | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ✅ |
| Manage company holidays | ❌ | ❌ | ✅ |
| Manage work schedules | ❌ | ❌ | ✅ |

### 2.3 Important Scoping Rules

> - **HR managers** can only see and manage employees in their **assigned departments** — they have no visibility into other departments at all
> - **Employees** can only see projects and tasks they are **explicitly assigned to** — nothing else is visible
> - **Nobody can approve their own requests** — this rule is enforced without exception for all roles
> - **HR leave requests** go to Admin for approval — not to another HR
> - **Employees** only see group chats they have been directly added to by HR or Admin

---

## 3. Getting Started — Sign In & Onboarding

### 3.1 The Login Screen

When you open the platform, you will see:

- ✅ The **company logo** displayed at the top of the login screen
- ✅ A **short welcoming description** below the logo
- ✅ **Copyright notice** at the bottom: *Games4Kings Workplace OS*
- ✅ An **info icon** beside the copyright — clicking or hovering shows a tooltip: *Gen2k Conglomerate (2018) • Milestone 1*

### 3.2 Signing In

Enter **any one** of the following to identify yourself:

| Login Method | Example |
|---|---|
| Email address | `rajan@games4king.in` |
| Employee ID | `G4K-001` |
| Username | `rajan.kumar` |

Then enter your **password** (hidden by default, with a toggle to show it) and click **Sign In**. A loading animation plays while your credentials are verified. If login fails, a clear error message appears.

### 3.3 Multi-Role Login (Dual-Role Users)

If your account has more than one role assigned (for example, Employee + HR):

1. Enter your credentials normally
2. A **Role Selection screen** appears listing all your assigned roles
3. Tap or click the role you want to use for this session
4. You land on the correct dashboard for the role you selected

> **To switch roles:** Sign out and sign back in, then select the other role at the Role Selection screen.

### 3.4 Account Lockout

| Event | What Happens |
|---|---|
| 5 failed login attempts | Account is automatically locked for 10 minutes |
| During lockout | A live countdown shows how long until you can try again |
| After 10 minutes | Access is automatically restored — no need to contact anyone |

### 3.5 First Login — Forced Password Change

If an Admin created your account or reset your password:
- ✅ You **must set a new password** before accessing anything else
- ✅ This is a one-time security step that cannot be skipped
- ✅ Your new password must meet the company's configured password requirements

### 3.6 First Login — Onboarding Walkthrough

Every new user goes through a quick 3-step setup on their very first login:

| Step | What You Complete |
|---|---|
| **Step 1 — Profile** | Add your phone number and emergency contact information |
| **Step 2 — Password** | Optionally update your password (can be skipped) |
| **Step 3 — Tour** | A guided walkthrough of the main platform features |

- ✅ Onboarding can be paused and resumed — it will not be lost if you close the app
- ✅ Until onboarding is complete, you can only access: logout, onboarding itself, role selection, your active sessions, and password change

### 3.7 Forgot Password

**If email is configured at your company:**
1. Click **Forgot Password** on the login page
2. Enter your email address, employee ID, or username
3. Receive a **secure password reset link** by email — valid for **60 minutes**
4. Open the link, set a new password, and you'll be redirected to sign in

**If email is NOT configured:**
1. Click **Forgot Password** on the login page
2. Submit the in-app request
3. Your Admin sees the request under **Settings → Security Requests**
4. Admin approves and generates a one-time reset link to share with you directly

### 3.8 Session Management

| Feature | Detail |
|---|---|
| **Auto-refresh** | Sessions silently refresh every 15 minutes — you will not be unexpectedly logged out |
| **Session duration** | Remains valid for up to 7 days with activity |
| **View active sessions** | My Profile → Security & Devices |
| **Remote sign-out** | Revoke any session on any device remotely |
| **Current device** | Revoking your current session logs you out immediately |

### 3.9 Security Alerts

The platform automatically monitors for unusual login activity, such as a sign-in from an unrecognized location or IP address:

- ✅ All HR and Admin users are notified immediately
- ✅ You receive an email alert (if email is configured at your company)

---

## 4. Dashboards

Your dashboard is your personal home screen, customized automatically for your role. Every widget on the dashboard:

- ✅ **Loads independently** — if one widget is slow, the rest still appear
- ✅ **Is clickable** — click any widget to open the full detail view
- ✅ **Has a refresh icon** on hover for manual refresh
- ✅ **Can be dismissed or collapsed** to keep your workspace tidy
- ✅ **Can be rearranged by dragging** — your layout is saved per user across all devices
- ✅ **Remembers your customization** — your layout persists across logins and devices
- ✅ **Dismissed widgets can be restored** under My Profile → Preferences

### 4.1 👤 Employee Dashboard

| Widget | What It Shows |
|---|---|
| 📢 **Announcements** | Company and team announcements — dismissible with the ✕ button |
| 📁 **Active Projects** | All projects you are currently a member of |
| ✅ **Pending Tasks** | Tasks assigned to you that are not yet complete |
| 🔄 **Task Approval Status** | Status of every task you've submitted: Pending Approval / Approved / Redo Required |
| 📈 **Recent Task Progress** | Your most recently worked task with a visual progress bar |
| 🗓️ **Upcoming Holidays** | Next upcoming holidays from the company calendar |
| 📝 **Quick Notes** | Your personal, private notepad |
| 🕐 **Time Clock** | Clock in and out directly from the dashboard |

### 4.2 👩‍💼 HR Dashboard

| Widget | What It Shows |
|---|---|
| 👥 **Team Attendance Today** | Real-time count of who is present, absent, late, and on leave |
| ⏳ **Pending Approvals** | Leave requests and task submissions from your team waiting for a decision |
| 🚨 **Team Activity** | Alerts about late arrivals and unclosed shifts |
| ⚡ **Quick Task** | Create and assign a task to any employee in seconds |
| 📢 **Announcements** | Company-wide and team-level announcements |
| 🗓️ **Upcoming Holidays** | Company holiday calendar |
| 🕐 **Time Clock** | Your own personal clock in/out widget |

### 4.3 🔑 Admin Dashboard

| Widget | What It Shows |
|---|---|
| 👥 **Total Employees** | Active and inactive count with a department breakdown |
| 📁 **Active Projects** | Total number of active projects across the company |
| 🕐 **Today's Attendance** | Company-wide snapshot: present, absent, and late counts |
| ⏳ **Pending Approvals** | All pending leave, task, and project submissions — approve or reject directly here |
| 📋 **Recent Activity** | A live audit feed of important actions taken company-wide |
| ⚡ **Quick Task** | Create and assign a task to any employee instantly |

### 4.4 Quick Task Widget (HR & Admin)

The **Quick Task** widget creates and assigns a task without leaving the dashboard:

1. Search for and select an employee
2. Enter a task title, description, priority, and due date
3. Click **Create**
4. ✅ The task appears immediately in the employee's task list
5. ✅ The employee receives an instant notification
6. ✅ When the employee completes and submits the task, a notification is automatically posted to the Global Chat

---

## 5. Attendance & Time Tracking

Navigate to **Attendance & Time** in the sidebar.

### 5.1 The Clock — State Flow

The time clock follows a clear sequence of states:

```
Not Started
    ↓
  Clock In  →  [Working — timer counting]
                    ↓
              Start Break  →  [On Break — timer paused]
                                   ↓
                             End Break  →  [Working — timer resumes]
                                               ↓
                                           Clock Out  →  Day Complete
```

### 5.2 Clock Buttons & What They Do

| Button | What It Does |
|---|---|
| **Clock In** | Starts your shift — timer begins counting |
| **Start Break** | Pauses your shift — time stops counting toward worked hours |
| **End Break** | Resumes your shift — time starts counting again |
| **Clock Out** | Ends your shift entirely for the day |

### 5.3 Smart Clock Behaviors

| Situation | How the Platform Handles It |
|---|---|
| Clock Out while on break | Break is automatically ended first, then you are clocked out |
| App accidentally closed | A **"Continue Shift"** option appears on reopen — confirm to resume |
| No internet connection | Punches are saved locally and sync automatically when you reconnect |
| Accidental double-tap | Duplicate punches are automatically prevented — always safe to retry |

### 5.4 What the Clock Displays While Working

- ✅ A **live HH:MM:SS timer** counting up continuously
- ✅ A **Late badge** if your clock-in was after your scheduled start time plus the configured grace period
- ✅ An **Overtime indicator** — the timer turns **amber** when you exceed your scheduled hours
- ✅ A **break history** listing each break with its exact start time and duration
- ✅ The timer continues running when you navigate to other parts of the app
- ✅ The timer **only stops** when you explicitly click Clock Out or End Session

### 5.5 Late & Overtime Tracking

| Feature | How It Works |
|---|---|
| **Late** | Clock-in after scheduled start time + grace period = Late badge on that day |
| **Overtime** | Hours worked beyond your standard schedule are tracked separately |
| **Overtime color** | Appears as a distinct color on the attendance calendar |
| **Timezone** | All times are calculated in your company's configured timezone (default: India Standard Time) |

### 5.6 Attendance History Calendar

Your full attendance history is displayed as a **color-coded calendar** showing patterns at a glance:

| Color | Meaning |
|---|---|
| 🟢 **Green** | Present and on time |
| 🟡 **Amber** | Late arrival |
| 🔵 **Blue** | Overtime worked |
| 🟣 **Purple** | On approved leave |
| ⬜ **Gray** | Absent |
| 🏖️ **Light Blue** | Public holiday |

**Click any day on the calendar to see:**
- ✅ Full punch timeline — exact clock-in, break start/end times, and clock-out
- ✅ Which device or location was used
- ✅ Time logged against each project and task worked on
- ✅ Total hours worked and any overtime for that day
- ✅ Projects worked on and tasks completed

### 5.7 Shift Reminders (Automatic)

| Reminder | Who Gets It | When |
|---|---|---|
| Shift start alert | Employee | 15 minutes before scheduled start |
| Missed clock-in alert | HR | 30 minutes after scheduled start (if employee hasn't clocked in) |

Both reminder times are configurable by Admin in System Settings.

### 5.8 Attendance Corrections (HR & Admin Only)

HR managers and Admins can correct errors in attendance records:

1. Open the team attendance console
2. Find the employee and the day to correct
3. Click **Correct Attendance**
4. Add, edit, or remove punch events as needed
5. Preview the corrected totals before saving
6. Enter a **reason for the correction** (required — cannot be skipped)
7. Save

**After saving:**
- ✅ The employee is automatically notified about what was corrected
- ✅ A full audit record is created — captures before and after values
- ✅ Corrections are always logged and attributed to the person who made them

### 5.9 Team Attendance Console (HR)

HR managers see a real-time view of their team throughout the day:

**Today's Status Tab**
- ✅ Live table showing every team member's current status (working, on break, absent, on leave)
- ✅ Exact clock-in/out times, break durations, and hours worked so far
- ✅ Click any employee row for their full day breakdown, history, and trends
- ✅ Table updates automatically as team members clock in or out — no refresh needed

**Trends & Graphs Tab**
- ✅ Weekly and monthly attendance charts for each employee
- ✅ A year-view heatmap showing attendance patterns over time
- ✅ HR-level graphs showing team attendance consistency

### 5.10 Company Attendance Console (Admin)

Admins see a company-wide attendance view across three tabs:

| Tab | What It Shows |
|---|---|
| **Calendar Heatmap** | Overall attendance rate for each day — click any day for detailed data |
| **Overview Table** | Filterable by date range, department, employee, or status — fully exportable |
| **Analytics & Trends** | KPI cards and weekly/monthly trend charts for the entire company |

### 5.11 Weekly Summary Report (Admin)

- ✅ Admins automatically receive a **weekly summary email every Sunday at 9:00 AM**
- ✅ Summary covers: attendance metrics, leave overview, task completions, and project status updates

---

## 6. Leave Management

### 6.1 Submitting a Leave Request (All Roles)

Go to: **Attendance & Time → My Leave → New Request**

Complete the request form:

| Field | Requirements |
|---|---|
| **Leave Type** | Select: Casual / Sick / Earned / Unpaid |
| **Start Date** | Must be **tomorrow or later** — same-day or backdated requests are not permitted |
| **End Date** | Must be on or after the start date |
| **Reason** | Required — up to 1,000 characters |

> **Auto-save:** Your form is automatically saved as a draft every 30 seconds. If you close the page accidentally, your draft will be waiting when you return.

**Before submission, the system automatically checks:**
- ✅ Whether the dates overlap with any of your existing leave requests
- ✅ Whether you have enough remaining leave balance for the requested period

### 6.2 Leave Types & Annual Balances

| Leave Type | Description | Default Annual Allowance |
|---|---|---|
| **Casual Leave** | Short-notice personal leave | 12 days per year |
| **Sick Leave** | Medical or health-related absences | 12 days per year |
| **Earned Leave** | Accrued paid leave earned over time | 12 days per year |
| **Unpaid Leave** | Leave taken without pay | 12 days per year |

> Note: Allowances may be adjusted by your Admin to reflect your organization's specific policy.

### 6.3 Leave Request Routing

| Who Submits | Request Goes To |
|---|---|
| Employee | Their assigned HR manager |
| HR manager | The Admin |

- ✅ The approver receives an **instant in-app notification** when a request arrives
- ✅ **Nobody can approve their own leave request** — always enforced

### 6.4 Leave Approval Process (HR & Admin)

Go to: **Attendance & Time → Team Leave Approvals**

| Action | Details |
|---|---|
| **View requests** | See all pending requests — HR sees their departments; Admin sees everyone |
| **Filter** | Search by employee name or filter by status |
| **Approve** | Marks the leave as approved; attendance is updated automatically |
| **Reject** | Requires a written reason — cannot reject without providing an explanation |

**When leave is approved:**
- ✅ All attendance days in the leave period are automatically marked as "On Leave"
- ✅ The employee's leave balance is deducted for the leave type used
- ✅ Employee receives an instant notification confirming the approval

**When leave is rejected:**
- ✅ Employee receives a notification with the rejection reason provided

### 6.5 Viewing Leave History

Under **My Leave**, see all historical requests including:
- ✅ Dates, leave type selected, and reason provided
- ✅ Current status: Pending / Approved / Rejected
- ✅ Who made the decision and on what date
- ✅ The reason given for any rejection

### 6.6 Leave Balance Visibility

- ✅ Employees can see their remaining balance for each leave type
- ✅ The approver (HR/Admin) sees the requester's current balance when reviewing a request
- ✅ Balance is updated immediately when leave is approved

### 6.7 Cancelling a Leave Request

- ✅ Employees can cancel their own **pending** leave requests before a decision is made
- ✅ Cancelling a pending request restores no balance (balance is only deducted on approval)

### 6.8 Public Holidays

The **Holidays** sub-tab shows all company holidays configured by the Admin:

- ✅ Recurring holidays automatically repeat every year
- ✅ Holidays falling on February 29th in non-leap years automatically move to February 28th
- ✅ HR and Employees receive a **reminder notification 10 days before** each upcoming holiday

---

## 7. Projects & Tasks

Navigate to **Projects & Tasks** in the sidebar.

### 7.1 Project Visibility by Role

| Role | What Projects They Can See |
|---|---|
| **Employee** | Only projects they have been explicitly added to as a team member |
| **HR** | Projects they created, projects within their departments, projects their employees are on |
| **Admin** | All projects across the entire company |

### 7.2 What a Project Card Shows

- ✅ Project name, description, and priority level
- ✅ Deadline and current status
- ✅ Progress percentage (automatically calculated from task completions)
- ✅ Team member profile pictures

### 7.3 Creating a Project (HR & Admin)

Click **New Project** and complete the form:

| Field | Details |
|---|---|
| **Name** | Project name |
| **Description** | What the project is about |
| **Priority** | Low / Medium / High / Urgent |
| **Department** | Which department this project belongs to |
| **Team Members** | Search and add multiple employees |
| **Start Date** | When work begins |
| **End Date** | Deadline — must be on or after the start date |
| **Cover Image** | Optional visual for the project card |
| **QA Form** | Optional quality assurance checklist for submissions |
| **Allow Employee Tasks** | Toggle — whether employees may create their own tasks within this project |

**What happens automatically when a project is created:**
- ✅ A dedicated group chat is created for all project members
- ✅ All team members receive a notification that they've been added
- ✅ Each member immediately gains access to the project's tasks and chat

### 7.4 Project Sorting

Sort any project list by:

| Sort Field | Directions |
|---|---|
| Created Date | Ascending / Descending |
| Deadline | Ascending / Descending |
| Priority | Ascending / Descending |

### 7.5 Project History Log

Every completed project has a history record showing:
- ✅ Team members who participated
- ✅ Total tasks completed
- ✅ Total time spent across the project
- ✅ Completion date and final approval status

---

### 7.6 Task Views — 4 Ways to See Your Work

Toggle between four different views using the buttons at the top of the task page:

#### 📋 View 1: Kanban Board (Default)

Tasks are displayed as draggable cards in columns that represent their current stage:

| Column | What It Means |
|---|---|
| **To Do** | Task not yet started |
| **In Progress** | Task actively being worked on |
| **Review** | Task submitted and awaiting manager approval |
| **Done** | Task completed and approved |

- ✅ Drag cards between columns to update their status instantly
- ✅ Right-click any card for a quick-action menu
- ✅ Tasks within a column can be reordered by dragging — order is saved automatically
- ✅ On mobile: swipe between columns; long-press to drag a card

#### 📄 View 2: List View

A sortable, searchable data table — ideal for managing many tasks at once:
- ✅ Full filter bar: status, priority, date range, assignee
- ✅ Search within tasks
- ✅ Bulk actions on multiple tasks
- ✅ Pagination with 20/50/100 items per page

#### 📅 View 3: Timeline (Gantt Chart)

A visual, date-based project timeline:
- ✅ Horizontal bars for each task spanning its start to due date
- ✅ Small diamond markers for task milestones
- ✅ Dependency arrows showing which tasks are blocked by others
- ✅ Project bars spanning from start date to deadline
- ✅ Available to HR and Admin

#### 🔧 View 4: QA Form Builder (HR & Admin Only)

Build quality assurance checklist templates to attach to tasks or projects:

| Supported Field Type | Use Case |
|---|---|
| **Text** | Short single-line answer |
| **Long Text** | Multi-line detailed response |
| **Checkboxes** | Multiple selectable items |
| **Yes / No** | Simple binary toggle |
| **Multiple Choice** | Single answer from a defined list |
| **Slider** | Numeric score across a defined range |
| **Date** | Date selection |
| **File Upload** | Attach a file for review |

---

### 7.7 Task Detail Sheet

Click any task to open its full detail, organized across four tabs:

#### Overview Tab
- ✅ Full description, list of assignees, priority, and due date
- ✅ **Progress slider** — managers can manually set the completion percentage
- ✅ **Dependencies** — which tasks must be finished before this one can start
- ✅ **Recurrence settings** — how often the task auto-repeats
- ✅ **Task scope** — Global / Department / Role-specific / Individual

#### Comments Tab
- ✅ A live threaded discussion specific to this task
- ✅ Press **Enter** to send; press **Shift+Enter** for a new line
- ✅ Comments stay with the task — separate from general chat
- ✅ Used to discuss work details without switching to the main chat

#### Time Tab
- ✅ Log time spent working on the task (minimum 1 minute per entry)
- ✅ View complete time-log history for the task
- ✅ Time logged rolls up into project and productivity reports

#### Activity Tab
- ✅ Complete chronological history of every action taken on this task
- Example entries: *"Created by Rajan on May 5"* · *"Assigned to Priya on May 6"* · *"Progress updated to 60%"* · *"Submitted for review"* · *"Approved by HR (Meena)"*

---

### 7.8 Task Priority Levels

| Priority | Color | Meaning |
|---|---|---|
| **Low** | Gray/Blue | Background work, not time-sensitive |
| **Medium** | Yellow | Standard priority |
| **High** | Orange | Important and time-sensitive |
| **Urgent** | Red | Critical — needs immediate attention |

### 7.9 Task Scope (HR & Admin)

When creating a task, you can target it to:

| Scope | Assigned To |
|---|---|
| **Global** | All employees company-wide |
| **Department** | All employees in a specific department |
| **Role-Specific** | All employees with a specific job designation |
| **Individual** | One or more specific named employees |

### 7.10 Task Dependencies

- Any task can be marked as **blocked by** one or more other tasks
- ✅ Blocked tasks cannot be submitted for review until all blocking tasks are complete
- ✅ The platform enforces this — blocked tasks cannot be moved to "done" prematurely
- ✅ Circular dependencies (A blocks B which blocks A) are automatically detected and rejected
- ✅ The Timeline (Gantt) view shows dependency arrows visually
- ✅ A blocked badge appears on affected tasks to make their status clear

### 7.11 Recurring Tasks

HR managers can configure tasks to automatically repeat. The recurrence option is inside a **collapsible advanced section** in the task form to keep the main view clean:

| Repeat Option | Behavior |
|---|---|
| **Daily** | New task created every day |
| **Weekly on specific days** | New task created on chosen days of each week |
| **Monthly on a specific date** | New task created on the same date each month |

**How recurring tasks work:**
- ✅ When the current task is approved, the next occurrence is created automatically
- ✅ HR receives a notification each time a recurring task is completed and approved
- ✅ HR can turn off recurrence at any time — it stops after the current instance
- ✅ Recurrence only fires when the task has been properly approved, not just submitted

### 7.12 Personal Task List (My Tasks)

Every user has a private task list not connected to any project:

- ✅ HR and Admin can assign tasks directly into an employee's personal list
- ✅ Employees can create their own personal to-do items here
- ✅ Personal tasks have the same priority, due date, reminder, and comment features as project tasks
- ✅ Only the assigned user and their HR/Admin can see personal tasks

### 7.13 Personal Task Reminders

Employees can set individual reminders on any task they own:
- ✅ A notification is sent at the time set by the employee
- ✅ Only visible to the task owner
- ✅ Helps employees stay on top of deadlines without HR intervention

### 7.14 Project Work Timer

Every project has a dedicated timer to track time actually spent working on it:

| Action | What It Does |
|---|---|
| **Start Timer** | Begin counting time for this project |
| **Pause Timer** | Temporarily stop counting (e.g., switching to another project) |
| **Resume Timer** | Continue from where you paused |
| **End Session** | Log the time and stop the timer |

- ✅ Total time per project is tracked and visible in project reports
- ✅ The project timer is separate from the shift clock — both can run at the same time
- ✅ Timer continues running even when navigating to other areas

### 7.15 Submitting a Task for Review (Employees)

When you have finished working on a task:

1. Open the task detail sheet
2. Click **Submit for Review**
3. Write a **completion note** explaining what you did (required)
4. Fill in all **required QA form fields** if a form is attached
5. Click Submit
6. Your manager receives an instant notification
7. The task moves to **"Review"** on the Kanban board
8. Check your dashboard **Task Approval Status** widget for the outcome

### 7.16 Reviewing & Deciding on Tasks (HR & Admin)

When an employee submits a task, you receive a notification. Open the task to review:
- ✅ The employee's completion note
- ✅ All filled-in QA form answers

Make your decision:

| Decision | What Happens |
|---|---|
| **Approve** | Task moves to "Done" · Employee is notified · Optional message posted to project chat · If recurring, next instance is auto-created |
| **Request Redo** | Enter a reason · Task returns to "In Progress" · Employee is notified and can fix and resubmit |

### 7.17 Submitting a Project for Completion

Once all tasks in a project are complete, submit the entire project for final approval:

**Employee submits:**
1. Open the project page
2. Click **Submit for Completion**
3. Write a project completion report (required)
4. Fill in the project-level QA form if one is attached
5. Submit — HR and Admin are notified immediately
6. Project status changes to "In Review"

**Manager reviews and decides:**

| Decision | What Happens |
|---|---|
| **Approve** | Project marked Complete with a timestamp · Team is notified |
| **Request Redo** | Reason provided · Project returns to active status for corrections |

### 7.18 Employee Task Creation in Projects

Employees can create their own tasks within a project **only if** the HR manager has enabled the **"Allow Employee Tasks"** setting for that specific project. This is controlled on a per-project basis by HR/Admin.

---

## 8. Communications — Chat, Announcements & Notifications

Navigate to **Chat** in the sidebar. Three tabs are available: **Chat · Announcements · Notifications**

### 8.1 Chat Conversation Types

| Type | Who Is In It | Who Creates It |
|---|---|---|
| **Global Chat** | Everyone in the company | Auto-created at company setup |
| **Project Chat** | Only members of a specific project | Auto-created when a project is made |
| **Direct Message (DM)** | You and one other person | Anyone — click "New Message" or message from a profile |
| **Custom Group Chat** | Multiple selected people | HR or Admin only |

**What employees see:**
- ✅ The Global Chat (everyone)
- ✅ Project chats for their assigned projects only
- ✅ Direct messages they are a party to
- ✅ Group chats they have been explicitly added to — nothing else

### 8.2 Sending Messages

| Action | How to Do It |
|---|---|
| **Send a message** | Press **Enter** |
| **Add a new line** | Press **Shift+Enter** |
| **Mention someone** | Type **@** followed by a name — a dropdown appears |
| **Attach a file** | Use the attachment button — max 10 MB per file |

### 8.3 @Mentions

- ✅ Type **@** in any chat to open a dropdown showing members of that conversation
- ✅ Select a name to mention them in your message
- ✅ The mentioned person receives a notification containing a snippet of your message
- ✅ Mentions are highlighted in the chat thread for visibility

### 8.4 File & Image Sharing

- ✅ Files and images can be shared in any chat conversation
- ✅ Maximum file size: **10 MB per file**
- ✅ Images and PDFs display as inline previews in the chat — no need to download to view
- ✅ A popup explains supported formats and size limits when you attach

### 8.5 Read Receipts (Direct Messages Only)

| Symbol | Meaning |
|---|---|
| ✓ | Message sent successfully |
| ✓✓ | Message opened and read by the recipient |

Read receipts appear in one-on-one direct messages only.

### 8.6 Message Pinning (HR — Project Chats)

- ✅ HR managers can pin important messages in project group chats
- ✅ Pinned messages appear in a bar at the top of the chat for all members to see
- ✅ Only HR managers have the ability to pin or unpin messages

### 8.7 Unread Conversations

- ✅ Conversations with new unread messages are highlighted with a **colored left border** and a **count badge**
- ✅ Conversations are automatically marked as read when you open them
- ✅ Unread badges appear on the Chat icon in the navigation bar

### 8.8 Pinned Conversations

- ✅ Pin your most-used conversations to keep them at the top of your list
- ✅ Pinned conversations appear above unpinned ones
- ✅ Up to **100 items** can be pinned per user

### 8.9 Task Completion Alerts in Chat

- ✅ When an employee completes a task in a project, an alert is automatically posted in that project's chat
- ✅ Tasks created from the Quick Task dashboard widget post a completion message to the Global Chat when done

---

### 8.10 Announcements

Announcements are formal broadcast messages from HR and Admin:

| Priority Level | What Happens |
|---|---|
| **Normal** | Appears in the Announcements feed only |
| **High** | Feed + notification sent to all relevant users |
| **Urgent** | Feed + urgent notification sent to everyone affected |

**Who can post:**
- **Admin** — Company-wide announcements seen by everyone
- **HR** — Team-level announcements visible to their assigned employees

**Announcement features:**
- ✅ React with emoji reactions (no comment section — keeps it professional)
- ✅ Dismiss from the dashboard with the **✕** button (dismissal is remembered)
- ✅ Pinned announcements stay at the top of the feed
- ✅ Announcements appear on every user's dashboard so they are never missed

---

### 8.11 Notifications

#### The Bell Icon (Every Page, Top Bar)

- ✅ Visible at all times on every page
- ✅ Shows a **count badge** for high-priority unread notifications
- ✅ Click to preview recent items, mark as read, or open the full Notification Center
- ✅ **Only shows high-priority and system-level notifications** — routine project/submission updates go to the Chat's Notification Center tab

#### Notification Center (Chat → Notifications Tab)

- ✅ Complete history of all your notifications
- ✅ Filter by type: leave decisions, task updates, @mentions, announcements, etc.
- ✅ Mark individual notifications or all as read at once
- ✅ Search through your full notification history

#### Complete Notification Trigger Reference

| Event | Who Gets Notified |
|---|---|
| Leave request submitted | The assigned approver (HR or Admin) |
| Leave approved or rejected | The employee who submitted it |
| New task assigned | The assigned employee |
| Task submitted for review | The reviewing manager |
| Task approved or sent for redo | The submitting employee |
| Project submitted for completion | HR and Admin |
| Project approved or sent for redo | The submitting employee |
| @mention in any chat | The mentioned person (with message snippet) |
| High or urgent announcement | All relevant users |
| Suspicious login detected | All HR and Admin users |
| Export file ready to download | The user who requested the export |
| Personal reminder triggered | You, at the time you set |
| Shift reminder (15 minutes before) | You (the employee) |
| Missed clock-in (30 min after start) | Your HR manager |
| Session remotely revoked | The user whose session was revoked |
| Feedback or complaint received | The receiving HR or Admin |
| Holiday in 10 days | HR and all employees |

---

### 8.12 Chat — Notification Center (HR View)

The Notification Center within the Chat tab is used by HR to manage:
- ✅ Leave requests from employees awaiting decision
- ✅ Task submissions needing review
- ✅ Project submissions needing approval
- ✅ Company announcements
- ✅ Holiday reminders
- ✅ Employee feedback and complaint messages

---

## 9. Directory & People Management

Navigate to **Directory** in the sidebar (available to HR and Admin).

### 9.1 Corporate Directory

A searchable, filterable directory of all employees in the company:

**Available filters and views:**
- ✅ Filter by department
- ✅ Filter by job designation
- ✅ Switch between grid view and list view
- ✅ Search by name, department, or designation

**Each employee card displays:**
- Profile photo
- Full name
- Job title / Designation
- Department
- Contact information — **only if** the employee's privacy setting is "Public"

**From any employee card:**
- ✅ Click to open their full public profile
- ✅ Click **Send Message** to start a direct conversation with them

**Employee privacy settings (self-managed):**

| Setting | What Others See |
|---|---|
| **Public** | Full contact details (email, phone number) |
| **Private** | Name and role only — no contact details |

### 9.2 Creating a New Employee Account (HR & Admin)

Click **Add Employee** and complete the form:

| Field | Details |
|---|---|
| **Full Name** | Employee's full legal name |
| **Email** | Must be unique — no two accounts can share an email |
| **Username** | For alternative login |
| **Phone Number** | Contact number |
| **Employee ID** | Auto-generated as `G4K-###` if left blank |
| **Department** | Select the appropriate department |
| **Team** | Team list updates automatically based on the selected department |
| **Job Designation** | Choose from the company's configured list of titles |
| **Work Schedule** | Assign a shift template |
| **Role(s)** | Employee / HR / Admin — multiple roles can be assigned |

**What happens automatically:**
1. ✅ A secure temporary password is generated
2. ✅ A welcome email with login details is sent (if email is configured), or HR sees the temp password to share manually
3. ✅ The employee must change their password on first login
4. ✅ They are guided through the onboarding steps automatically

### 9.3 Managing Existing Employee Accounts

| Action | What It Does |
|---|---|
| **Edit** | Update any field on the employee's profile |
| **Activate** | Restore access to a previously deactivated account |
| **Deactivate** | Block login access — data and history are fully preserved |
| **Reset Password** | Generate a new temporary password and force the employee to change it |
| **Delete** | Soft-delete — data is retained and the deletion is recoverable; all active sessions are revoked immediately |
| **Export** | Export selected or filtered employees to an Excel file |

### 9.4 Department Management (Admin Only)

**Creating and managing departments:**
- ✅ Create a new department with a name and description
- ✅ Each department receives an auto-assigned code (e.g., `DEP-001`)
- ✅ Edit department name and description at any time
- ✅ Archive or delete a department (cannot delete while employees are still assigned)
- ✅ View a department's headcount and active/inactive status

**Department Detail — Three Tabs:**

| Tab | What You Manage |
|---|---|
| **Employees** | See who is in this department; sync membership |
| **HRs** | Assign which HR managers oversee this department — this controls what that HR can see everywhere in the platform |
| **Teams** | Create, rename, and delete sub-teams within the department |

> **Critical rule:** Departments cannot be deleted while any employees are still assigned to them.

### 9.5 Designations (Job Titles)

Manage the master list of job titles used throughout the company:

- ✅ View all designations with how many employees hold each title
- ✅ Add new designations as needed
- ✅ Cannot delete a designation while any employee holds that title
- ✅ All designation options come from this list when creating or editing employee accounts

### 9.6 Full Employee Record (360° View)

Click any employee's name or profile card to open their complete record:

| Tab | What You See |
|---|---|
| **Personal Info** | All profile fields, department, designation, and assigned work schedule |
| **Attendance** | Full attendance history with the color-coded calendar |
| **Leave History** | All leave requests submitted and their outcomes |
| **Projects & Tasks** | Every assignment with current statuses |
| **Activity Log** | Complete audit trail — all logins, profile changes, and actions taken |

---

## 10. Reports & Exports

Navigate to **Reports & Analytics** in the sidebar (available to HR and Admin).

### 10.1 Attendance Summary Report

Filter by date range and department to see:
- ✅ Attendance KPIs: present rates, late rates, and absence rates
- ✅ Per-department and per-employee summaries
- ✅ Exportable to Excel

### 10.2 Leave Summary Report

View leave data across the company or a specific department:
- ✅ Breakdown by leave type
- ✅ Totals per employee and per department
- ✅ Filter by date range

### 10.3 Saved Filter Views

- ✅ Save any combination of active report filters as a named view
- ✅ Reapply a saved view instantly with one click — no need to reconfigure filters

### 10.4 Custom Report Builder

Select a dataset to generate tailored reports:

| Dataset | What It Includes |
|---|---|
| **Tasks & Deliverables** | All task records with statuses, assignees, and completion dates |
| **Projects & Milestones** | Project progress and completion data |
| **Employee Directory** | Full roster with all profile information fields |
| **Productivity** | Calculated score: 80% task completion rate + 20% time logged |

### 10.5 Admin-Only Reports

| Report | What It Covers |
|---|---|
| **Attendance Report** | Filter by date range, department, or individual — full company data |
| **Project Completion Report** | Which projects were completed, by whom, and when |
| **Task Statistics** | Completion rates, redo rates, time averages per task |
| **Productivity Summary** | Calculated productivity score per employee |

### 10.6 How Exports Work (All Reports & Tables)

Every export anywhere in the platform follows the same background process:

1. ✅ Click **Export** on any page or report
2. ✅ The export runs **in the background** — you can keep working while it generates
3. ✅ When complete, you receive a **bell notification**
4. ✅ Go to **Reports → Export History** to download the file
5. ✅ All exports are in **Excel format (.xlsx)**

> Exports never freeze or slow down the app — all processing happens in the background.

---

## 11. System Settings (Admin Only)

Navigate to **Settings** from your user menu or profile avatar. All settings are organized into the following sections:

### ⚙️ 1 — Company Profile

| Setting | What It Controls |
|---|---|
| **Company Name** | The full legal or brand name of your organization |
| **Short Name** | An abbreviated version used in compact displays |
| **Timezone** | All time calculations and displays use this timezone (default: Asia/Kolkata — India Standard Time) |
| **Company Logo** | Uploaded logo appears on the login page and throughout the platform |

### 🕐 2 — Work Schedules

Create shift templates that define working parameters for different teams:

| Setting | What It Controls |
|---|---|
| **Start Time** | When the work shift officially begins |
| **End Time** | When the work shift officially ends |
| **Break Duration** | Expected length of break periods |
| **Grace Period** | Minutes after start time before an employee is marked "Late" |
| **Working Days** | Which days of the week are active working days |

- ✅ Multiple schedules can be created for different shift patterns or teams
- ✅ One schedule is designated as the **default schedule** — this is used for late detection and overtime calculations platform-wide

### 🔐 3 — Policies (Security Settings)

| Setting | What It Controls |
|---|---|
| **Password Minimum Length** | Shortest password the system accepts |
| **Password Complexity Rules** | Whether uppercase, numbers, or special characters are required |
| **Access Token Duration** | How often sessions silently refresh in the background |
| **Maximum Active Devices** | How many simultaneous devices a user can be logged into at once |
| **Password Expiry Period** | How often users are required to change their passwords |

### 🗓️ 4 — Holidays

Manage the company-wide holiday calendar:

- ✅ Add, edit, or remove holidays
- ✅ Mark holidays as **recurring** to repeat them automatically every year
- ✅ February 29th holidays in non-leap years automatically shift to February 28th
- ✅ Upcoming holidays appear in every user's dashboard widget

### 📧 5 — Mail / SMTP (Email Configuration)

Configure your email server to enable platform email features:

| Email Feature | When It Is Sent |
|---|---|
| New employee welcome emails | When a new account is created |
| Password reset links | When an employee requests a password reset |
| Weekly summary report | Every Sunday to Admins |
| Suspicious login alerts | When unusual login activity is detected |

- ✅ **Send Test Email** button verifies your email configuration is working
- ✅ Saved email credentials are masked/hidden after saving for security

### 🔔 6 — Notification Preferences

Control which events trigger email notifications vs. in-app notifications on a per-event-type basis. Gives you granular control over how the system communicates across the organization.

### 🔢 7 — Auto-Numbering

Configure the automatic ID format for your organization:

| ID Type | Example Format | Setting |
|---|---|---|
| Employee IDs | `G4K-001` | Set format prefix and starting number |
| Department Codes | `DEP-001` | Set format prefix and starting number |

- ✅ Preview how IDs will look before saving
- ✅ Auto-numbering continues without collision after demo data removal or account deletion

### ⏰ 8 — Reminders

Configure when automatic reminders are sent:

| Reminder | Who Receives It | Configurable Setting |
|---|---|---|
| Shift start alert | Employee | Minutes before shift starts |
| Missed clock-in alert | HR | Minutes after shift start when employee hasn't clocked in |

### 🔑 9 — Security Requests

Used when email is not configured. Employees can still request password resets through the app. Those requests appear here for Admin:

| Action | What It Does |
|---|---|
| **Approve** | Generates a one-time secure link that Admin shares with the employee |
| **Reject** | Declines the reset request |

### 📋 10 — Audit Log

An immutable, complete record of every significant action taken in the system:

| Detail Captured | Description |
|---|---|
| **Who** | Name and role of the person who took the action |
| **What** | The exact action performed |
| **When** | Precise date and timestamp |
| **Before & After** | Values before and after any data change |
| **Where From** | IP address from which the action was taken |

- ✅ Filter by action type, user, or date range
- ✅ Export the audit log for compliance or external review
- ✅ The audit log **cannot be modified or deleted** — it is always a complete and accurate record

### 🧪 11 — Demo Data

For testing and training purposes:

- ✅ Populate the platform with a realistic set of sample data for demonstration
- ✅ Demo data uses the same underlying system as real data — all features work identically
- ✅ **Remove Demo Data** — a guarded admin action that:
  - Requires a typed confirmation
  - Shows a preview of everything that will be removed (with exact counts)
  - Deletes all demo-related data safely without touching real records
  - Is logged in the audit trail
  - Can be re-run for re-seeding
- ✅ After removal, the app is a clean production instance ready for real use

### 🔄 12 — System Jobs

Monitor the health of background processing:

- ✅ See how many background jobs are pending or have failed
- ✅ Retry failed jobs individually without needing technical support
- ✅ Useful for diagnosing why an export didn't arrive or a reminder wasn't sent

---

## 12. My Profile

Click your **avatar or profile picture** in the top-right corner, then select **Profile**.

### 12.1 Profile Header

- ✅ Upload or drag-drop a new profile photo (maximum **2 MB**)
- ✅ See your name, current role(s), and a quick summary of your attendance stats

### 12.2 General Info Tab

Update your personal information:

| Field | Who Can Edit |
|---|---|
| Full name | You (yourself) |
| Phone number | You (yourself) |
| Emergency contact | You (yourself) |
| Job designation | **HR or Admin only** — employees cannot change their own title |
| Department | Read-only — managed by Admin |
| Company | Read-only |

### 12.3 Security & Devices Tab

**Change Password:**
- ✅ Enter your current password and your desired new password
- ✅ The new password must meet your company's configured policy
- ✅ Validation feedback appears as you type

**Active Sessions:**

| Information Shown | What It Tells You |
|---|---|
| Device type | What kind of device is logged in |
| IP address | Where the login is coming from |
| Last active | When that session was last used |

- ✅ **Revoke** any session to log out from that device remotely
- ✅ Revoking your current session logs you out immediately
- ✅ Useful if you forgot to sign out on a shared or lost device

### 12.4 Preferences & Support Tab

**Display Preferences:**

| Setting | Options |
|---|---|
| **Directory Visibility** | Public (shows contact info to colleagues) or Private (name and role only) |
| **Theme** | Light / Dark / System (auto-follows your device preference) |
| **Display Density** | Comfortable (more spacing) or Compact (tighter, more content visible) |
| **Hidden Widgets** | Restore any dashboard widgets you've previously dismissed |

**Feedback & Complaint Channel:**

This is a private channel for sending feedback or raising concerns:

1. Select category: **Suggestion** or **Complaint**
2. Write a subject line and your detailed message
3. Click Submit

**What happens after submitting:**
- ✅ Your message is delivered as a **direct message** to your managing HR or Admin
- ✅ They also receive a **high-priority notification** flagging it for immediate attention
- ✅ This channel is completely private — other employees cannot see your submission

---

## 13. Mobile Experience

The mobile layout is fully optimized for quick, on-the-go use with one-handed operation.

### 13.1 Mobile Bottom Navigation Bar

The main navigation moves from the sidebar to a bottom bar with up to 5 icons:

| Icon | Destination |
|---|---|
| 🏠 | Dashboard |
| 📁 | Projects & Tasks |
| 🟢 **Green FAB** | **Attendance** — the large green floating button, always visible |
| 💬 | Chat |
| 👤 | My Profile |

The **hamburger menu (☰)** opens the full navigation as a slide-over panel to access everything else.

### 13.2 Mobile Attendance Widget

The attendance clock is the **largest, most prominent element** on the mobile interface:

- ✅ **Full-width green "Start Shift" button** — impossible to miss
- ✅ While working: full-width live timer + **"Take Break"** and **"End Shift"** buttons, color-coded
- ✅ All buttons have a **minimum 48px height** for easy, accurate tapping
- ✅ Works fully offline — punches are queued locally and sync on reconnect

### 13.3 Mobile Chat Experience

- ✅ Chat list is the first view
- ✅ Opening a conversation loads a **full-screen thread view**
- ✅ A **back button** returns to the conversation list
- ✅ The message input stays **fixed at the bottom**, above the keyboard at all times

### 13.4 Mobile Forms

Important forms (leave requests, task submission) use responsive, mobile-friendly layouts:

- ✅ All fields are shown on a single scrollable screen with large touch targets
- ✅ Minimum **44px height** on all inputs and buttons
- ✅ Fields stack in a single column on small screens — no cramped side-by-side layouts
- ✅ **Native mobile date pickers** are used for date selection (familiar, intuitive)

### 13.5 Kanban Board on Mobile

- ✅ Columns **snap** smoothly when swiping left/right between To Do, In Progress, Review, and Done
- ✅ **Long-press** a task card to drag it to a different column

### 13.6 Offline Behavior

| Situation | Platform Behavior |
|---|---|
| Connection drops | Banner appears: *"You're offline. Some features may not be available."* |
| Shift timer while offline | Continues counting locally; syncs automatically on reconnect |
| Forms filled offline | Queued and submitted automatically when connection returns |
| Chat while offline | Shows "Not connected" status; messages queue and send on reconnect |

---

## 14. UX Patterns & Global Behaviors

These design patterns are applied consistently throughout the entire platform, regardless of page or role.

### 14.1 Breadcrumb Navigation

- ✅ Shown below the top bar on all detail screens
- ✅ Shows your exact location in the app hierarchy
- **Example:** `Projects → Website Redesign → Task List → Design Homepage`
- ✅ Every breadcrumb item is a **clickable link** back to that level
- ✅ Especially helpful when navigating deeply nested areas like project task details

### 14.2 Pinned Items / Favourites

- ✅ Any project, task, or employee profile can be pinned for quick access
- ✅ A **star or pin icon** appears when hovering over an item
- ✅ Pinned items appear in a **Pinned section at the bottom of the sidebar** as one-click jump links
- ✅ Maximum **100 pinned items** per user
- ✅ Pins can be removed at any time by clicking the pin/star icon again

### 14.3 Form Behavior (Universal)

Every form across the platform follows these rules:

| Behavior | Details |
|---|---|
| **Required fields** | Clearly marked — form cannot be submitted if they are empty |
| **Validation timing** | Happens as you type, on pause — not only when you hit submit |
| **Error messages** | Appear directly under the field that has an issue |
| **Submit button state** | Shows a dot-loader animation and becomes non-clickable while saving |
| **Success confirmation** | A green toast notification confirms the completed action |
| **Long forms** | Broken into clearly headed sections |
| **Auto-save** | All non-quick-action forms save a draft every 30 seconds |
| **Draft restoration** | A banner appears on return: *"You have an unsaved draft. Continue editing?"* |

### 14.4 Loading States

| Situation | Visual Indicator |
|---|---|
| Page or widget loading | **Skeleton loaders** — gray shimmering placeholders in the exact content shape |
| Button submitting | Button text changes to an **animated dot-loader** and becomes non-clickable |
| Progress bars first appear | **Animate from 0% to current value** — never jump to the number |

### 14.5 Empty States

Every list or section that could be empty shows a helpful message with a small illustration — never a blank space:

| Situation | Message Shown |
|---|---|
| No assigned projects | *"No projects assigned yet. Check back soon or ask your HR."* |
| No pending tasks | *"All clear! No tasks pending right now."* |
| No notifications | *"You're all caught up."* |
| No chat messages | *"No messages yet. Start the conversation."* |

- ✅ Each empty state includes a **small, relevant illustration**
- ✅ Many empty states include an **optional action button** (e.g., "Create a Task")

### 14.6 Toast Notifications

Small confirmation pop-ups that inform without interrupting your workflow:

| Color | Meaning | Example Message |
|---|---|---|
| 🟢 **Green** | Success | *"Task submitted successfully."* |
| 🔴 **Red** | Error | *"Something went wrong. Please try again."* |
| 🟡 **Amber** | Warning | *"Your session will expire in 5 minutes."* |
| 🔵 **Blue** | Information | *"Rajan has started their shift."* |

- ✅ Auto-dismiss after **4 seconds**
- ✅ Include an **✕ button** to dismiss immediately
- ✅ Appear in the **top-right corner** of the screen

### 14.7 Inline Editing

For short text fields (like task name, project name, or department name):

- ✅ Hover over the text to reveal a **pencil icon**
- ✅ Click the icon to edit the text **in place** — no form popup, no page navigation
- ✅ Press **Enter** to save
- ✅ Press **Escape** to cancel and restore the original value

### 14.8 Confirmation Dialogs

All destructive or irreversible actions show a confirmation before executing:

- ✅ Title: *"Are you sure?"*
- ✅ Description explaining exactly what will happen
- ✅ A **Cancel** button (safe exit) and a **Confirm** button
- ✅ The Confirm button is **red** for destructive actions
- ✅ Cannot be bypassed — the action does not execute until confirmed

### 14.9 Hover States & Tooltips

- ✅ Every **icon-only button** shows a descriptive tooltip label on hover
  - Example: Pause button → *"Pause Work Session"*
  - Example: Bell icon → *"Notifications (3 unread)"*
- ✅ Any text **truncated with "..."** shows the full text in a tooltip on hover

### 14.10 Drag & Drop

| Drag Zone | What Can Be Dragged | Result |
|---|---|---|
| **Task List** | Tasks within a project | Reorders tasks — new order is saved automatically |
| **Dashboard Widgets** | Any dashboard widget | Rearranges your layout — saved per user across all devices |
| **Kanban Board** | Task cards between columns | Moves a card and automatically updates the task's status |

### 14.11 Status Badges

Every task, project, leave request, and approval has a colored pill badge:

| Color | Status | What It Means |
|---|---|---|
| ⬜ **Gray** | Not Started | Item hasn't been started yet |
| 🔵 **Blue** | In Progress | Currently being worked on |
| 🟡 **Amber** | Pending Review / Approval | Submitted and awaiting a decision |
| 🟢 **Green** | Approved / Completed / Done | Finished and approved |
| 🔴 **Red** | Redo Required / Rejected / Overdue | Needs rework, was rejected, or is past its deadline |

### 14.12 Live Timer Display

- ✅ All timers display as **HH:MM:SS** counting upward
- ✅ When a timer exceeds the expected duration, the **text turns amber** to indicate overtime
- ✅ Timers continue running when you navigate to other pages — they don't reset or pause
- ✅ A timer stops **only** when you explicitly click End Shift or End Session

### 14.13 Auto-Save & Draft Restore

- ✅ All forms (except quick actions) automatically save a draft **every 30 seconds**
- ✅ If you close the tab or navigate away mid-form, a banner appears on your return:
  > *"You have an unsaved draft. Continue editing?"* — with a **Restore** button
- ✅ Drafts are preserved until you submit the form or explicitly discard them

### 14.14 Keyboard Shortcuts

| Shortcut | What It Does |
|---|---|
| `Ctrl / Cmd + K` | Open the **command palette** — search, navigate, or take quick actions |
| `Ctrl / Cmd + N` | **Create new** (context-aware: new task on task pages, new project on project pages) |
| `Ctrl + B` | **Toggle the sidebar** open or closed |
| `Ctrl + /` | Show the **keyboard shortcuts help overlay** |
| `Escape` | **Close** any open modal, dropdown, or sliding panel |
| `Enter` | **Submit** the focused form or confirm a dialog |
| `Shift + Enter` | **New line** in a chat message input (without sending) |

### 14.15 Pagination

| Setting | Value |
|---|---|
| **Default items per page** | 20 |
| **Available options** | 20 / 50 / 100 items per page |
| **Navigation** | Page numbers with next/previous buttons |

### 14.16 Filter & Sort Bar

Every list page has a consistent filter bar directly below the page header:

| Filter Element | What It Does |
|---|---|
| **Search field** | Text search within the current list |
| **Status filter** | Multi-select dropdown for each available status |
| **Date range** | "From" and "To" date pickers |
| **Department / Team** | Filter by organizational structure (where applicable) |
| **Priority** | Filter by priority level (where applicable) |
| **Sort dropdown** | Choose which field to sort by |
| **Direction toggle** | Switch between ascending and descending order |
| **Clear All** | Appears only when filters are active — resets everything in one click |
| **Active filter chips** | Show current active filters as removable tags below the bar |

### 14.17 Activity Log (Per Task & Project)

Every project and task has an **Activity** tab or "View History" link showing:

- ✅ A chronological list of every action taken on that item
- ✅ Who performed the action and the exact date/time
- ✅ Common entries include: creation, assignments, progress updates, submissions, and approval decisions

### 14.18 Quick Notes (Personal Sticky Notes)

- ✅ Accessible from the sidebar or the command palette (`Ctrl+K`)
- ✅ Create short private notes for personal reminders or ideas
- ✅ Pin any note to make it appear on your dashboard
- ✅ Notes are **completely private** — no one else can see them
- ✅ Designed for quick writing — not a full document editor

---

## 15. Approval Workflows (End-to-End)

### 15.1 Task Approval Flow

```
HR/Admin creates a task
        ↓
Employee receives a notification
        ↓
Employee works on the task
  (comments, logs time, updates progress, waits on dependencies)
        ↓
Employee clicks "Submit for Review"
  → Writes a completion note (required)
  → Fills in any QA form fields (if attached)
        ↓
Manager receives a notification
        ↓
Manager opens the task, reads the note and QA answers
        ↓
    APPROVE                          REQUEST REDO
       ↓                                  ↓
Task → "Done"                   Manager writes a reason
Employee notified               Task returns to "In Progress"
Optional chat message posted    Employee notified
If recurring → next             Employee fixes and resubmits
instance auto-created           Cycle repeats
```

### 15.2 Project Approval Flow

```
HR/Admin creates a project
        ↓
Project chat is automatically created with all team members
        ↓
Tasks are assigned and completed (→ Task Approval Flow, repeated per task)
        ↓
All tasks complete
        ↓
Employee submits the project
  → Writes a project completion report (required)
  → Fills in the project QA form (if attached)
        ↓
HR and Admin are both notified
Project status → "In Review"
        ↓
Manager reviews the submission
        ↓
    APPROVE                          REQUEST REDO
       ↓                                  ↓
Project → Complete              Manager writes a reason
Timestamp recorded              Project returns to active
Team notified                   Employee corrects and resubmits
```

### 15.3 Leave Request Flow

```
Employee submits a leave request
  → Future date only (tomorrow or later)
  → Balance is checked automatically
        ↓
HR receives notification (or Admin if HR is submitting)
        ↓
HR/Admin reviews the request
        ↓
    APPROVE                          REJECT
       ↓                               ↓
Attendance marked "On Leave"   Written reason required
  for all days in the period   Employee notified
Leave balance deducted         with rejection reason
Employee notified
```

### 15.4 Quick Task Flow

```
HR/Admin uses the "Quick Task" dashboard widget
        ↓
Selects employee, fills in title, description, priority, due date
        ↓
Clicks Create
        ↓
Task appears IMMEDIATELY in employee's task list
Employee receives instant notification
        ↓
Employee works on and submits the task
        ↓
Normal Task Approval Flow begins
        ↓
When approved → notification auto-posted to Global Chat
```

### 15.5 Password Reset Flow (When Email Is Configured)

```
Employee clicks "Forgot Password"
        ↓
Enters email / employee ID / username
        ↓
Receives a secure reset link by email
(valid for 60 minutes)
        ↓
Opens link → sets new password
        ↓
Redirected to sign in
```

### 15.6 Password Reset Flow (When Email Is NOT Configured)

```
Employee submits in-app reset request
        ↓
Request appears in Admin's Settings → Security Requests
        ↓
Admin reviews the request
        ↓
APPROVE → one-time link generated     REJECT → request declined
Admin shares link with employee       Employee notified
```

---

## 16. Key End-to-End Workflows

### 16.1 Setting Up a New Company (Admin)

```
✅ Step 1 — Sign in and complete onboarding
✅ Step 2 — Settings → Company Profile
           → Set company name, logo, and timezone

✅ Step 3 — Settings → Work Schedules
           → Create shift templates with start/end times, grace period, working days
           → Set the default schedule

✅ Step 4 — Settings → Policies
           → Configure password rules, session limits, device rules

✅ Step 5 — Settings → Mail / SMTP
           → Configure email server and send a test email

✅ Step 6 — Settings → Holidays
           → Add all public and company holidays

✅ Step 7 — Directory → Departments
           → Create departments
           → Assign HR managers to each department
           → Create sub-teams within each department

✅ Step 8 — Directory → Designations
           → Add all job title options

✅ Step 9 — Directory → Employee Management
           → Add HR accounts first (they receive welcome emails)
           → Add employee accounts (they receive welcome emails)

✅ Step 10 — HR logs in
            → Creates projects
            → Assigns tasks
            → Team begins working
```

### 16.2 A Typical Employee Workday

```
📱 Phone notification: "Your shift starts in 15 minutes. Don't forget to clock in!"

→ Open the app (mobile or desktop)
→ Clock In
  (Late badge appears if past the grace period)

→ Navigate to Projects & Tasks
→ Open your assigned project
→ Start the project work timer
→ Open a task → update progress → leave a comment

→ Task is done → click "Submit for Review"
  → Write a completion note
  → Fill in the QA form if required
  → Submit

→ Continue working on other tasks

→ 📬 Notification: "Your task has been approved" (or "Redo required")

→ "Start Break" when stepping away
→ "End Break" when returning to desk

→ Clock Out at end of shift

→ Check attendance history to see the day's summary and any overtime logged
```

### 16.3 HR Daily Attendance Oversight

```
HR opens the Team Attendance Console
(View updates in real time — no refresh needed)

→ Review who is present, late, absent, or on leave
→ Check "Team Activity" for alerts about missed clock-ins

→ For any employee with an issue:
   → Click their row to see full day detail and history

→ If attendance needs correcting:
   → Click "Correct Attendance"
   → Add/edit/remove punch events
   → Enter a reason (required)
   → Save
   → Employee is notified automatically

→ Process any pending leave requests from the approval queue

→ Export weekly attendance data when needed

→ Every Sunday: receive automated summary email
```

### 16.4 Onboarding a New Employee (HR/Admin)

```
HR/Admin creates employee account in Directory → Employee Management
        ↓
System auto-generates a temporary password
        ↓
If email configured: welcome email sent automatically
If not: HR shares the temp password directly
        ↓
Employee opens the platform and signs in
        ↓
System forces a password change before anything else
        ↓
Employee completes 3-step onboarding:
  1. Adds phone number and emergency contact
  2. Optional password update
  3. Takes the guided platform tour
        ↓
Employee lands on their dashboard
        ↓
HR assigns them to a project
        ↓
Employee receives notification and gains access to:
  - The project
  - The project's tasks
  - The project's group chat
```

---

## 17. App Navigation Map & Sidebar Structure

### 17.1 Screens Available to All Roles

| Screen | Purpose |
|---|---|
| **Sign In** | Login page — shared by all roles |
| **Role Selection** | Appears for multi-role users after login |
| **Dashboard** | Home screen — customized per role |
| **Chat** | All conversations, announcements, and notifications |
| **My Profile** | Personal profile, security, and preferences |
| **Notifications** | Bell icon accessible from every page |

### 17.2 Admin-Only Screens

| Screen | Purpose |
|---|---|
| **User Management — HR Accounts** | Create and manage HR user accounts |
| **User Management — Employee Accounts** | Create and manage employee accounts |
| **Department Management** | Create, configure, and manage all departments |
| **Company Settings** | Full system configuration |
| **Reports** | Full company-wide reports and exports |
| **Full Attendance Overview** | Company-wide attendance data |
| **All Projects Overview** | Every project across all departments |
| **All Tasks Overview** | Every task across the company |
| **Audit Log** | Immutable record of all system actions |

### 17.3 HR Screens

| Screen | Purpose |
|---|---|
| **HR Dashboard** | Team overview with approvals and attendance |
| **My Attendance** | HR's own clock in/out and history |
| **Employee Attendance** | Team attendance overview for assigned departments |
| **Leave Requests** | Own leave requests + employee leave approvals |
| **Projects** | Create and manage team projects |
| **Tasks** | Create, assign, and review tasks |
| **Project History** | Log of all completed projects |
| **Notification Center** | Within Chat — all approvals and alerts |

### 17.4 Employee Screens

| Screen | Purpose |
|---|---|
| **Employee Dashboard** | Personal daily summary |
| **My Attendance** | Own clock in/out and history |
| **My Leave Requests** | Submit and track own leave |
| **Assigned Projects** | Projects the employee is a member of |
| **My Tasks** | Personal task list (private) |
| **Project Timer** | Work timer per project |
| **Project History** | Log of completed projects |

### 17.5 Sidebar Navigation Structure

#### 🔑 Admin Sidebar
```
📊 Dashboard
👥 Team
    ├── Attendance (company-wide)
    ├── HR Accounts
    └── Employee Accounts
📁 Projects
    ├── All Projects
    ├── All Tasks
    ├── Progress Overview
    ├── Global Tasks
    └── Project-Specific Tasks
✅ Tasks (personal to-do + reminders)
💬 Chat
📊 Reports
👤 My Profile
    ├── Departments
    └── Settings
```

#### 👩‍💼 HR Sidebar
```
📊 Dashboard
🕐 Attendance
    ├── My Attendance
    ├── Employee Attendance
    └── Leave Requests
📁 Projects
    ├── Projects with Team
    ├── Tasks
    ├── Progress
    ├── Global Tasks
    ├── Project-Specific Tasks
    └── Personal Tasks (to-do)
💬 Chat
👤 My Profile
```

#### 👤 Employee Sidebar
```
📊 Dashboard
🕐 Attendance
    ├── My Attendance
    └── My Leave Requests
📁 Projects
    ├── My Projects
    ├── My Tasks
    ├── Progress
    ├── Global Tasks
    ├── Project-Specific Tasks
    └── Personal Tasks (to-do)
💬 Chat
👤 My Profile
```

---

## 18. Security & Privacy

### 18.1 Authentication & Login Security

| Security Layer | How It Works |
|---|---|
| **Account lockout** | 5 failed login attempts → 10-minute lockout with a live countdown |
| **Password reset** | Secure link via email (valid 60 min) or admin-approved in-app flow |
| **Suspicious login detection** | Unusual IP or device triggers alerts to all HR and Admin |
| **Session auto-refresh** | Sessions silently refresh every 15 minutes — no unexpected logouts |
| **Session duration** | Remains valid up to 7 days with activity |
| **Multi-device control** | Admin can cap the number of concurrent devices per user |
| **Password policy** | Minimum length, complexity, and expiry — all configurable by Admin |
| **Forced password change** | Required on first login after account creation or admin-initiated reset |

### 18.2 Session Management

- ✅ Every user can view all their active sessions under My Profile → Security & Devices
- ✅ Any session can be remotely revoked from any device at any time
- ✅ Revoking your current session logs you out immediately
- ✅ Deleting or deactivating an account immediately revokes all of that user's sessions
- ✅ Revoking a session sends a notification to the affected user

### 18.3 Data Access Controls

| Rule | Enforcement |
|---|---|
| HR scope | HR can only see data for their assigned departments |
| Employee scope | Employees only see their own data and assigned projects |
| Self-approval | Nobody can approve their own requests — always enforced |
| Personal tasks | Only visible to the assigned employee and their HR/Admin |
| Quick notes | Completely private — visible only to the creator |
| Directory visibility | Employees choose whether their contact info is public or private |
| Cross-role access | Project chats only accessible to project members |

### 18.4 Audit Trail & Accountability

- ✅ Every significant action is permanently logged in the Audit Log
- ✅ Captures: who, what, when, before-value, after-value, and IP address
- ✅ Logs include: logins, attendance corrections, account changes, approval decisions, and settings changes
- ✅ The audit log **cannot be modified or deleted** by anyone, including Admin
- ✅ Exportable for compliance, HR review, or external audit purposes

### 18.5 Data Integrity

- ✅ Deleted accounts are **soft-deleted** — historical data is preserved for audit and reporting
- ✅ Attendance records are protected — corrections require a reason and create an audit entry
- ✅ Leave balance changes are atomic — no race condition can result in incorrect balances
- ✅ All approval decisions are permanently recorded with the decision-maker's identity

---

## 19. Quick Reference — Rules & Limits

### 19.1 Login & Session Security

| Rule | Limit |
|---|---|
| Login attempts before lockout | 5 attempts |
| Lockout duration | 10 minutes |
| Password reset link validity | 60 minutes |
| Session auto-refresh interval | Every 15 minutes (silent, no interruption) |
| Maximum session duration | 7 days with active use |

### 19.2 Leave Request Rules

| Rule | Detail |
|---|---|
| Earliest permitted start date | Tomorrow — no same-day or backdated leave |
| Available leave types | Casual / Sick / Earned / Unpaid |
| Default annual leave balance | 12 days per type, per year |
| Maximum reason length | 1,000 characters |
| Rejection reason | Required — cannot reject without providing a reason |
| Self-approval | Never permitted — all requests go to a designated approver |

### 19.3 Task Rules

| Rule | Detail |
|---|---|
| Title maximum length | 255 characters |
| Priority levels | Low / Medium / High / Urgent |
| What employees can edit on a task | Status, progress %, due date, description |
| Submitting requires | A written completion note + all required QA form fields |
| Blocked tasks | Cannot be submitted until all dependencies are complete |
| Minimum time log entry | 1 minute |

### 19.4 File & Upload Limits

| Type | Limit |
|---|---|
| Chat file attachments | 10 MB per file |
| Profile photo | 2 MB |

### 19.5 Chat & Messaging Rules

| Rule | Detail |
|---|---|
| Self-DM | Not permitted — you cannot message yourself |
| Maximum attachment size | 10 MB per file |
| Inline preview support | Images and PDF files |

### 19.6 Attendance Correction Rules

| Rule | Detail |
|---|---|
| Who can make corrections | HR (their departments only) and Admin (all departments) |
| Reason required | Always — cannot be skipped |
| Maximum reason length | 500 characters |
| Audit trail | Always created — captures before and after values |
| Employee notification | Automatically sent whenever their record is corrected |

### 19.7 Dashboard & Pinning Rules

| Rule | Limit |
|---|---|
| Maximum pinned items per user | 100 items |
| Pagination default | 20 items per page |
| Pagination options | 20 / 50 / 100 items per page |

---

## 20. Status Color Guide & Keyboard Shortcuts

### 20.1 Universal Status Badge Colors

| Color | Status | Applies To |
|---|---|---|
| ⬜ **Gray** | Not Started | Tasks, projects not yet begun |
| 🔵 **Blue** | In Progress | Tasks and projects being actively worked on |
| 🟡 **Amber** | Pending Review / Pending Approval | Any submitted item awaiting a decision |
| 🟢 **Green** | Approved / Completed / Done | Items fully reviewed and approved |
| 🔴 **Red** | Redo Required / Rejected / Overdue | Items sent back for rework, rejected, or past their deadline |

### 20.2 Attendance Calendar Colors

| Color | Meaning |
|---|---|
| 🟢 **Green** | Present and on time |
| 🟡 **Amber** | Late arrival (clocked in after grace period) |
| 🔵 **Blue** | Overtime worked that day |
| 🟣 **Purple** | On approved leave |
| ⬜ **Gray** | Absent — no attendance recorded |
| 🏖️ **Light Blue** | Public holiday |

### 20.3 Toast Notification Colors

| Color | Type | Example |
|---|---|---|
| 🟢 **Green** | Success | *"Task submitted successfully."* |
| 🔴 **Red** | Error | *"Something went wrong. Please try again."* |
| 🟡 **Amber** | Warning | *"Your session will expire in 5 minutes."* |
| 🔵 **Blue** | Information | *"Rajan has started their shift."* |

### 20.4 Complete Keyboard Shortcut Reference

| Shortcut | Action |
|---|---|
| `Ctrl / Cmd + K` | Open the command palette (search, navigate, create) |
| `Ctrl / Cmd + N` | Create new — context-aware based on current page |
| `Ctrl + B` | Toggle the sidebar open or closed |
| `Ctrl + /` | Show the keyboard shortcuts help overlay |
| `Escape` | Close any open modal, dropdown, drawer, or panel |
| `Enter` | Submit the focused form or confirm the active dialog |
| `Shift + Enter` | Insert a new line in a chat message without sending |

---

## Appendix A — Announcement Priority Levels

| Level | In-App Feed | Notification Sent | Urgency |
|---|---|---|---|
| **Normal** | ✅ | ❌ | Low — informational update |
| **High** | ✅ | ✅ To relevant users | Medium — time-sensitive information |
| **Urgent** | ✅ | ✅ To everyone | High — requires immediate attention |

---

## Appendix B — Chat Conversation Types Summary

| Type | Members | Created By | Features |
|---|---|---|---|
| **Global Chat** | Everyone | System (automatic) | Company-wide, always exists |
| **Project Chat** | Project team only | System (on project creation) | Task completion alerts, pinned messages |
| **Direct Message** | 2 users | Any user | Read receipts (✓ / ✓✓) |
| **Custom Group** | Selected members | HR or Admin only | Members-only, HR-managed |

---

## Appendix C — Leave Types Reference

| Type | Best Used For | Requires Approval |
|---|---|---|
| **Casual Leave** | Personal appointments, short notice | ✅ Yes |
| **Sick Leave** | Health or medical situations | ✅ Yes |
| **Earned Leave** | Planned vacation, accrued time off | ✅ Yes |
| **Unpaid Leave** | Extended absence without pay | ✅ Yes |

---

## Appendix D — QA Form Field Types Reference

| Field Type | What It Captures | Best Used For |
|---|---|---|
| **Text** | Short single-line answer | Names, brief responses |
| **Long Text** | Multi-paragraph response | Detailed explanations |
| **Checkboxes** | Multiple selections | Checklists, multi-item confirmations |
| **Yes / No** | Binary answer | Compliance confirmation |
| **Multiple Choice** | One answer from a list | Category selection, ratings |
| **Slider** | Numeric value in a range | Scores, percentages, quality ratings |
| **Date** | A specific date | Submission dates, deadlines |
| **File Upload** | Attached file | Evidence, screenshots, documents |

---

## Appendix E — Role Selector Cheat Sheet

| Situation | What To Do |
|---|---|
| Only one role assigned | Go straight to dashboard after login |
| Two or more roles assigned | Role Selection screen appears — choose the role for this session |
| Want to switch roles | Sign out → sign back in → select the other role |
| Not sure of your role | Check My Profile → General Info to see your assigned role(s) |

---

*Documentation version: **2026-08-19***
*Product: **Games4Kings Workplace OS***
*For technical architecture, implementation details, and development planning, refer to `context.md` and `finalization.md`.*
