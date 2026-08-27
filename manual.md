# Games4King — Workplace OS User Manual

Welcome to Games4King! This manual explains everything the system can do, in the order you will actually use it — from your very first login to day-to-day work like marking attendance, chatting, managing projects, approving leave, and running reports. It covers all three user roles: **Employee**, **HR**, and **Super Admin**.

> **How to read this manual:** Start with "Getting Started" if this is your first time in the system. After that, each chapter is self-contained, so you can jump straight to what you need. Chapters marked *(All roles)* apply to everyone; otherwise the chapter tells you which role it is for.

---

## Table of Contents

1. [The System at a Glance](#1-the-system-at-a-glance)
2. [User Roles and What Each Can Do](#2-user-roles-and-what-each-can-do)
3. [Getting Started — First Login](#3-getting-started--first-login)
4. [If You Forget Your Password](#4-if-you-forget-your-password)
5. [Understanding Your Workspace (Navigation, Header, Shortcuts, Mobile)](#5-understanding-your-workspace)
6. [Your Dashboard Home (per role, widget by widget)](#6-your-dashboard-home)
7. [Attendance & Time — Your Daily Clock](#7-attendance--time--your-daily-clock)
8. [Leave — Requesting, Tracking, and Cancelling](#8-leave--requesting-tracking-and-cancelling)
9. [Team & Company Attendance (HR and Super Admin)](#9-team--company-attendance-hr-and-super-admin)
10. [Leave Approvals (HR and Super Admin)](#10-leave-approvals-hr-and-super-admin)
11. [Projects](#11-projects)
12. [Project Detail — Phases, Team, and Activity](#12-project-detail--phases-team-and-activity)
13. [Tasks — Board, List, Timeline, and the QA Tab](#13-tasks--board-list-timeline-and-the-qa-tab)
14. [The Task Detail Window — Comments, Time Logs, Activity](#14-the-task-detail-window)
15. [Task Review Workflow — Submit, Approve, Redo](#15-task-review-workflow--submit-approve-redo)
16. [QA Forms (Quality Checklists)](#16-qa-forms-quality-checklists)
17. [The Project Timer](#17-the-project-timer)
18. [Communications — Chat, Announcements, Notifications](#18-communications--chat-announcements-notifications)
19. [Directory — People, Employee Management, Departments, Designations](#19-directory--people-employee-management-departments-designations)
20. [Employee 360 — One Person's Full Picture](#20-employee-360--one-persons-full-picture)
21. [Reports & Analytics](#21-reports--analytics)
22. [Audit Logs (Super Admin)](#22-audit-logs-super-admin)
23. [System Settings (Super Admin)](#23-system-settings-super-admin)
24. [My Profile](#24-my-profile)
25. [Sessions, Security, and Password Changes](#25-sessions-security-and-password-changes)
26. [Working Offline](#26-working-offline)
27. [Automatic System Behaviors You Should Know](#27-automatic-system-behaviors-you-should-know)
28. [Role Capability Reference (Who Can Do What)](#28-role-capability-reference)
29. [Troubleshooting & FAQ](#29-troubleshooting--faq)

---

## 1. The System at a Glance

Games4King (G4K) is your company's single workplace platform. It replaces separate tools for:

- **Attendance** — clock in/out, breaks, shifts, corrections, and overtime
- **Leave** — leave requests, balances, holidays, and approvals
- **Projects & Tasks** — project tracking with phases, Kanban board, timeline (Gantt), task review, quality (QA) checklists, and time tracking
- **Communication** — company chat, direct messages, group chats, project channels, announcements, and notifications
- **People (Directory)** — employee records, departments, designations, and an org chart
- **Reports** — attendance, leave, productivity, and data exports
- **Administration** — company profile, work schedules, security policies, holidays, mail, audit logs, and demo data controls

Everything is role-based: an **Employee** sees their own world, an **HR Manager** sees their departments, and the **Super Admin** sees and controls everything.

---

## 2. User Roles and What Each Can Do

Every user has at least one role. Some users have more than one (for example, someone who is both HR and an Employee) and can switch between them (see [My Profile](#24-my-profile)).

### Employee
Your everyday role. You can:

- Clock in/out and take breaks
- Request and track your own leave
- View your dashboards, holidays, and announcements
- Chat (company-wide chat, direct messages, project channels)
- Browse the company directory
- View projects you are a member of
- Work on tasks assigned to you, create your own personal tasks, and submit work for review
- Track time with the project timer

### HR (HR Manager)
Everything an Employee can do, plus management tools:

- See and manage **your assigned departments** (a super admin assigns which departments each HR manages)
- View team attendance "today" boards, trends, and graphs; correct attendance records
- Approve or reject your team members' leave requests
- Create and manage projects, tasks, and phases for your departments
- Review and approve/re-do submitted task work
- Create group chats and team announcements
- Manage employees in your departments (create, edit, deactivate, reset passwords)
- Manage departments and designations
- See reports for your teams

### Super Admin
The owner of the system. Everything HR can do — but with **no department limits** — plus:

- Full company-wide attendance views (calendar heatmap, live shifts, analytics)
- All leave approvals across the company, including HR members' own leave
- Manage any user, including creating other Super Admins and HRs
- All settings: company profile, work schedules, policies, holidays, SMTP mail, notification channels, auto-numbering, reminders, security requests (password reset approvals), demo data, and system job monitoring
- Audit logs (system events + login history)
- Data exports of every kind

> **Note on approval chains:** Leave submitted by an **Employee** goes to **HR** for approval. Leave submitted by an **HR** member goes to the **Super Admin**. The Super Admin approves their own (the system allows this by design so the top-level account is never stuck).

---

## 3. Getting Started — First Login

### Step 1 — Open the login page
Go to your company's Games4King web address. You will see the login screen.

### Step 2 — Enter your identifier and password
You can log in with **any one** of the following — whichever you find easiest:

- Your **email address** (e.g. `priya@games4king.in`)
- Your **username** (e.g. `priya`)
- Your **employee ID** (e.g. `G4K005`)

Then type your password. Your administrator gives you these details when your account is created.

**"Remember me" checkbox:**
- **Ticked** — you stay logged in on this device for up to 7 days, even after closing the browser.
- **Unticked** — your session ends when you close the browser.

**Wrong password?** After **5 failed attempts in a row your account locks for 10 minutes**. You'll see a countdown telling you when you can try again. (Your administrator can also unlock you early by reactivating your account.)

### Step 3 — Change your password (if asked)
If your administrator created your account with a temporary password, or your password has expired by policy, you'll be taken to the **Change Password** screen before anything else:

1. Enter your current password.
2. Enter your new password twice. The page shows your company's password rules live (for example: minimum length, must contain upper and lower case). A strength meter helps you pick a good one.
3. Click save. You stay logged in and all your other devices are logged out automatically (a security feature).
4. If your company has **not** made the password change compulsory, you'll see a **Skip for now** button. If password change **is** compulsory, there is no skip button.

### Step 4 — Complete onboarding (first time only)
The first time you log in you'll see a welcome screen with your name, employee ID, role, and department — and a short animated intro.

1. (Optional but recommended) Add your **phone number** and an **emergency contact number**.
2. Click **Get Started**. This screen appears only once.

### Step 5 — Choose your role (only if you have more than one)
If your account has multiple roles (e.g. HR + Employee), you'll see a **workspace picker** with a card for each role. Pick the one you want to work in right now. You can switch roles any time from My Profile (see [24. My Profile](#24-my-profile)) — the system quietly re-signs you in under the new role without asking for your password again.

### Step 6 — You're on your Dashboard 🎉
From here, everything happens inside the workspace described in the next chapter.

> **Session expiry:** For security, your sign-in refreshes automatically in the background. If you're ever away longer than allowed, you'll be returned to the login page with the message "Please sign in again" — just log back in. If an administrator revokes one of your sessions, you are logged out of that device immediately with a notification explaining why.

---

## 4. If You Forget Your Password

1. On the login page click **Forgot password?**
2. Enter your email, username, or employee ID and submit. You'll always see the same confirmation message (the system never reveals whether an account exists — this protects everyone).
3. One of two things happens next:
   - **If your company has email (SMTP) configured:** You receive an email with a reset link. The link is valid for **60 minutes**. Open it, enter a new password (matching your company's password rules), and you're done.
   - **If email is not configured (or the email failed to send):** Your request goes to your administrators as an **in-app password reset request**. A Super Admin reviews it under **Settings → Security Requests**, approves it, and personally hands you a one-time reset link. When you get that link, open it and set your new password.

After a successful reset, **all** your logged-in devices are signed out, and you must log in again everywhere.

---

## 5. Understanding Your Workspace

### The left sidebar
Your menu is grouped into three sections (items appear based on your role):

**Overview**
- **Dashboard** — your personalized home *(everyone)*
- **Attendance & Time** — clock in/out and your leave *(hidden for Super Admins; they manage attendance from the Organization section instead)*
- **Projects & Tasks** — all project & task work *(everyone)*
- **Communications** — chat, announcements, notifications *(everyone; shows a red badge with your unread chat count)*

**Organization**
- **Directory** — people, departments, designations *(everyone)*
- **Attendance** — team/company attendance *(HR & Super Admin)*
- **Reports & Analytics** *(HR & Super Admin)*

**Account**
- **My Profile** *(everyone)*
- **Audit Logs** *(Super Admin)*
- **System Settings** *(Super Admin)*

You can **collapse the sidebar** to icons-only (the default), expand it, or hide it completely — click the sidebar toggle button or press **Ctrl+B**. Your choice is remembered on your account, so it follows you across devices. At the bottom of the sidebar you'll also see your **pinned items** — shortcuts you've pinned from anywhere in the app (a project, a task, a person).

Hovering a menu item pre-loads that page, so clicking feels instant.

### The top header
From left to right:

- **Breadcrumb** — shows where you are (e.g. Dashboard / Projects / Website Redesign) with names resolved automatically.
- **Connection status** — a small pill that appears when the live connection needs attention (see [27. System behaviors](#27-automatic-system-behaviors-you-should-know)).
- **Project Timer** — a compact timer for tracking work time (see [17. The Project Timer](#17-the-project-timer)).
- **Notification bell** — your latest notifications and unread count. The list refreshes every 30 seconds; the bell also shows a count of high-priority items. From the dropdown you can jump to any notification's related page, and mark items read/unread.
- **Avatar menu** — your picture/name opens a menu with: **My Profile**, **System Settings** (admins only), **Theme** (Light / Dark / System), **Density** (Comfortable / Compact), **Keyboard shortcuts**, and **Log out**.

### Command palette (Ctrl+K or Cmd+K)
Press **Ctrl+K** (or **Cmd+K** on Mac) from anywhere to open a search box that can:

- Jump to any page or module
- Run quick actions — **Clock in, Start break, End break, Clock out**
- HR actions — view team attendance, correct attendance, run exports
- Admin actions — settings, audit logs
- Find recent items you've viewed lately

### Keyboard shortcuts

| Shortcut | What it does |
|---|---|
| Ctrl/Cmd + K | Open command palette |
| Ctrl + B | Collapse/expand sidebar |
| Ctrl + / | Show keyboard shortcut help |
| Ctrl + N | New item on the current page (e.g. new task, new employee) |

### On mobile
The app adapts to phones with a **bottom navigation bar**: Dashboard, Projects, a center **big round button** that jumps straight to Attendance (clock in/out), Chat (with unread badge), and Profile. Menus become dropdowns, tables become cards, and the chat goes fullscreen with the keyboard handled properly.

---

## 6. Your Dashboard Home

Your dashboard is a **grid of widgets** you can personalize: **drag** them around, **resize** them, **collapse** them to their title bar, or **dismiss** the ones you don't need (dismissed widgets can be restored). Your layout is saved to your account automatically.

The greeting at the top changes with the time of day ("Good morning…", "Good afternoon…").

What you see depends on your role:

### Employee dashboard
- **Announcement Board** — the latest company announcements; you can react with an emoji or dismiss them (see [18. Communications](#18-communications--chat-announcements-notifications))
- **Active Projects / Pending Tasks** — your headline numbers
- **My Submissions** — the status of your recent task submissions (Approved / In Review / Redo)
- **Task Progress** — how far along your current work is
- **Upcoming Holidays** — the next 3 holidays
- **Quick Notes** — private sticky notes (see below)
- **Time Clock** — punch in/out right from the dashboard

### HR dashboard
- **Team Attendance Today** — a snapshot of your departments: how many are present, late, on leave, absent
- **Pending Approvals** — leave requests and task submissions waiting for you, with **Approve / Reject buttons right on the widget**
- **Activity Feed** — attendance exceptions in your teams (late arrivals, unclosed shifts)
- **Quick Task** — create and assign a task in seconds
- **Announcement Board** — read, post, and manage announcements (HR can post to their teams)
- **Upcoming Holidays** and **Quick Notes**
- **Time Clock** — HR members can also punch their own attendance

### Super Admin dashboard
- **Total Employees** (with active/inactive split), **Active Projects**
- **Today's Attendance** — company-wide present/late/on-leave/absent/holiday counts
- **Pending Approvals** — everything awaiting your decision (leave, task submissions, projects in review) with inline **Approve/Reject**
- **Recent Activity** — the latest actions across the system (who did what, when)
- **Quick Task** — assign work quickly
- **Quick Notes**
- A **live shift indicator** — which tasks people are actively working on right now

### Quick Notes (all roles)
A private scratchpad: **Add note**, pick a color, edit, **pin** important ones, delete. Notes are private to you and appear on your dashboard.

---

## 7. Attendance & Time — Your Daily Clock

Open **Attendance & Time** from the sidebar (Employees and HR; Super Admins use the Organization section). The page has two tabs: **Overview** (your attendance) and **My Leave** (your leave — see the next chapter).

### The Time Clock widget
This is your daily punch card. It has four states:

1. **Not started** — your shift hasn't begun. Press **Start Shift** to clock in.
2. **Active (On shift)** — you are clocked in. Press **Pause (Start Break)** when you take a break.
3. **On break** — break time is running (it doesn't count as work time). Press **Resume** to return to work.
4. **Completed** — you pressed **End Shift** and clocked out. The widget shows your totals for the day.

Good-to-know details:

- Ending your shift **while on break** automatically closes the break for you — no lost or weird break records.
- Forgot to clock out and it's the **next day**? Press **Continue Shift** — the system understands overnight shifts and books the punch to the correct day (the day your shift started).
- If you work more than your schedule's standard hours, the widget highlights **overtime**.
- The widget **syncs live across your open tabs and devices** — clock in on your phone, and the desktop app updates.
- **No internet?** Punches made offline are queued safely on your device and sent automatically the moment you're back online (see [26. Working Offline](#26-working-offline)). Duplicate taps are safe — the system de-duplicates them.
- A **client timestamp** is sent with each punch; punches more than 5 minutes in the future or older than 48 hours are rejected to keep records honest.

### Today's Summary card
After your first punch you'll see today's running totals: worked time, break time, overtime, clock-in time, and your current status (Present, Late, On Leave, Holiday).

### Recent Shift Log
Your recent days at a glance (status dot per day). Click any day for a detail popup: clock-in/out times, every break, total worked, overtime. The **View Full Calendar** button opens a calendar heat-map of your entire history — greens for full days, ambers for late, reds for absences, blues for leave.

### How statuses are calculated
The system computes your day automatically from your punches, your work schedule, and the holiday calendar:

- **Present** — clocked in on time (within your schedule's grace period, 10 minutes by default)
- **Late** — clocked in after the grace period; the widget shows how many minutes late
- **On Leave** — an approved leave covers the day
- **Holiday** — a company holiday
- **Absent** — a working day with no attendance and no leave
- **Open shift** — you clocked in but never clocked out (the system reminds you — see below)

You cannot edit your own punches. If something is wrong (forgot to clock in/out, wrong break), ask your HR or the Super Admin to **correct** it — see [9. Team & Company Attendance](#9-team--company-attendance-hr-and-super-admin).

---

## 8. Leave — Requesting, Tracking, and Cancelling

Open **Attendance & Time → My Leave**. You'll see two sub-tabs: **My Leave** (request form + holiday calendar) and **History** (all your past requests).

### Your leave balances
You have a yearly balance for each leave type. By default each type starts at **12 days per year**: **Casual, Sick, Earned, and Unpaid**. The request form shows your remaining days live next to each type — types you've exhausted are greyed out and can't be selected. Balances reset each calendar year.

### Requesting leave — step by step
1. In **My Leave**, use the **Request Leave** form (if you don't see it, your role's dashboard hides it for admins — use the My Leave tab directly).
2. Pick a **leave type** (Casual / Sick / Earned / Unpaid). Your remaining balance shows next to each.
3. Pick the **start date**. Important: **leave must start from tomorrow onwards** — same-day leave can't be requested through the form, so plan ahead (for sudden illness, contact HR directly).
4. Pick the **end date** (same day or later).
5. Write a **reason** (up to 1000 characters).
6. Submit. Your draft is auto-saved as you type, so accidentally closing the page won't lose your work.

What the system checks before accepting your request:

- **No overlaps** — you can't have two leaves covering the same day (pending or approved).
- **At least one working day** — weekends and holidays inside your range don't count; if your entire range falls on non-working days, the request is rejected.
- **Balance available** — the working days requested can't exceed your remaining balance for that type.

After submitting, the status is **Pending** and your HR is notified (a Super Admin's own leave is also shown to themselves; employees' leave goes to HR; HR's leave goes to the Super Admin).

### Tracking and cancelling
In **History** you can filter by type/status, search, and page through your requests. While a request is still **Pending**, you can **Cancel** it (with a confirmation prompt). Once approved, cancelling needs HR or the Super Admin — when they cancel an approved leave, your used balance is refunded automatically and your attendance days are re-calculated.

### Holiday calendar
Next to the request form you'll see the company holiday calendar — navigate by month. The seeded company holidays include Republic Day (26 Jan), Independence Day (15 Aug), Gandhi Jayanti (2 Oct), Christmas (25 Dec), Company Anniversary (15 May) (these repeat every year), plus Holi and Diwali for the current year. The Super Admin can add/edit holidays (see [23. System Settings](#23-system-settings-super-admin)).

---

## 9. Team & Company Attendance (HR and Super Admin)

Open **Organization → Attendance**. What you see depends on your role:

### HR view — two tabs

**Today's Status**
- A snapshot card of your departments: Present / Late / On Leave / Absent / Leave-pending counts
- A table of your team members for any date you pick: status, clock-in/out, worked hours, overtime, late minutes
- Filter by department; search by name
- Click a member to open their **attendance sheet** — their full day detail
- **Correct attendance**: if someone forgot to punch, you can fix it right there (details below)
- Select rows and **export** the day/selection to Excel

**Trends & Graphs**
- Attendance graphs you can group **by date or by employee**, plus a **heat-map** of your teams' attendance over time — spot patterns like repeated late Mondays.

### Super Admin view — five tabs

1. **Calendar** — a company-wide heat-map calendar: pick any date to drill into that day's numbers, color-coded by department status.
2. **Overview** — the full attendance table for any date range, with filters: date from/to, department, specific user, status, plus search, sorting, and pagination. Select rows to export, or export the whole filtered view to Excel. Every row opens the member's attendance sheet.
3. **Analytics & Trends** — charts of attendance over time, grouped by **company or by department**.
4. **Live Shifts** — who is on shift **right now**, including **which task they're actively working on** (from the project timer). Updates in real time.
5. **Leave & Holidays** — three sub-tabs:
   - **Approvals** — all leave requests pending on you, with filters and **Approve / Reject** buttons (see next chapter)
   - **All Leave History** — every leave request company-wide, filterable by status/type, exportable; admins can cancel any leave (balance is refunded if it was approved)
   - **Holidays** — manage the holiday calendar (add/edit/delete holidays)

### Correcting someone's attendance (HR for their teams, Super Admin for anyone)
Use the **Correct** action on an attendance row. You can:

- **Add** a missing punch (clock-in, clock-out, break start, break end) with its time
- **Edit** an existing punch's time
- **Remove** a wrong punch

Every correction requires a **reason**, is written to an audit trail, and the employee is notified automatically. The day's totals (worked hours, overtime, late status) are recalculated immediately.

### Notifying people with open shifts
HR can trigger **"Notify open shifts"** — sends a reminder to everyone who forgot to clock out. The system also does this automatically in the evening (see [27. System behaviors](#27-automatic-system-behaviors-you-should-know)).

---

## 10. Leave Approvals (HR and Super Admin)

When a team member requests leave, approvers see it in two places: the **Pending Approvals widget** on the dashboard (with inline buttons) and the full **Leave & Holidays → Approvals** table (Super Admin) — HR approvers work from their pending list and dashboard widget.

To decide:

1. Open the pending request. Review the type, dates, working-day count, reason, and the person's remaining balance.
2. Click **Approve** or **Reject**. (Rejecting asks for nothing extra; the requester is notified either way with the decision.)

Rules the system enforces:

- You can never approve **your own** leave — HR leave always escalates to the Super Admin.
- HR can only decide leave for **their departments**.
- On approval: the person's balance is deducted for the working days, and the affected dates are automatically marked **On Leave** in attendance (days the person actually worked are never overwritten).
- On rejection of a previously approved leave (or cancellation): the balance is **refunded** and attendance is recalculated.

> **Where do HR approvers find this?** HR opens **Organization → Attendance**; pending leave for their teams surfaces via the dashboard's Pending Approvals widget and the leave areas of the org attendance page. (Deep-links labeled "Leave" take Super Admins to the full Leave & Holidays tab.)

---

## 11. Projects

Open **Projects & Tasks**. The page has two tabs — **All Projects** and **My Tasks & Board** (tasks are covered in the next chapters). Live counts show on each tab.

### Browsing projects
- **Status pills** — All / Active / Completed
- **Filter by priority** (Low / Medium / High / Urgent), **sort** by created date, deadline, or priority, and **search** by name
- Toggle **grid or list** view
- Super Admins additionally see projects **grouped into department sections**
- Inline **rename** on project cards (managers)
- Simple **previous/next pagination** through results
- **Export CSV** of the current project list
- Projects update live — when someone creates or edits a project elsewhere, your view refreshes automatically

### Creating a project (HR for their departments, Super Admin for anyone)
Click **Create Project** and fill in:

1. **Name** and **description**
2. **Priority** (Low / Medium / High / Urgent)
3. **Department** (HR can only pick their own departments)
4. **Deadline** (optional)
5. **Team members** — pick from the people list; every member gets a notification and gains access
6. **QA form** (optional) — attach a quality checklist that tasks in this project can use (see [16. QA Forms](#16-qa-forms-quality-checklists))
7. **Phases** (optional) — build the project's phases right here (name + dates each), e.g. "Discovery → Design → Build → Launch"
8. **Cover image** (optional) — a picture shown on the project card and header

Two things happen automatically on creation: a **project chat channel** is created for the team, and the project appears for all members.

> **Employee tasks on a project:** the creator can enable **"Allow employee tasks"** — when on, regular employees can add their own tasks to this project; when off, only managers assign work there.

### Project lifecycle — from active to completed
A project moves through a simple, controlled pipeline:

1. **Active** — work happens; tasks progress through their own workflow.
2. **Submit for review** — when all tasks are done, the project manager (or creator) presses **Submit for Review**. If the project has a QA form attached, the required answers must be filled in first. The project becomes **In Review** and lands on the Super Admin's desk.
3. **Review decision** — a manager (not the person who submitted) either:
   - **Approves** → the project is marked **Completed** (with the completion date stamped), or
   - **Sends back for rework (Redo)** → it returns to **Active** with the feedback.

Every step writes to the project's history/activity feed, and dashboards update.

### Editing and deleting
- **Edit** (managers): update name, description, and details. Member changes re-sync the project chat channel automatically.
- **Delete** (managers): with confirmation. Deleting a project also archives its tasks (soft-deleted), removes its phases, QA submissions, and its chat channel. Prefer **completing** projects over deleting them — deletion is meant for mistakes.

---

## 12. Project Detail — Phases, Team, and Activity

Click any project card to open its detail page.

### The header
Cover image (with a blurred backdrop), status badge (Active / In Review / Completed), priority, deadline, department, completion date, and the submission note if it's in review. Managers get a settings menu: **Edit** and **Delete**.

### Project Journey (phases)
The heart of the page: your phases as a timeline of cards — e.g. *Discovery (done) → Design (active) → Build (pending)*. Each phase card shows its tasks and progress.

- **Add tasks directly into a phase** from the card
- **Complete a phase** — marks it done and **automatically activates the next pending phase**, so the project always knows where it is
- **Reopen a phase** if more work appears
- **Manage phases** (managers): add, rename, re-date, reorder, or remove phases via the phase manager dialog
- Tasks don't strictly need to be done to complete a phase — that's the manager's judgment call

### Summary bar
Live roll-up for the whole project: total tasks, done, in progress, in review, and logged hours.

### Team sidebar
Everyone on the project with their avatar and role. (Adding members happens through Edit Project.)

### Activity feed
A live, virtualized (very fast even with hundreds of entries) feed of everything that happened: task created/assigned/submitted/approved, member changes, status changes — with who and when.

### Deep links
Every task has a shareable link (the page supports `?highlight=taskId` which scrolls to and rings the task row). Opening a task opens the full task detail window over the project page.

---

## 13. Tasks — Board, List, Timeline, and the QA Tab

Open **Projects & Tasks → My Tasks & Board** (the tab label adapts to your role — employees see it as their personal task area).

### The four views

**Board (Kanban)** — columns **To Do / In Progress / Review / Done**. Drag cards between columns.

- Moving to **In Progress** or **To Do**: always allowed (for your tasks)
- Moving to **Review** or **Done**: blocked with a helpful message — these statuses must go through the **submission/approval workflow** (see next chapter). For tasks **without** QA forms, managers can drag straight to Done.
- Cards show title, project, priority, due date, assignees, and progress
- Live updates when others change tasks

**List** — a data table with sorting, a search, status/assignee/scope/due-date filters, and **presets** (My Active, High Priority, Overdue, Custom). Select rows for **bulk actions**: *Mark Done* (managers) and *Bulk Delete* (with confirmation). Twenty rows per page. Any row opens the task detail window; a row can be highlighted via link.

**Timeline (Gantt)** — managers only. A calendar bar-chart of tasks; **drag a bar to set its dates** visually. Great for spotting schedule clashes. (Shows up to 100 tasks at a time.)

**QA** — the QA form builder (see [16. QA Forms](#16-qa-forms-quality-checklists)).

### Filters that work everywhere
- **Status, priority, assignee** (including a "My Tasks" shortcut for employees), **scope** (Global / Department / Role), **due-date range**
- **Group by** status / priority / assignee
- **Overdue** filter — everything past its due date
- **Export CSV** of the current view

### Creating a task
Click **New Task** (or press **Ctrl+N** on this page). Fill in:

1. **Title** and description
2. **Due date** and **priority**
3. **Project** — employees only see projects where *Allow employee tasks* is enabled (others appear greyed with an explanation), or pick **no project** for a personal task
4. **Assignees** — managers pick anyone (HR within their departments); employees automatically become the assignee of their own task
5. **Advanced options:**
   - **Scope** — Global (everyone), Department, or Role-based targeting
   - **QA form** — attach a quality checklist this task must pass
   - **Blocked by** — pick other tasks that must finish first; the task won't be startable until they're done, and the system prevents circular blocking
   - **Recurrence** — Daily / Weekly (pick weekdays) / Monthly (pick day-of-month); when a recurring task is completed, the **next occurrence is created automatically**
6. Save. Assignees are notified instantly; a global-scope task also posts to the company chat.

Drafts are auto-saved — close the dialog mid-work and your entries are still there next time.

### Task statuses
`To Do → In Progress → Review → Done`, with two special behaviors:

- A **blocked** task (unfinished blockers) can't move to In Progress, Review, or Done — the system explains which blocker is in the way
- Tasks with a **QA form** can never skip review — they must be submitted and checked

---

## 14. The Task Detail Window

Click any task (from any list, board, project page, or a direct link) to open its detail window — a side sheet with four tabs:

**Overview** — everything about the task: description, status, priority, dates, project, phase, assignees, reporter, progress, QA answers, blocking relationships. The **pin** button keeps the task at your fingertips (pinned items show in the sidebar). Managers get **Edit mode**: change title, description, assignees, project, phase, dates, priority — assignee changes notify the people added/removed.

**Comments** — a threaded discussion on the task. Reply to any comment; delete your own. Everyone on the task can participate.

**Time Logs** — every block of time logged against this task (from the timer or manual entries), by whom and when — useful for "how long did this actually take?"

**Activity** — the task's audit trail: created, assigned, status changes, submissions, decisions — with timestamps.

---

## 15. Task Review Workflow — Submit, Approve, Redo

This is the quality loop for finished work. It applies to tasks with QA forms (mandatory) and any task where you want a manager check.

### For the person doing the work (Employee/HR)
1. Finish the work and set the task **In Progress**.
2. Click **Submit for Review** in the task window.
3. Write a **submission note** (what you did, anything the reviewer should know).
4. If the task has a **QA form**, fill in the answers — required questions must be answered, choice options must be valid, numbers must be in range.
5. Submit. The task flips to **Review**, your managers are notified, and (if it's a project task) a note is posted to the project channel.

### For the reviewer (HR/Super Admin)
Open the task (or the dashboard's pending-approvals widget):

- **Approve** — the task becomes **Done**, the assignee is notified, and if it's recurring the next occurrence is created automatically. For global tasks, a completion note goes to the company chat.
- **Redo (send back)** — you must give a **reason**; the task returns to **In Progress** with your feedback attached, and the assignee is notified.

Rules enforced by the system:

- You can't review **your own** submission
- A blocked task can't be approved into Done — its blockers must finish first
- Every decision is written to the task's activity trail

---

## 16. QA Forms (Quality Checklists)

QA forms are reusable quality templates — think "pre-delivery checklist" or "bug report template". Find them under **Projects & Tasks → QA tab** (HR and Super Admin).

### Building a form
Click **Create Form**. Give it a title and description, then add fields with the **drag-and-drop builder** (a live preview shows exactly what users will see). Field types include:

- Text, long text, number, email, phone, URL
- Multiple choice, checkboxes, dropdown
- Yes/No (boolean)
- Linear scale, rating, slider
- Date, time, date-time
- File upload, signature
- Section headings (to group fields)

Each field can be marked **required**, given **options** (for choice fields), ranges (for numbers/scales), and arranged in any order.

### Using forms
- Attach a form when creating a **project** or a **task** (managers)
- When someone submits that task for review, the form appears in the task window and must be filled in
- Reviewers see the answers right next to the submission

### Managing forms
Forms can be edited and deleted. **Deleting is blocked** while any task, project, or submission still references the form (the system tells you what's using it).

---

## 17. The Project Timer

The **timer widget** sits in the top header (visible to everyone who can track time).

1. Click it and **pick the task** you're about to work on.
2. Press **Start** — the timer runs; you can pause and resume.
3. When you stop, the elapsed time is **logged to that task** (visible in the task's Time Logs tab).
4. The task you're currently working on is shown to your managers in **Live Shifts** and on dashboards, so leads can see what the team is focused on without asking.

Your active task is remembered (for up to 12 hours) — even if you close the tab, the timer knows what you were last working on. The timer syncs across your open tabs and devices, just like the attendance clock. Time entries can also be added with a past date if you're logging work after the fact.

---

## 18. Communications — Chat, Announcements, Notifications

Open **Communications** — three tabs: **Chat**, **Announcements & Reminders**, and **Notifications** (with an unread badge).

### Chat

**Your conversation list** is sorted: pinned chats first, then unread, then most recent. Filter pills show **All / Direct / Groups / Channels**, and there's a search box.

- **Company chat (global)** — one channel with the whole company; everyone's in it automatically.
- **Direct messages (DMs)** — type at least 3 letters of a name in the search; matching people appear — click one to start (or reopen) a private chat. You can DM anyone active in the company.
- **Group chats** — created by HR/Super Admin: name it, pick members, go. Groups appear for everyone added.
- **Project channels** — created automatically for every project; membership follows the project team.

**In a conversation you can:**

- **Send messages** with an emoji picker
- **Attach files** — images or documents (JPG/PNG/WebP/PDF/Office/ZIP, up to 10 MB); images show as image previews
- **Reply** to a specific message (threaded quotes)
- **@mention people** — start typing `@` for autocomplete; mentioned people get a notification
- **See read receipts** — know when your message has been read (in direct chats)
- **Delete your own messages** (everyone's view updates)
- **Pin a chat** to keep it at the top (up to 100 pinned)
- **Pin messages** in **project channels** (managers) — key decisions stay visible
- **Clear chat** — hides the conversation's history from your view (a fresh start; doesn't delete anything for others)
- **Unread badges** per chat and a total; opening a chat marks it read automatically

Messages send optimistically (they appear instantly with a "sending" state), and conversations refresh automatically — plus a 15-second safety poll. On mobile, chats open fullscreen and the keyboard is handled so nothing jumps around.

### Announcements
The announcement board shows official announcements, pinned ones first.

- **Who posts:** Super Admin posts **company-wide** announcements (any priority) — HR posts **team announcements** for their teams. *Urgent* team announcements are visible company-wide.
- **Priority:** Normal / High / Urgent. High and Urgent announcements also push notifications to affected people.
- **Attachments:** posts can carry a file.
- **Interact:** react with an emoji (like, heart, party, laugh, sad — reactions toggle), or **Dismiss** an announcement to clear it from your board (only for you).
- **Manage:** creators and managers can edit or delete announcements.

### Personal Reminders
Your own private alarm clock: **Add reminder** for any future date & time with a label. When it's due you get a high-priority notification. Delete reminders any time. (Once fired, a reminder leaves the list.)

### Notifications
The **Notifications tab** (also the bell in the header) is your unified inbox for everything the system tells you: approvals waiting, decisions made, task assignments, chat mentions, attendance alerts, holiday reminders, export-ready notices, and system messages.

- Filter **All / Unread**, by **type**, and search
- **Mark read / unread** individually or **mark all read**
- Click through to the related screen
- High-priority notifications are flagged; the bell shows a separate count for them
- Notifications are kept for **30 days**, then cleaned automatically
- Choose how you're notified: per-type in-app/email channels are configurable by you (My Profile → Notification Preferences) and by admins globally

---

## 19. Directory — People, Employee Management, Departments, Designations

Open **Directory**. Four tabs (each visible per your permissions): **Corporate Directory**, **Employee Management**, **Departments**, **Designations**.

### Corporate Directory (everyone)
The company phone book:

- **Search** by name/email/username/employee ID, filter by **department** and **designation**
- Grid or list view, 24 people per page
- Each card: photo, name, designation, department, and quick actions — **Message** (opens a DM) and **View Profile** (opens Employee 360)
- **Privacy respected:** colleagues who set their profile to *Private* show "Contact hidden" instead of email/phone. Emergency contacts, alternate numbers, and blood groups are **never** shown in the directory.
- Only active employees appear.

### Employee Management (HR for their departments; Super Admin for everyone)
The full people-management table: photo, name, email, employee code, department + designation, role chips (Super Admin / HR badges highlighted), and status.

- **Filters:** role, status (Active / Inactive / Trashed), department; plus search
- **Add Employee** — the create form: name, email, username, phone, department (picking a department loads its **teams** for a second-level pick), designation, employee ID (leave blank to auto-generate `G4K00x`), work schedule, and **roles** (Employee / HR / Super Admin — only Super Admins can create HR or Admin accounts). A random password is generated: if the company's email is configured the credentials are emailed to the new user; otherwise the password is shown to you once to pass along securely, and the new user will be asked to change it at first login.
- **Row menu per person:**
  - **Edit** — update details, change roles, move department/team/designation/schedule (role changes sign the user out of all devices)
  - **Reset Password** — generates a temp password (emailed, or shown to you once); the user must change it at next login
  - **Activate / Deactivate** — deactivating blocks login and signs the user out everywhere; activating restores access
  - **Delete** — soft-delete with confirmation; the person disappears from lists but can be recovered
  - **Restore** — bring back a deleted account
- **Bulk actions:** select many rows to activate/deactivate in one go
- **Export CSV** of the employee list
- Guard rails: the system refuses to deactivate, delete, or demote the **last active Super Admin**, and deactivating someone signs out all their sessions.

### Departments (HR & Super Admin)
Cards per department: name, auto-generated code (`DEP001…`), description, member avatars (first few), team count, status.

- **Create / edit** departments
- **Teams** — each department can have sub-teams; create/rename/delete teams (deleting a team unassigns its members, it never deletes people)
- **Assign HR** — attach one or more HR managers to a department; *this is what defines each HR's scope everywhere in the system* (their attendance views, approvals, and employee management all follow their assigned departments)
- **Move employees** in/out of the department
- **Archive** a department — only allowed when it has **no members** (move or remove people first). Archived departments can be **restored**.
- **Export CSV** of departments

### Designations (HR & Super Admin)
Job titles list: create, rename, **activate/deactivate** (a deactivated title stops being offered on new assignments but keeps history), and delete — blocked while anyone holds the title (shows a holders preview first).

---

## 20. Employee 360 — One Person's Full Picture

From the Directory (or a chat header), click a person to open their **profile page**. What you see depends on who you are:

- **Yourself, or a manager with permission** — the full picture: banner + avatar, status, designation/department, and tabs:
  - **Profile** — personal info and (for managers) emergency contact
  - **Attendance** — that person's attendance history calendar
  - **Leave** — their leave requests, balances, and history
  - **Projects & Tasks** — everything they're on
  - **Activity** — their recent system actions with timestamps
- **A colleague without management rights** — the public profile card only (same privacy rules as the directory)

The **Send Message** button starts a DM from right there.

---

## 21. Reports & Analytics

Open **Organization → Reports & Analytics** (HR & Super Admin). Two tabs.

### HR & Admin Reports
Five report types, each with **date range** and **department filters**:

- **Attendance Summary** — per person: present/late/absent/leave days, total worked hours, overtime; rate summary cards on top (Present %, Late %, Absent %)
- **Leave Summary** — per person: total/approved/pending/rejected counts and breakdown by leave type
- **Projects** — project status roll-ups
- **Tasks** — task counts and statuses per person
- **Productivity** — completed vs. redone tasks, average time per task, and a **productivity score** (80% task completion + 20% time utilization — hours logged against a 160-hour month)

Extra powers here:

- **Saved views** — save your favorite filter combinations and re-apply them in one click
- **Export to Excel (.xlsx)** — exports run as background jobs (see below)

### General Data Exports
A **report builder** for raw data: pick a dataset (tasks / projects / users / productivity), search and filter, see a smart preview (25 rows) with formatted columns, then **export** the full set to Excel/CSV — again as a background job.

### How exports work (important!)
Exports don't block your screen. When you click Export:

1. A job is queued (you'll see "Export started").
2. The system builds the file on the server.
3. You get a **notification** when it's ready.
4. Download it from the **Export History** list (which shows each job's status, with a **Retry** button if anything failed).

Export files are automatically cleaned up after **30 days**. Reports respect your data scope: HR exports cover their departments; Super Admin exports cover the company.

---

## 22. Audit Logs (Super Admin)

Open **Account → Audit Logs**. Two tabs, both exportable to CSV:

**System Events** — the who/what/when of the system: logins, logouts, records created/updated/deleted, approvals, corrections, exports. Filter by action, person, and date range. Certain entries deep-link to the record they refer to (a user, a project, a department, a schedule).

**Login History** — every login attempt: identifier, person (if resolved), IP address, location, browser, success/failure, and a **suspicious** flag. Filter by identifier, status, IP, and date. Use this to investigate "who tried to log in as me".

The audit trail is **append-only** — even administrators can't edit history (the database itself blocks it).

---

## 23. System Settings (Super Admin)

Open **Account → System Settings**. Eleven tabs:

### Company
Company name, short name, **logo upload**, and **timezone** (all attendance day-boundaries follow this). The logo and name appear across the app, including the login screen.

### Work Schedules
Define shift patterns: name, start/end time, break minutes, grace period (how many minutes late is still "on time"), standard hours, and working days. One schedule is the **default** (applied to anyone without an explicit assignment); the seeded default is *Standard G4K Schedule* — 09:00–18:30, 45-minute break, 10-minute grace, Monday–Saturday. **Set Default** on any schedule; deleting the default or one that's assigned to people is blocked.

### Policies
Security & HR policy switches:

- **Password policy** — minimum length, require mixed case / numbers / symbols, expiry days (forces a change after N days), password history
- **Sessions** — access-token minutes (default 15), refresh-token days (default 7), max devices per user (oldest sessions get signed out beyond the limit)
- **Force password change** — make new/temporary passwords compulsory to change
- **Suspicious login control** — IP and location blacklists (with wildcard support); blocked attempts are logged and rejected
- Leave policy / attendance policy text fields

### Holidays
The holiday calendar manager: add holidays (name, date, **recurring** or one-time, description), edit, delete. Recurring holidays repeat every year automatically (a Feb 29 holiday maps to Feb 28 in common years). Changes reflect immediately in leave calculations and attendance.

### Mail (SMTP)
Outgoing email configuration — host, port, encryption, username, password, from-address/name. Use **Send Test Email** to verify. Email is used for password resets, new-user credentials, and email-channel notifications.

### Notifications
Channel defaults per notification category (leave requests, attendance reminders, weekly summary, tasks, chat, system/security) — in-app, email, or both. Users can further personalize their own choices in their profile.

### Auto-Numbering
ID formats for generated codes — company, department, and employee prefixes, the numbering format (`{PREFIX}{000}` style), and starting number. E.g. employees get `G4K001, G4K002…`, departments `DEP001…`.

### Reminders
Automated attendance nudge timing: shift-start reminder offset (default 15 min before), missed clock-in alert (default 30 min after start), open-shift flag time (default 20:00), and holiday heads-up days (default 10).

### Security Requests
Where **password reset requests** land when email isn't configured (see [4. If You Forget Your Password](#4-if-you-forget-your-password)). Approve (generates a one-time reset link you copy and hand to the person) or reject each request.

### Demo Data
A clearly-marked danger zone to **seed** (load a full demo dataset) or **purge** (remove demo data) the demonstration environment. Purging requires typing the exact confirmation phrase. ⚠️ Use with extreme care on production — see the warning box below.

> **⚠️ Warning:** The demo dataset includes demo user accounts and demo projects/attendance. Purging demo data removes everything tagged as demo **and all demo user accounts**. Only run this when you fully understand what was seeded — ideally on a staging environment only.

### System Jobs
Monitor background processing: the queue of pending jobs and the **failed jobs** list, with **Retry** (one or all). Exports, emails, and notifications flow through this queue.

---

## 24. My Profile

Open **Account → My Profile**. A left-side section navigator scrolls you through:

- **General** — your photo (upload/update), name, phone, employee details; edit what's editable
- **Workspace & Roles** — your department/designation/team; if you hold **multiple roles**, the **role switcher** changes your active role instantly (no re-login)
- **Security & Devices** — change password (current + new; signs out other devices) and your **active sessions list**: every logged-in device with IP and last-used time, and **Revoke** buttons — plus the system notifies you when a session is revoked
- **Preferences & Support** — theme (Light/Dark/System), density (Comfortable/Compact), and the **Feedback form** — send thoughts/issues straight to your HR (it arrives as a chat message + high-priority notification, even naming the conversation)
- **Notification Preferences** — per-category in-app/email toggles for how *you* want to be notified
- **Privacy & other sections** — directory visibility (Public shows your email/phone in the directory; Private hides them) and informational sections

Your profile stats strip shows your last-31-days attendance, leave usage, and task counts at a glance.

---

## 25. Sessions, Security, and Password Changes

Things the system does to keep work safe (no action needed from you — just good to know):

- **Short-lived access tokens** refreshed silently in the background; a stolen token is only useful for minutes
- **Refresh-token rotation** — every refresh invalidates the previous token
- **Automatic sign-outs** when: your password changes anywhere, an admin deactivates/reset-passwords you, a session is revoked, or the device limit is exceeded
- **Cross-tab sync** — log out in one tab, all tabs log out; log in elsewhere, others follow
- **Login attempt limits** — 5 failures lock the account 10 minutes; attempts are logged with IP/location
- **Network blacklist** — admins can block specific IPs/locations from logging in at all
- **Audit trail** — important actions (logins, approvals, corrections, exports, user changes…) are recorded immutably
- **Security headers** — the app forces HTTPS, blocks framing, and applies a strict content policy

---

## 26. Working Offline

If your internet drops mid-work:

- An **Offline banner** appears; queued actions stack up safely on your device
- **Attendance punches work offline** — they're stored locally with their original timestamps and sync the moment you're back (duplicates are prevented)
- Other edits (a comment, a form save) are queued too and replayed on reconnect
- When the sync finishes you'll see an "offline sync complete" confirmation and your attendance/history/dashboards refresh themselves

---

## 27. Automatic System Behaviors You Should Know

These run on their own — you just enjoy the results:

| Automation | What happens |
|---|---|
| **Shift-start reminder** | ~15 min (configurable) before your shift starts, on working days, you get a heads-up notification |
| **Missed clock-in alert** | ~30 min after your shift start with no clock-in, HR and admins are alerted |
| **Open-shift (missing clock-out) flag** | After 20:00, anyone still "on shift" gets a "Missing Clock-Out" notification; HR/admins get the exception list |
| **Holiday reminders** | 10 days before each holiday, everyone is reminded |
| **Task reminders** | Reminders you set on tasks fire as notifications at the right time |
| **Personal reminders** | Your private reminders fire as high-priority notifications |
| **Weekly summary email** | Every Sunday 09:00, leadership gets an email digest (attendance + task metrics) |
| **Notification cleanup** | Notifications older than 30 days are removed automatically |
| **Export cleanup** | Export files older than 30 days are deleted |
| **Token pruning** | Expired login tokens are cleaned daily |
| **Password expiry** | If your company sets an expiry (e.g. 90 days), you'll be asked to change your password when it ages out |
| **Recurring tasks** | Completing a recurring task automatically creates the next occurrence and tells the managers |
| **Live updates** | Chat, dashboards, boards, and live shifts update in real time (with a polling fallback so nothing is ever silently stale) |
| **Version check** | When a new version of the app is deployed, you get a "refresh to update" toast instead of odd behavior |

---

## 28. Role Capability Reference

A quick "who can do what" cheat-sheet (S = Super Admin, H = HR, E = Employee):

| Capability | S | H | E |
|---|:-:|:-:|:-:|
| Clock own attendance / take breaks | ✅ | ✅ | ✅ |
| Request & cancel own leave | ✅ | ✅ | ✅ |
| Edit own profile / avatar / preferences | ✅ | ✅ | ✅ |
| Chat (company, DMs, project channels) | ✅ | ✅ | ✅ |
| Browse directory | ✅ | ✅ | ✅ |
| View projects (own/member) | ✅ | ✅ | ✅ |
| Work tasks, create own personal tasks | ✅ | ✅ | ✅ |
| Track time with the timer | ✅ | ✅ | ✅ |
| Personal reminders & quick notes & pins | ✅ | ✅ | ✅ |
| See team attendance (assigned departments) | ✅ (all) | ✅ | — |
| Correct attendance | ✅ (anyone) | ✅ (their teams) | — |
| Approve employee leave | ✅ (all) | ✅ (their teams) | — |
| Create/edit projects, phases | ✅ | ✅ (their depts) | — |
| Assign tasks to others | ✅ | ✅ (their depts) | — |
| Approve / redo task submissions | ✅ | ✅ | — |
| Review submitted projects | ✅ | ✅ (not own) | — |
| Create group chats | ✅ | ✅ | — |
| Post announcements | ✅ (company) | ✅ (teams) | — |
| Manage employees (create/edit/deactivate) | ✅ (all) | ✅ (their depts) | — |
| Manage departments & designations | ✅ | ✅ | — |
| View reports | ✅ (company) | ✅ (their depts) | — |
| Attendance/leave/task/user data exports | ✅ | ✅ (scoped) | — |
| QA form builder | ✅ | ✅ | — |
| Create HR / Super Admin accounts | ✅ | — | — |
| Settings (company, schedules, policies, mail, holidays, numbering, demo data, jobs) | ✅ | — | — |
| Audit logs & login history | ✅ | — | — |
| Approve HR leave / own projects | ✅ | — | — |

---

## 29. Troubleshooting & FAQ

**"Account locked due to multiple failed login attempts."**
You exceeded 5 failed attempts. Wait for the countdown (max 10 minutes) or ask an admin to unlock/deactivate-reactivate your account.

**I clocked in but the widget says nothing / my punches vanished.**
Check the offline banner — if you were offline, punches sync when connectivity returns. If a punch is genuinely missing, ask HR to add a correction (they'll need the time and a reason).

**I can't request leave for today.**
Correct — leave must start from tomorrow. For sudden sick leave, message HR directly; they can record it for you.

**My leave shows Pending for days.**
Your approver hasn't decided yet. HR-requested leave waits for the Super Admin. You'll be notified the moment it's decided. You can cancel it yourself while it's pending.

**I can't drag my task to Done/Review on the board.**
That's the workflow protecting quality — use **Submit for Review** in the task window. Tasks with QA forms always require submission; the reviewer moves them to Done.

**A task won't move — it says it's blocked.**
Another task it "is blocked by" isn't finished yet. Finish the blocker first; the system prevents circular blocking, so there's always a way through.

**Why can't I see a project/chat/person someone mentions?**
Access is role- and membership-based: projects appear for members; project channels follow the project team; the directory shows active employees only; HR tools only cover assigned departments.

**My "Offline" badge shows even though I have internet.**
That badge reflects the live push connection; the app falls back to periodic refresh (every 15–30 s) meanwhile, so data still updates. If it persists, a page refresh usually restores the live connection.

**An admin reset my password — now what?**
You'll receive a temp password (email, or handed to you directly). Log in with it; the system will ask you to set your own new password immediately. All old sessions are signed out.

**My export hasn't arrived.**
Exports are background jobs — large ones take a minute or two. Check the Export History (status + Retry). If it keeps failing, mention it to your admin (System Jobs tab shows failures).

**Notifications disappeared after a month.**
By design — notifications are kept 30 days to keep the system fast. Downloads/exports expire after 30 days too.

**How do I switch roles if I have two?**
My Profile → Workspace & Roles → pick the role. Takes effect instantly.

**How do I delete my account / someone's data fully?**
Accounts are soft-deleted (recoverable) to preserve history. For full erasure (e.g. offboarding), admins use the **Anonymize** capability via the API, which scrubs personal data while keeping records consistent. Contact your Super Admin.

---

*This manual reflects the Games4King system as implemented — every workflow above corresponds to a real feature in the deployed application. For technical and quality findings, see the companion document `report.md`.*
