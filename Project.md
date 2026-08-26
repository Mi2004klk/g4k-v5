# 🏢 GAMES4KINGS WORKPLACE OS — PRODUCTION DEPLOYMENT AUDIT CHECKLIST

> **Purpose:** This is a comprehensive, end-to-end production readiness audit checklist. Use this as a "copy-paste prompt" reference for AI/human auditors to systematically verify every requirement, workflow, logic, behavior, page, sync, and UX element is implemented correctly. Each item includes expected behavior, reasoning, and audit instructions.

---

## 📋 HOW TO USE THIS CHECKLIST

- ✅ = Verified working as expected
- ❌ = Broken / Missing / Not implemented
- ⚠️ = Partially implemented or has bugs
- 🔄 = Needs deeper verification
- 📝 = Note/observation field

**Audit Methodology:** For each area, read the expected behavior, open the relevant code/file/page, attempt the workflow end-to-end, verify both happy path and edge cases, then verify mobile/responsive/edge states.

---

# SECTION 1 — FOUNDATION & INFRASTRUCTURE

## 1.1 Monorepo & Project Structure
- [ ] pnpm monorepo properly configured (`pnpm-workspace.yaml`, `package.json`)
- [ ] `apps/web` (Next.js) and Laravel API properly scaffolded
- [ ] `packages/ui` shared component library
- [ ] `vercel.json` correctly configured for monorepo output path
- [ ] `cloudbuild.yaml` configured with correct DB port
- [ ] `.dockerignore`, `.gitignore`, `.vercelignore` properly maintained
- [ ] Dockerfile uses mlocati extension installer (bloat purged)
- [ ] CI/CD workflows in `.github/workflows` functional

## 1.2 Environment & Configuration
- [ ] All env variables documented and set in production (Supabase URL, anon key, service role, JWT secret, SMTP, Pusher keys)
- [ ] No secrets committed to git
- [ ] Production build passes without TS errors (`tsc --noEmit`)
- [ ] ESLint passes clean
- [ ] No `console.log`/`debugger` left in production build
- [ ] Source maps disabled or secured in production
- [ ] CSP headers configured

## 1.3 Database & Supabase
- [ ] All migrations applied to production DB
- [ ] RLS (Row Level Security) policies enabled on every table
- [ ] Foreign key constraints valid
- [ ] Indexes exist on hot columns (user_id, project_id, task_id, created_at, status)
- [ ] Triggers for `updated_at` columns fire correctly
- [ ] Storage buckets configured for: avatars, chat attachments, project covers, QA files
- [ ] Storage RLS policies restrict uploads to authorized users
- [ ] Database backup & PITR (point-in-time recovery) enabled

## 1.4 Real-time Connectivity (Pusher / Supabase Realtime)
- [ ] Pusher live connection established on app boot
- [ ] Realtime channels subscribe on auth, unsubscribe on logout
- [ ] Connection auto-reconnects on network drop
- [ ] No memory leaks on channel subscriptions during route changes
- [ ] Realtime events correctly scoped per user role/department

---

# SECTION 2 — AUTHENTICATION & ONBOARDING

## 2.1 Login Screen UI/UX
- [x] Login supports: email, employee ID (G4K-###), username
- [x] "Sign In" button shows loading animation on submit
- [x] Failed login shows clear, friendly error message
- [x] Form is responsive on all screen sizes perfectly
- [x] Keyboard accessible (Tab order, Enter to submit)
- [x] Autofill/autocomplete attributes set correctly
- [x] Remember Me: Persist the authenticated session securely so users remain logged in across app close, reopen, and subsequent launches without needing to sign in again.

## 2.2 Multi-Role Login (Dual-Role)
- [x] Role Selection screen appears when user has multiple roles
- [x] All assigned roles listed with descriptive labels
- [x] Selecting a role lands user on correct dashboard
- [x] In-Session Role Switching: Allow users with multiple assigned roles to switch roles directly from the Profile area without signing out or logging in again, with permissions, navigation, dashboard, and accessible features updating immediately to match the selected role.
- [x] Active role persists across refreshes within session
- [x] Role-scoped queries respect selected role (not just UI)

## 2.3 Account Lockout
- [x] After 5 failed login attempts → account locked 10 minutes
- [x] Live countdown timer shown during lockout
- [x] Auto-unlock after 10 minutes (no admin intervention needed)
- [x] Failed attempts counter resets after successful login
- [x] Failed login attempts logged (audit trail)
- [x] Rate limiting on auth endpoint (server-side enforcement)

## 2.4 First-Login Forced Password Change
- [x] Forced password change screen blocks all other access
- [x] Password-change enforcement configurable by Admin, we can change optional or mandatory through Admin Settings.
- [x] Password validation uses company-configured rules (length, complexity)
- [x] Real-time password strength feedback
- [x] After change, user redirected to onboarding or dashboard

## 2.5 First-Login Onboarding 
- [x] Skippable Password-change Screen
- [x] Welcoming content Screen
- [x] Onboarding completion flag stored in DB

## 2.6 Forgot Password — Email Configured
- [x] "Forgot Password" link on login page
- [x] Accepts email, employee ID, or username
- [x] Reset link is emailed with 60-minute validity when SMTP is configured in Admin Settings; otherwise, Admin/HR receives notifications for manual change requests from employee and handle password changes from Employee Management Area.
- [x] Link opens reset form, redirects to login after success
- [x] Used links invalidated (cannot be reused)
- [x] Rate limiting on reset requests

## 2.7 Forgot Password — Email Not Configured
- [x] In-app reset request submission works
- [x] Request appears under Settings → Security Requests (Admin)
- [x] Admin approve → generates one-time secure link
- [x] Admin reject → request closed
- [x] Link shared manually with employee
- [x] Link expires after single use or time window

## 2.8 Session Management
- [x] Sessions silently refresh every 15 minutes (no UX interruption)
- [x] Sessions valid up to 7 days with activity
- [x] Active sessions viewable: My Profile → Security & Devices
- [x] Sessions show device type, IP, last active
- [x] Remote session revoke works
- [x] Revoking current session logs user out immediately
- [x] Max active devices enforced (per company policy) from admin settings

## 2.9 Suspicious Login Detection (✅ Completed)
- [x] Unrecognized IP/location login flagged (desabled by default on admin settings area and every IP and Location is Good for now. admin can desable it and add recognized location & ip manually if this function has to work perfectly, admin can blacklist any spefific ip/location from this area even the option is desabled.)
- [x] All HR + Admin users notified immediately
- [x] Email alert sent (if SMTP configured)
- [x] Logged in audit trail with IP, user-agent, geo

---

# SECTION 3 — ROLE-BASED ACCESS CONTROL (RBAC)

## 3.1 Permissions Matrix Enforcement (Server-Side)
> **Reasoning:** Client-side visibility is UX; server-side enforcement is security. Both must be verified independently.

### Employee Permissions (✅ Verified)
- [x] Can clock in/out
- [x] Can view own attendance history only
- [x] Cannot view team attendance
- [x] Cannot correct attendance entries
- [x] Cannot export attendance
- [x] Can submit leave requests
- [x] Cannot approve any leave
- [x] Can view own leave history only
- [x] Cannot create employee/HR/admin accounts
- [x] Cannot manage departments or designations
- [x] Can view own assigned projects only
- [x] Cannot create/assign projects
- [x] Can create own personal tasks
- [x] Cannot assign tasks to others
- [x] Cannot build QA forms
- [x] Can chat, DM, mention, share files
- [x] Cannot post announcements
- [x] Cannot create group chats
- [x] Cannot pin messages

### HR Permissions (✅ Verified)
- [x] Can clock in/out
- [x] Can view attendance for own departments ONLY (scoping enforced server-side)
- [x] Cannot see employees outside assigned departments
- [x] Can correct attendance for own departments
- [x] Can export scoped attendance
- [x] Can approve employee leave (own departments)
- [x] Cannot approve HR leave (goes to Admin)
- [x] Can create employee accounts
- [x] Cannot create HR/Admin accounts
- [x] Can edit employee profiles (scoped)
- [x] Can deactivate/delete accounts (scoped)
- [x] Cannot manage departments
- [x] Cannot manage designations
- [x] Can create/manage projects (scoped)
- [x] Can create/assign tasks
- [x] Can approve tasks/projects
- [x] Can build QA forms
- [x] Can post team-level announcements (scoped)
- [x] Can create custom group chats
- [x] Can pin messages in project chats
- [x] Limited reports (scoped to departments)

### Admin Permissions
- [x] Does NOT clock in/out, project timer, personal task area (UI hidden + server rejection)
- [x] Can view own attendance history (if applicable)
- [x] Full visibility: all departments, all employees
- [x] Approves HR leave requests
- [x] Creates HR + Admin + Employee accounts
- [x] Manages departments, designations
- [x] Full reports & exports
- [x] System settings access
- [x] Audit log access
- [x] Manages holidays and work schedules

## 3.2 Critical Scoping Rules
- [x] HR has zero visibility into non-assigned departments (queries scoped by join on `department_hr_assignments`)
- [x] Employees see only explicitly assigned projects/tasks
- [x] Nobody can approve own request (DB constraint + app logic)
- [x] HR leave → Admin approval routing (not another HR)
- [x] Employees only see group chats they're members of

## 3.3 Self-Approval Prevention
- [x] DB-level check prevents self-approval of leave
- [x] DB-level check prevents self-approval of tasks 
- [x] DB-level check prevents self-approval of projects
- [x] UI hides approve button for own submissions

---

# SECTION 4 — DASHBOARDS

## 4.1 Universal Dashboard Behaviors
- [x] Each widget loads independently (failed widget doesn't block others)
- [x] Each widget clickable → opens detail view
- [x] Drag-to-rearrange widgets
- [x] Layout persists per user across devices (save option on customize dashboard dropdown)
- [x] Dismissed widgets restorable: My Profile → Preferences & customize dashboard dropdown
- [x] Loading skeletons (not blank states)
- [x] Empty states with helpful CTAs
- [x] Error states with retry option

## 4.2 Employee Dashboard
- [x] Announcements widget (dismissible ✕)
- [x] Active Projects widget (shows assigned projects)
- [x] Pending Tasks widget (assigned, not complete)
- [x] Task Approval Status widget (Pending/Approved/Redo)
- [x] Recent Task Progress widget (visual progress bar)
- [x] Upcoming Holidays widget
- [x] Quick Notes widget (private notepad, persisted)
- [x] Time Clock widget (clock in/out from dashboard)

## 4.3 HR Dashboard
- [x] Team Attendance Today widget (present/absent/late/on-leave counts)
- [x] Pending Approvals widget (leave + task submissions)
- [x] Team Activity widget (late arrivals, unclosed shifts)
- [x] Quick Task widget
- [x] Announcements widget
- [x] Upcoming Holidays widget
- [x] Personal Time Clock widget

## 4.4 Admin Dashboard
- [x] Total Employees widget (active/inactive + dept breakdown)
- [x] Active Projects widget (company-wide count)
- [x] Today's Attendance widget (present/absent/late)
- [x] Pending Approvals widget (leave + task + project)
- [x] Recent Activity widget (audit feed)
- [x] Quick Task widget

## 4.5 Quick Task Widget
- [x] Search/select employee
- [x] Title, description, priority, due date inputs
- [x] Create → task appears in employee's list
- [x] Employee receives instant notification
- [x] On employee completion → auto-post to Global Chat

---

# SECTION 5 — ATTENDANCE & TIME TRACKING

## 5.1 Clock State Machine
> **Reasoning:** Attendance accuracy is business-critical. State transitions must be unambiguous and idempotent.

- [x] State: Not Started → Clock In → Working (timer counting)
- [x] State: Working → Start Break → On Break (timer paused)
- [x] State: On Break → End Break → Working (timer resumes)
- [x] State: Working → Clock Out → Day Complete
- [x] State: On Break → Clock Out → Break auto-ends, then clock-out
- [x] State transitions enforced server-side (no client-only logic)
- [x] Invalid transitions rejected (e.g., End Break when not on break)

## 5.2 Smart Clock Behaviors
- [x] Clock out while on break → break ends first, then clock-out
- [x] App closed mid-shift → "Continue Shift" prompt on reopen
- [x] Offline punches saved locally + auto-sync on reconnect
- [x] Duplicate punch prevention (debounce + server idempotency)
- [x] Punches are immutable once saved (corrections create new audit records)

## 5.3 Live Timer Display
- [x] HH:MM:SS timer counts up continuously while working
- [x] "Late" badge if clock-in after scheduled start + grace
- [x] "Overtime" indicator (timer turns amber beyond scheduled hours)
- [x] Break history list (each break: start time + duration)
- [x] Timer continues when navigating away
- [x] Timer only stops on explicit Clock Out / End Session
- [x] Timer persists across page refresh (uses server state, not just client)

## 5.4 Late & Overtime Tracking
- [x] Late = clock-in > scheduled start + grace period
- [x] Late badge shown on calendar for that day
- [x] Overtime = hours beyond standard schedule
- [x] Overtime shown in distinct color on calendar
- [x] Timezone: company-configured (default Asia/Kolkata)
- [x] Timezone respected in all date/time calculations server-side

## 5.5 Attendance History Calendar
- [x] Color legend: 🟢 Present · 🟡 Late · 🔵 Overtime · 🟣 Leave · ⬜ Absent · 🏖️ Holiday
- [x] Click day → full punch timeline (clock-in, breaks, clock-out)
- [x] Device/location used per punch
- [x] Time logged per project/task for the day
- [x] Total hours + overtime
- [x] Projects worked + tasks completed
- [x] Calendar responsive on mobile (swipe between months)

## 5.6 Shift Reminders
- [x] Shift start alert: 15 min before (configurable) → employee
- [x] Missed clock-in alert: 30 min after start (configurable) → HR
- [x] Both times configurable in System Settings → Reminders
- [x] Reminders fire even if app closed (server-side cron/scheduler)

## 5.7 Attendance Corrections (HR/Admin)
- [x] Open team attendance console
- [x] Find employee + day
- [x] "Correct Attendance" action
- [x] Add/edit/remove punch events
- [x] Preview corrected totals before save
- [x] Reason field required (cannot save empty)
- [x] After save:
  - [x] Employee auto-notified
  - [x] Audit record: before + after values
  - [x] Correction attributed to corrector
- [x] Corrections immutable (cannot edit a correction; only new correction)

## 5.8 HR Team Attendance Console
### Today's Status Tab
- [x] Live table: every team member's status (working/break/absent/leave)
- [x] Clock-in/out times, break durations, hours worked
- [x] Click row → full day breakdown + history + trends
- [x] Table auto-updates via realtime (no manual refresh)
### Trends & Graphs Tab
- [x] Weekly/monthly attendance charts per employee
- [x] Year-view heatmap
- [x] HR-level team consistency graphs

## 5.9 Admin Company Attendance Console
- [x] Calendar Heatmap tab (per-day attendance rate, click for detail)
- [x] Overview Table tab (filter by date range, dept, employee, status; exportable)
- [x] Analytics & Trends tab (KPI cards + weekly/monthly trends)

## 5.10 Weekly Summary Email
- [x] Auto-sent to Admins every Sunday 9:00 AM
- [x] Contains: attendance metrics, leave overview, task completions, project status
- [x] Fails gracefully if SMTP not configured

---

# SECTION 6 — LEAVE MANAGEMENT

## 6.1 Submit Leave Request
- [x] Path: Attendance & Time → My Leave → New Request
- [x] Leave Type: Casual / Sick / Earned / Unpaid
- [x] Start Date: tomorrow or later (no same-day/backdated)
- [x] End Date: on or after start date
- [x] Reason: required, max 1000 chars
- [x] Auto-save draft every 30 seconds
- [x] Draft restored on accidental page close
- [x] Pre-submission validation:
  - [x] Date overlap with existing requests detected
  - [x] Leave balance check (sufficient remaining)

## 6.2 Leave Balances
- [x] Casual: 12/yr default (configurable)
- [x] Sick: 12/yr default
- [x] Earned: 12/yr default
- [x] Unpaid: 12/yr default
- [x] Balance updates immediately on approval
- [x] Balance visible to employee (My Leave)
- [x] Balance visible to approver during review

## 6.3 Routing
- [x] Employee leave → assigned HR
- [x] HR leave → Admin
- [x] Approver gets instant in-app notification
- [x] Self-approval impossible

## 6.4 Approval Process
- [x] Path: Attendance & Time → Team Leave Approvals
- [x] Pending list: HR scoped, Admin all
- [x] Search by employee name
- [x] Filter by status
- [x] Approve → status = Approved, attendance auto-updated
- [x] Reject → requires written reason (cannot reject without)
- [x] On approval:
  - [x] All leave days marked "On Leave" in attendance
  - [x] Balance deducted
  - [x] Employee notified (with reason if rejected)
- [x] On rejection: employee notified with reason

## 6.5 Leave History
- [x] All historical requests with dates, type, reason
- [x] Status: Pending / Approved / Rejected
- [x] Decision-maker name + date
- [x] Rejection reason shown

## 6.6 Cancel Leave Request
- [x] Employee can cancel own PENDING request
- [x] Cannot cancel already-approved request
- [x] Cancellation restores no balance (only approval deducts)

## 6.7 Public Holidays
- [x] Holidays sub-tab shows company holidays
- [x] Recurring holidays repeat yearly
- [x] Feb 29 in non-leap year → auto-shift to Feb 28
- [x] 10-day pre-holiday reminder sent to HR + employees

---

# SECTION 7 — PROJECTS & TASKS

## 7.1 Project Visibility by Role
- [x] Employee: only projects they're members of
- [x] HR: projects they created + dept projects + projects their employees are on
- [x] Admin: all projects company-wide, properly grouped by department
- [x] Server-side scoping (not just UI hiding)

## 7.2 Project Card Display
- [x] Name, description, priority
- [x] Deadline, status
- [x] Progress % (auto-calculated from task completions)
- [x] current phase and current assignee (active)
- [x] Team member avatars (profile photo loads if available)
- [x] Cover image (if uploaded)
- [x] Click → project detail page

## 7.3 Create Project (HR/Admin)
- [x] "New Project" button visible only to HR/Admin
- [x] Form fields: Name, Description, Priority (Low/Med/High/Urgent), Department, Team Members (multi-select), Start Date, End Date, Cover Image, QA Form ( create new qa form, add from preset - optional), Allow Employee Tasks toggle, phase by phase task grouping, assign employee for each phase, all customization options (not a single form, one by one form that goes next and next for easy navigation/workflow), qa allocation for each phase, notification, approval and all workflow for each phase, project and overall workflow
- [x] End Date >= Start Date validation
- [x] On create:
  - [x] Dedicated group chat auto-created for members
  - [x] All members notified
  - [x] Members immediately gain access to project tasks + chat

## 7.4 Project Sorting
- [x] Sort by Created Date (asc/desc)
- [x] Sort by Deadline (asc/desc)
- [x] Sort by Priority (asc/desc)
- [x] Sort persists across navigation

## 7.5 Project History Log
- [x] Team members who participated
- [x] Total tasks completed
- [x] Total time spent
- [x] Completion date + final approval status

## 7.6 Task Views (4 views)

### Kanban Board (Default)
- [x] Columns: To Do / In Progress / Review / Done
- [x] Cards draggable between columns
- [x] Drag updates status instantly (optimistic UI + server persist)
- [x] Right-click → quick-action menu
- [x] Card reorder within column (persisted)
- [x] Mobile: swipe between columns, long-press to drag

### List View
- [x] Sortable, searchable data table
- [x] Filter bar: status, priority, date range, assignee
- [x] Search within tasks
- [x] Bulk actions
- [x] Pagination: 20/50/100 per page

### Timeline (Gantt)
- [x] Horizontal bars per task (start → due)
- [x] Diamond markers for milestones
- [x] Dependency arrows
- [x] Project bars (start → deadline)
- [x] HR/Admin only
- [x] Pan/zoom usable
- [x] Responsive (collapses to vertical list on mobile if needed)

### QA Form Builder (HR/Admin)
- [x] Field types: Text, Long Text, Checkboxes, Yes/No, Multiple Choice, Slider, Date, File Upload
- [x] Fields reorderable
- [x] Required toggle per field
- [x] Preview before save
- [x] Save as template (reusable)

## 7.7 Task Detail Sheet (4 tabs)

### Overview Tab
- [x] Description, assignees, priority, due date
- [x] Progress slider (managers can set %)
- [x] Dependencies list
- [x] Recurrence settings
- [x] Scope: Global / Department / Role-Specific / Individual

### Comments Tab
- [x] Threaded discussion specific to task
- [x] Enter to send, Shift+Enter for newline
- [x] Comments separate from main chat
- [x] Real-time updates

### Time Tab
- [x] Log time (min 1 min per entry)
- [x] Time-log history
- [x] Rolls up into project/productivity reports

### Activity Tab
- [x] Chronological history (created, assigned, progress updates, submitted, approved)

## 7.8 Task Priority Levels
- [x] Low: Gray/Blue
- [x] Medium: Yellow
- [x] High: Orange
- [x] Urgent: Red
- [x] Color consistently applied across all views (Kanban, List, Timeline, Detail)

## 7.9 Task Scope
- [x] Global → all employees
- [x] Department → all in dept
- [x] Role-Specific → all with designation
- [x] Individual → named employees
- [x] Scope changes retroactively assign/unassign correctly

## 7.10 Task Dependencies
- [x] Tasks can be marked blocked by other tasks
- [x] Blocked tasks cannot submit for review until blockers complete
- [x] Blocked badge shown on affected tasks
- [x] Circular dependencies detected and rejected (A↔B)
- [x] Self-dependency rejected
- [x] Dependency arrows visible in Timeline view

## 7.11 Recurring Tasks
- [x] Options: Daily / Weekly (specific days) / Monthly (specific date)
- [x] Recurrence UI inside collapsible "Advanced" section
- [x] Next occurrence auto-created when current approved
- [x] HR notified each time recurring task approved
- [x] HR can disable recurrence (stops after current instance)
- [x] Recurrence only fires on approval (not on submission)

## 7.12 Personal Task List (My Tasks)
- [x] Private list per user, not tied to any project
- [x] HR/Admin can assign directly to employee's personal list
- [x] Employees create own personal to-dos
- [x] Same priority/due/reminder/comment features
- [x] Only owner + their HR/Admin can see

## 7.13 Personal Task Reminders
- [x] Employee sets reminder on own task
- [x] Notification sent at set time
- [x] Only visible to task owner
- [x] Reminders fire even if app closed (server-side)

## 7.14 Project Work Timer
- [x] Start / Pause / Resume / End Session actions
- [x] Total time per project tracked + visible in reports
- [x] Separate from shift clock (both can run simultaneously)
- [x] Timer continues when navigating away
- [x] Timer state persisted server-side

## 7.15 Submit Task for Review (Employee)
- [x] Open task detail → "Submit for Review"
- [x] Completion note required
- [x] All required QA fields must be filled
- [x] Submit → manager notified
- [x] Task moves to "Review" on Kanban
- [x] Dashboard "Task Approval Status" widget updates

## 7.16 Review & Decide (HR/Admin)
- [x] Notification received on submission
- [x] Open task → see completion note + QA answers
- [x] Approve → moves to Done, employee notified, optional msg to project chat, recurring next instance created
- [x] Request Redo → reason required, returns to In Progress, employee notified

## 7.17 Submit Project for Completion
- [x] "Submit for Completion" on project page
- [x] Completion report required
- [x] Project-level QA form filled (if attached)
- [x] Submit → HR + Admin notified
- [x] Status → "In Review"
- [x] Approve → marked Complete with timestamp, team notified
- [x] Request Redo → reason, returns to active

## 7.18 Employee Task Creation in Projects
- [x] Employees can create tasks only if "Allow Employee Tasks" enabled for that project
- [x] Per-project toggle, controlled by HR/Admin
- [x] Employees without toggle see "New Task" disabled with explanation

---

# SECTION 8 — COMMUNICATIONS

## 8.1 Chat Conversation Types
- [x] Global Chat (everyone, auto-created)
- [x] Project Chat (auto-created on project creation, members only)
- [x] Direct Message (anyone can initiate)
- [x] Custom Group Chat (HR/Admin only)
- [x] Employees see only: Global + their project chats + their DMs + groups they're members of

## 8.2 Send Messages
- [x] Enter to send
- [x] Shift+Enter for newline
- [x] @mention opens dropdown
- [x] Attachment button (max 10 MB/file)
- [x] Validation: empty messages not sent
- [x] Optimistic UI (message appears immediately, syncs in background)
- [x] Failed sends show retry state

## 8.3 @Mentions
- [x] Type @ → dropdown of conversation members
- [x] Select name → mention inserted
- [x] Mentioned user receives notification with message snippet
- [x] Mention highlighted in chat thread
- [x] Works in all chat types (global, project, DM, group)

## 8.4 File & Image Sharing
- [x] Files + images shareable in any chat
- [x] Max 10 MB/file enforced (client + server)
- [x] Images + PDFs show inline previews
- [x] Other files show download link
- [x] Popup explains supported formats + size limits on attach
- [x] Progress bar for uploads
- [x] Failed uploads retryable

## 8.5 Read Receipts (DMs Only)
- [x] ✓ = sent successfully
- [x] ✓✓ = read by recipient
- [x] Read receipts only in one-on-one DMs
- [x] No read receipts in group/project/global chats

## 8.6 Message Pinning (HR — Project Chats)
- [x] HR can pin messages in project group chats
- [x] Pinned messages appear in top bar for all members
- [x] Only HR can pin/unpin
- [x] Pinned bar shows message preview + author

## 8.7 Unread Conversations
- [x] Unread convos: colored left border + count badge
- [x] Auto-marked read on open
- [x] Unread badge on Chat icon in nav
- [x] Realtime: new messages update unread state without refresh

## 8.8 Pinned Conversations
- [x] Pin/unpin conversation to top
- [x] Pinned above unpinned
- [x] Max 100 pinned per user
- [x] Persists across devices

## 8.9 Task Completion Alerts in Chat
- [x] Employee completes project task → auto-alert in project chat
- [x] Quick Task dashboard widget completion → Global Chat auto-post

## 8.10 Announcements
- [x] Priorities: Normal / High / Urgent
- [x] Normal → feed only
- [x] High → feed + notification to relevant users
- [x] Urgent → feed + urgent notification to all affected
- [x] Admin: company-wide
- [x] HR: team-level (scoped)
- [x] Emoji reactions (no comments)
- [x] Dismiss from dashboard (✕) — dismissal remembered
- [x] Pinned announcements stay at top of feed
- [x] Appear on every user's dashboard

## 8.11 Notifications
### Bell Icon (Top Bar, every page)
- [x] Always visible
- [x] Count badge for high-priority unread
- [x] Click → preview recent, mark read, open Notification Center
- [x] Only high-priority + system-level (routine updates go to Chat → Notifications tab)

### Notification Center (Chat → Notifications Tab)
- [x] Complete history
- [x] Filter by type (leave, task, mention, announcement, etc.)
- [x] Mark individual or all as read
- [x] Search full history

### Notification Trigger Reference
- [x] Leave request submitted → assigned approver notified
- [x] Leave approved/rejected → employee notified
- [x] New task assigned → employee notified
- [x] Task submitted for review → reviewing manager notified
- [x] Task approved/redo → submitting employee notified
- [x] Project submitted for completion → HR + Admin notified
- [x] Project approved/redo → submitting employee notified
- [x] @mention → mentioned person notified (with snippet)
- [x] High/urgent announcement → all relevant users
- [x] Suspicious login → all HR + Admin notified
- [x] Export ready → requesting user notified
- [x] Personal reminder → owner at set time
- [x] Shift reminder (15 min before) → employee
- [x] Missed clock-in (30 min after) → HR
- [x] Session revoked → affected user notified
- [x] Feedback/complaint received → receiving HR/Admin
- [x] Holiday in 10 days → HR + employees

## 8.12 HR Notification Center (Chat Tab)
- [x] Leave requests pending decision
- [x] Task submissions needing review
- [x] Project submissions needing approval
- [x] Company announcements
- [x] Holiday reminders
- [x] Employee feedback + complaints

---

# SECTION 9 — DIRECTORY & PEOPLE MANAGEMENT

## 9.1 Corporate Directory
- [x] Search by name, department, designation
- [x] Filter by department, designation
- [x] Grid view + List view toggle
- [x] Employee card: photo, name, title, dept, contact (if public)
- [x] Click card → public profile
- [x] "Send Message" button → starts DM
- [x] Privacy: Public shows contact, Private shows name + role only

## 9.2 Create Employee Account (HR/Admin)
- [x] "Add Employee" button
- [x] Form: Full Name, Email (unique), Username, Phone, Employee ID (auto G4K-### if blank), Department, Team (auto-filtered by dept), Job Designation (multiple role), Work Schedule (shift), Role(s) (multi), profile photo, emergency contact.
- [x] Email uniqueness validated
- [x] Auto-generated secure temp password
- [x] Welcome email sent if SMTP configured, else HR sees temp password
- [x] Force password change on first login
- [x] Auto-onboarding triggered

## 9.3 Manage Existing Employees
- [x] Edit profile
- [x] Activate (restore access)
- [x] Deactivate (block login, preserve data)
- [x] Reset Password (new temp + force change)
- [x] Delete (soft-delete, recoverable, revoke sessions immediately)
- [x] Export (selected/filtered) to Excel

## 9.4 Department Management (Admin Only)
- [x] Create dept (name, description)
- [x] Auto-assigned code (DEP-001)
- [x] Edit name + description
- [x] Archive/delete (blocked if employees assigned)
- [x] View headcount + active/inactive status
- [x] Department Detail — 3 tabs:
  - [x] Employees (sync membership)
  - [x] HRs (assign HR managers — controls scoping everywhere)
  - [x] Teams (create/rename/delete sub-teams)
- [x] Cannot delete dept with assigned employees (enforced)

## 9.5 Designations
- [x] View all + count per title
- [x] Add new
- [x] Cannot delete title held by any employee
- [x] Used in employee create/edit forms

## 9.6 Full Employee Record (360° View) for all employee
- [x] Personal Info tab
- [x] Attendance tab (color-coded calendar)
- [x] Leave History tab
- [x] Projects & Tasks tab (all assignments + statuses)
- [x] Activity Log tab (logins, profile changes, actions)

---

# SECTION 10 — REPORTS & EXPORTS

## 10.1 Attendance Summary Report
- [x] Filter by date range + department
- [x] KPIs: present rate, late rate, absence rate
- [x] Per-department + per-employee summaries
- [x] Export to Excel

## 10.2 Leave Summary Report
- [x] Breakdown by leave type
- [x] Totals per employee + department
- [x] Filter by date range
- [x] Export

## 10.3 Saved Filter Views
- [x] Save filter combos as named views
- [x] One-click reapply
- [x] Per-user saved views

## 10.4 Custom Report Builder
- [x] Datasets: Tasks & Deliverables, Projects & Milestones, Employee Directory, Productivity
- [x] Productivity = 80% task completion + 20% time logged
- [x] Export any custom report

## 10.5 Admin-Only Reports
- [x] Attendance (date range, dept, individual)
- [x] Project Completion (who, when)
- [x] Task Statistics (completion rates, redo rates, time averages)
- [x] Productivity Summary (per employee)

## 10.6 Export Background Process
- [ ] Click Export → runs in background (no UI freeze)
- [ ] Bell notification on completion
- [ ] Reports → Export History to download
- [ ] All exports in .xlsx
- [ ] Failed exports show error + retry option
- [ ] Export file retention policy (auto-cleanup after N days)

---

# SECTION 11 — SYSTEM SETTINGS (Admin Only)

## 11.1 Company Profile
- [ ] Company Name, Short Name
- [ ] Timezone (default Asia/Kolkata) configurable
- [ ] Company Logo upload (used on login + throughout)

## 11.2 Work Schedules
- [ ] Create shift templates: Start, End, Break Duration, Grace Period, Working Days
- [ ] Multiple schedules allowed
- [ ] One default schedule designated (used for late detection + overtime platform-wide)

## 11.3 Policies (Security)
- [ ] Password min length
- [ ] Password complexity (uppercase, numbers, special chars)
- [ ] Access token duration (refresh interval)
- [ ] Max active devices
- [ ] Password expiry period
- [ ] All settings enforced server-side

## 11.4 Holidays
- [ ] Add/edit/remove holidays
- [ ] Recurring toggle
- [ ] Feb 29 → Feb 28 in non-leap years
- [ ] Appear in dashboard widget

## 11.5 Mail / SMTP
- [ ] SMTP config form
- [ ] Send Test Email button
- [ ] Saved credentials masked after save
- [ ] Triggers: welcome emails, password resets, weekly summary, suspicious login alerts

## 11.6 Notification Preferences
- [ ] Per-event-type control: email vs in-app
- [ ] Granular per event

## 11.7 Auto-Numbering
- [ ] Employee IDs format (prefix + starting number)
- [ ] Department codes format
- [ ] Preview before save
- [ ] No collision after demo data removal / account deletion

## 11.8 Reminders
- [ ] Shift start alert (minutes before) → employee
- [ ] Missed clock-in alert (minutes after start) → HR

## 11.9 Security Requests
- [ ] Pending reset requests listed
- [ ] Approve → one-time secure link generated
- [ ] Reject → request closed
- [ ] All actions logged in audit trail

## 11.10 Audit Log
- [ ] Immutable record (no update/delete API allowed)
- [ ] Captures: who, what, when, before/after, IP
- [ ] Filter by action type, user, date range
- [ ] Export for compliance
- [ ] Read-only enforced at DB level

## 11.11 Demo Data
- [ ] Populate with sample data
- [ ] Uses same underlying system (all features work)
- [ ] Remove Demo Data:
  - [ ] Typed confirmation required
  - [ ] Preview with exact counts
  - [ ] Deletes only demo data, preserves real
  - [ ] Logged in audit trail
  - [ ] Re-runnable for re-seeding
- [ ] After removal: clean production instance

## 11.12 System Jobs
- [ ] Pending + failed job counts
- [ ] Retry failed jobs individually
- [ ] Diagnose missing exports/reminders

---

# SECTION 12 — MY PROFILE

## 12.1 Profile Header
- [ ] Upload/drag-drop photo (max 2 MB)
- [ ] Name, role(s), attendance stats summary

## 12.2 General Info Tab
- [ ] Full name (self-edit)
- [ ] Phone (self-edit)
- [ ] Emergency contact (self-edit)
- [ ] Job designation (HR/Admin only — employees can't edit)
- [ ] Department (read-only)
- [ ] Company (read-only)

## 12.3 Security & Devices Tab
- [ ] Change password form (current + new)
- [ ] New password meets policy
- [ ] Validation feedback as user types
- [ ] Active sessions: device, IP, last active
- [ ] Revoke session (current = immediate logout)

## 12.4 Preferences & Support Tab
- [ ] Directory visibility (Public/Private)
- [ ] Theme (Light/Dark/System)
- [ ] Display density (Comfortable/Compact)
- [ ] Hidden widgets restore list
- [ ] Feedback & Complaint channel:
  - [ ] Category: Suggestion/Complaint
  - [ ] Subject + message
  - [ ] Submit → DM to managing HR/Admin
  - [ ] High-priority notification flag
  - [ ] Private (other employees can't see)

---

# SECTION 13 — MOBILE EXPERIENCE & PWA

## 13.1 PWA Installation
- [ ] Manifest.json valid (name, short_name, icons, theme, display: standalone)
- [ ] Service worker registers + caches app shell
- [ ] Installable from browser (Add to Home Screen)
- [ ] Splash screen configured
- [ ] App icons (192, 512, maskable)

## 13.2 Mobile Layout
- [ ] Bottom navigation bar (one-handed use)
- [ ] Touch targets ≥ 44×44px
- [ ] No horizontal scroll on any page
- [ ] Forms usable without zooming
- [ ] Keyboard doesn't cover inputs (viewport adjustments)
- [ ] Pull-to-refresh where appropriate

## 13.3 Mobile-Specific Behaviors
- [ ] Kanban: swipe between columns, long-press to drag
- [ ] Calendar: swipe between months/days
- [ ] Chat: swipe to reveal actions (pin, mute, archive)
- [ ] Modals become bottom sheets on mobile
- [ ] Tables become cards on mobile
- [ ] Filter bars collapse into expandable sheet

## 13.4 Offline Support
- [ ] Clock in/out works offline (queued locally)
- [ ] Auto-sync on reconnect (with conflict resolution)
- [ ] Read-only cached data for last-viewed pages
- [ ] Clear "offline mode" indicator
- [ ] Queued actions show pending state

## 13.5 Responsive Breakpoints
- [ ] 320px (small phones) — usable, no overflow
- [ ] 375px (iPhone SE/standard)
- [ ] 414px (large phones)
- [ ] 768px (tablets)
- [ ] 1024px (small desktops)
- [ ] 1440px+ (large desktops)
- [ ] No element overflows viewport
- [ ] Text scales appropriately
- [ ] Images lazy-loaded + responsive (srcset/sizes)

---

# SECTION 14 — UX PATTERNS & GLOBAL BEHAVIORS

## 14.1 Loading States
- [ ] Skeleton screens (not spinners everywhere)
- [ ] Inline loading for buttons (disable + spinner)
- [ ] Optimistic updates where safe (chat send, status change)
- [ ] Page transitions don't flash white

## 14.2 Error Handling
- [ ] Network errors show retry CTA
- [ ] 404 page friendly + back to dashboard
- [ ] 500 page doesn't expose stack traces
- [ ] Form validation inline + on submit
- [ ] Toast notifications for success/error
- [ ] Error boundary catches React crashes gracefully

## 14.3 Empty States
- [ ] Every list/table has empty state
- [ ] Empty states have helpful CTA (e.g., "Create your first task")
- [ ] Illustrations or icons (not just text)

## 14.4 Accessibility (a11y)
- [ ] All interactive elements keyboard reachable
- [ ] Visible focus states
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Form fields have associated labels
- [ ] Screen reader announces dynamic content
- [ ] Skip-to-main-content link
- [ ] prefers-reduced-motion respected

## 14.5 Dark Mode
- [ ] All components support dark theme
- [ ] No contrast issues
- [ ] Images/logos adapt
- [ ] System preference auto-detect
- [ ] Manual override persists

## 14.6 Internationalization Readiness
- [ ] No hardcoded strings (or note i18n not in scope)
- [ ] Date/time formats respect locale
- [ ] Number formats respect locale

---

# SECTION 15 — APPROVAL WORKFLOWS (END-TO-END)

## 15.1 Leave Approval Workflow
1. [ ] Employee submits → state: Pending
2. [ ] HR (or Admin for HR leave) receives notification
3. [ ] HR opens Team Leave Approvals
4. [ ] HR reviews balance + reason
5. [ ] Approve: state → Approved, attendance days marked "On Leave", balance deducted, employee notified
6. [ ] Reject: requires reason, state → Rejected, employee notified with reason
7. [ ] All transitions logged in audit trail

## 15.2 Task Approval Workflow
1. [ ] Employee works task (In Progress)
2. [ ] Employee submits for review (completion note + QA form required)
3. [ ] State → Review, manager notified
4. [ ] Manager opens task, reviews note + QA answers
5. [ ] Approve: state → Done, employee notified, optional project chat message, recurring next instance created if configured
6. [ ] Request Redo: reason required, state → In Progress, employee notified
7. [ ] All transitions in Activity tab + audit trail

## 15.3 Project Approval Workflow
1. [ ] All tasks in project complete
2. [ ] Employee submits project for completion (report + project QA required)
3. [ ] State → In Review, HR + Admin notified
4. [ ] Manager reviews
5. [ ] Approve: state → Complete with timestamp, team notified
6. [ ] Request Redo: reason, state → active
7. [ ] All transitions in audit trail

## 15.4 Attendance Correction Workflow
1. [ ] HR/Admin opens team attendance console
2. [ ] Selects employee + day
3. [ ] "Correct Attendance"
4. [ ] Add/edit/remove punch events
5. [ ] Preview corrected totals
6. [ ] Enter reason (required)
7. [ ] Save → employee notified, audit record (before/after), attributed to corrector

## 15.5 Account Creation Workflow
1. [ ] HR/Admin clicks Add Employee
2. [ ] Fills form
3. [ ] Submit → temp password generated, welcome email (or shown to HR)
4. [ ] Employee first login → forced password change
5. [ ] Onboarding 3-step walkthrough
6. [ ] Role selection (if multi-role)
7. [ ] Dashboard

## 15.6 Password Reset Workflow (No Email)
1. [ ] Employee requests reset in-app
2. [ ] Request appears in Settings → Security Requests
3. [ ] Admin approves → one-time secure link generated
4. [ ] Admin shares link manually
5. [ ] Employee opens link → sets new password
6. [ ] Link invalidated after use

---

# SECTION 16 — REAL-TIME SYNC & CONNECTIVITY

## 16.1 Realtime Channels
- [ ] User-specific channel (notifications, sessions)
- [ ] Chat channel per conversation
- [ ] Project channel (task updates, member changes)
- [ ] Attendance channel (team status updates)
- [ ] Department channel (HR scoping)

## 16.2 Sync Behaviors
- [ ] Multi-device: action on one device reflects on others within 2s
- [ ] No duplicate messages on slow networks (client dedup by message ID)
- [ ] No duplicate punches (server idempotency)
- [ ] Conflict resolution: last-write-wins for non-critical, server-authoritative for attendance
- [ ] Offline queue replays in order on reconnect
- [ ] Queue persistence (survives app close)

## 16.3 Connection Health
- [ ] Connection status indicator (online/offline/reconnecting)
- [ ] Auto-reconnect with exponential backoff
- [ ] No memory leaks on reconnect cycles
- [ ] Subscriptions cleaned up on logout

---

# SECTION 17 — FRONTEND ISSUES & PERFORMANCE

## 17.1 Performance
- [ ] Initial page load < 3s on 4G
- [ ] Time to interactive < 5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] Bundle size reasonable (code-splitting per route)
- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback where needed)
- [ ] Virtualized lists for >100 items (chat messages, task lists)
- [ ] Image optimization (next/image or equivalent)
- [ ] Lazy-loaded routes + components

## 17.2 Frontend Code Quality
- [ ] No `any` types in TS (or escape hatches documented)
- [ ] No unused imports/variables
- [ ] Consistent naming conventions
- [ ] Component composition (not deeply nested props)
- [ ] State management clear (no prop drilling > 3 levels)
- [ ] Error boundaries per major route

## 17.3 Frontend-Specific Audit Items
- [ ] All forms prevent default on submit
- [ ] All buttons have type="button" (except submit)
- [ ] All inputs controlled
- [ ] All async actions show loading state
- [ ] All mutations invalidate/refetch relevant queries
- [ ] No stale closures in useEffect
- [ ] No memory leaks (cleanup in useEffect returns)
- [ ] Toast notifications auto-dismiss
- [ ] Confirmation dialogs on destructive actions (delete, deactivate)

---

# SECTION 18 — DATA INTEGRITY & EDGE CASES

## 18.1 Data Validation
- [ ] All inputs validated client + server
- [ ] SQL injection prevented (parameterized queries / ORM)
- [ ] XSS prevented (no dangerouslySetInnerHTML without sanitization)
- [ ] CSRF protection on state-changing endpoints
- [ ] File upload validation (type, size, content)
- [ ] Date validation (no negative ranges, no backdated leave)
- [ ] Email uniqueness
- [ ] Employee ID uniqueness

## 18.2 Edge Cases
- [ ] User with no assigned projects (empty state)
- [ ] User with no tasks (empty state)
- [ ] User with no leave balance (blocked from submit)
- [ ] Department with no HR assigned
- [ ] Project with no team members
- [ ] Task with circular dependency (rejected)
- [ ] Concurrent task status updates (last-write-wins or optimistic conflict resolution)
- [ ] Concurrent leave approval (only one approver wins)
- [ ] Timezone crossing (employee in different TZ than company)
- [ ] Daylight saving transitions
- [ ] Leap year Feb 29 holidays
- [ ] Employee deleted mid-task (task reassigned or archived)
- [ ] HR removed from department (their scoped queries update)
- [ ] Network drop mid-punch (offline queue)
- [ ] Token refresh mid-action (retry without data loss)

---

# SECTION 19 — SECURITY AUDIT

## 19.1 Authentication Security
- [ ] JWT tokens short-lived
- [ ] Refresh token rotation
- [ ] Refresh token revocation on logout
- [ ] No tokens in localStorage (httpOnly cookies preferred) — or documented tradeoff
- [ ] Password hashing (bcrypt/argon2)
- [ ] Password never returned in any API response
- [ ] Temp passwords expire after first use + time window

## 19.2 Authorization Security
- [ ] RLS on every table
- [ ] API endpoints check permissions (not just UI)
- [ ] No IDOR (Insecure Direct Object Reference) — verify object ownership
- [ ] No mass assignment (whitelist fields in updates)
- [ ] File upload paths scoped to user

## 19.3 Data Protection
- [ ] PII encrypted at rest (where required)
- [ ] Audit log immutable
- [ ] Soft-delete preserves data
- [ ] GDPR-ready: export + delete user data
- [ ] Session data not logged

## 19.4 Network Security
- [ ] HTTPS enforced (HSTS)
- [ ] Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] CORS properly configured (no wildcard in prod)
- [ ] Rate limiting on auth + sensitive endpoints
- [ ] File upload scan (malware/extension check)

---

# SECTION 20 — PRODUCTION READINESS

## 20.1 Observability
- [ ] Error tracking (Sentry or equivalent)
- [ ] Performance monitoring
- [ ] Structured logging
- [ ] Health check endpoint
- [ ] Uptime monitoring
- [ ] Alerting on critical failures

## 20.2 Backup & Recovery
- [ ] Automated DB backups (daily + PITR)
- [ ] Storage backups
- [ ] Restore tested (not just configured)
- [ ] Disaster recovery runbook documented
- [ ] RTO/RPO defined

## 20.3 Scalability
- [ ] Database connection pooling
- [ ] Read replicas if needed
- [ ] CDN for static assets
- [ ] Image optimization pipeline
- [ ] Background job queue (exports, reminders, emails)
- [ ] Horizontal scalability (stateless API)

## 20.4 Deployment
- [ ] CI/CD pipeline tested end-to-end
- [ ] Rollback strategy
- [ ] Blue/green or canary deployments
- [ ] Environment parity (staging mirrors prod)
- [ ] Migration strategy (forward-only with rollback scripts)
- [ ] Smoke test after deploy
- [ ] Cold-start handling (retry loop on 504)

## 20.5 Documentation
- [ ] README up to date
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Runbook for common incidents
- [ ] User-facing help docs
- [ ] Admin guide

---

# SECTION 21 — CLIENT EXPECTATIONS ALIGNMENT

> **Purpose:** Verify each client-stated expectation is met. List anything misaligned.

## 21.1 Fully Met Expectations
- [ ] Three roles sign in to same login, land in tailored area
- [ ] Multi-role users choose role after sign-in
- [ ] Tasks flow HR → employees
- [ ] Real-time attendance tracking
- [ ] Approvals through defined chain
- [ ] All communication in-app
- [ ] Web + Mobile + PWA + Offline support
- [ ] Admin doesn't clock in/out (by design)
- [ ] HR scoped to assigned departments
- [ ] Nobody approves own request
- [ ] HR leave → Admin

## 21.2 Potentially Misaligned / Verify
- [ ] "Auto-refresh sessions every 15 minutes" — verify silent refresh works
- [ ] "7 days with activity" — verify sliding expiration
- [ ] "Quick Task → completion posts to Global Chat" — verify this specific behavior
- [ ] "Project chat auto-created on project creation" — verify trigger fires
- [ ] "Feb 29 → Feb 28 in non-leap years" — verify edge case logic
- [ ] "10-day pre-holiday reminder" — verify scheduling
- [ ] "Weekly summary Sunday 9 AM" — verify cron timezone
- [ ] "Auto-save draft every 30 seconds" for leave form — verify debounce
- [ ] "Drag widgets, layout persists across devices" — verify sync
- [ ] "Punches saved locally + auto-sync" — verify offline queue + replay
- [ ] "Duplicate punch prevention" — verify idempotency key
- [ ] "Continue Shift prompt on app reopen" — verify state detection
- [ ] "Employee task creation only if Allow Employee Tasks enabled" — verify per-project flag
- [ ] "Circular dependency detection" — verify algorithm
- [ ] "Recurrence fires only on approval" — verify trigger condition
- [ ] "Soft-delete recoverable" — verify recovery flow
- [ ] "Audit log immutable at DB level" — verify constraints
- [ ] "Demo data removal shows preview with counts" — verify UI
- [ ] "Max 100 pinned conversations" — verify limit
- [ ] "Max 10 MB per file" — verify both client + server
- [ ] "Max 2 MB profile photo" — verify
- [ ] "Password reset link 60 min validity" — verify expiry
- [ ] "5 failed attempts → 10 min lockout" — verify counter + timer
- [ ] "Read receipts only in DMs" — verify not in groups
- [ ] "Productivity = 80% task completion + 20% time logged" — verify formula
- [ ] "Background exports + bell notification" — verify job queue
- [ ] "Quick Task completion → Global Chat auto-post" — verify trigger
- [ ] "Department code DEP-001" — verify auto-numbering
- [ ] "Employee ID G4K-001" — verify auto-numbering
- [ ] "Cannot delete dept with employees" — verify guard
- [ ] "Cannot delete designation in use" — verify guard
- [ ] "Cannot reject leave without reason" — verify required field

---

# SECTION 22 — KNOWN BROKEN / NEEDS ATTENTION

> **Audit Instructions:** Walk through codebase end-to-end. For each file/component, verify expected behavior. Log any broken/missing implementation here with file path + line number + description.

## 22.1 Common Broken Patterns to Look For
- [ ] Components calling APIs without permission checks
- [ ] Mutations not invalidating React Query caches
- [ ] useEffect missing cleanup (memory leaks)
- [ ] useEffect missing deps (stale data)
- [ ] Hardcoded API URLs (should use env)
- [ ] Hardcoded user IDs/role checks (should use auth context)
- [ ] Inline styles instead of design tokens
- [ ] magic numbers without constants
- [ ] `any` types hiding bugs
- [ ] `// @ts-ignore` or `// eslint-disable` without justification
- [ ] Console.log left in production code
- [ ] TODO/FIXME/HACK comments indicating unfinished work
- [ ] Commented-out code blocks
- [ ] Dead code (unused exports, unreachable branches)
- [ ] Inconsistent error handling (some try/catch, some not)
- [ ] Missing loading states (blank screens)
- [ ] Missing empty states
- [ ] Missing error states
- [ ] Forms without validation
- [ ] Buttons without loading state
- [ ] Tables without pagination on large datasets
- [ ] Infinite scroll without virtualization
- [ ] Images without alt text
- [ ] Icon-only buttons without aria-label
- [ ] Modals without escape key + click-outside close
- [ ] Modals without focus trap
- [ ] Drag-drop without keyboard alternative
- [ ] Color-only state indication (no text/icon for colorblind)
- [ ] Time displayed without timezone context
- [ ] Dates displayed in raw ISO format
- [ ] Currency without locale formatting
- [ ] Phone numbers without formatting
- [ ] Long lists without skeleton loaders
- [ ] API errors shown as raw technical messages
- [ ] Success toasts that don't auto-dismiss
- [ ] Confirmation dialogs missing on destructive actions
- [ ] Optimistic UI without rollback on failure

## 22.2 File-by-File Audit
> For each file in `apps/web/src/`, verify:
- [ ] Component renders without crashing
- [ ] Component handles loading state
- [ ] Component handles empty state
- [ ] Component handles error state
- [ ] Component respects role permissions
- [ ] Component responsive on mobile
- [ ] Component has no console errors in DevTools
- [ ] Component has no network waterfalls
- [ ] Component cleans up subscriptions
- [ ] Component uses design tokens (not hardcoded colors)

---

# SECTION 23 — END-TO-END WORKFLOW VERIFICATION

> **Audit Instructions:** For each workflow, perform it end-to-end in a fresh test environment. Time each step. Note any friction, errors, or deviations from documented behavior.

## 23.1 New Employee Lifecycle
1. [ ] Admin creates employee account
2. [ ] Welcome email sent (or temp password shown)
3. [ ] Employee logs in first time
4. [ ] Forced password change
5. [ ] Onboarding 3 steps
6. [ ] Role selection (if multi-role)
7. [ ] Lands on dashboard
8. [ ] Can clock in/out
9. [ ] Can see assigned projects (if any)
10. [ ] Can chat in Global
11. [ ] Can submit leave request

## 23.2 Task Lifecycle
1. [ ] HR creates project
2. [ ] Project chat auto-created
3. [ ] Members notified
4. [ ] HR creates task in project
5. [ ] Assigned employee notified
6. [ ] Employee opens task
7. [ ] Employee updates progress
8. [ ] Employee submits for review (note + QA)
9. [ ] HR notified
10. [ ] HR approves
11. [ ] Employee notified
12. [ ] Task in Done
13. [ ] (If recurring) Next instance created
14. [ ] Project chat auto-alert posted

## 23.3 Leave Lifecycle
1. [ ] Employee opens My Leave → New Request
2. [ ] Fills form (auto-save every 30s)
3. [ ] Pre-submission validation (overlap + balance)
4. [ ] Submit → HR notified
5. [ ] HR opens Team Leave Approvals
6. [ ] HR sees employee's balance
7. [ ] HR approves/rejects
8. [ ] Employee notified
9. [ ] (If approved) attendance days marked, balance deducted
10. [ ] Calendar reflects leave (purple)

## 23.4 Attendance Lifecycle
1. [ ] Employee clocks in
2. [ ] Timer starts
3. [ ] Late badge if applicable
4. [ ] Start break → timer pauses
5. [ ] End break → timer resumes
6. [ ] Overtime indicator if applicable
7. [ ] Clock out → day complete
8. [ ] Calendar shows day green/amber/blue
9. [ ] HR sees update in team console (realtime)
10. [ ] Admin sees in company console

## 23.5 Approval Chain
1. [ ] Employee submits task
2. [ ] HR notified
3. [ ] HR approves → employee notified → chat alerted
4. [ ] HR submits project for completion
5. [ ] Admin notified
6. [ ] Admin approves → team notified
7. [ ] Project marked Complete

## 23.6 Communication Flow
1. [ ] Employee opens Global Chat
2. [ ] Sends message
3. [ ] Others see in realtime
4. [ ] @mention sends notification
5. [ ] File attachment uploads + previews
6. [ ] DM shows read receipts
7. [ ] HR pins project chat message
8. [ ] All members see pinned bar

## 23.7 Admin Weekly Operations
1. [ ] Sunday 9 AM: weekly summary email
2. [ ] Admin reviews pending approvals
3. [ ] Admin checks audit log
4. [ ] Admin exports attendance report
5. [ ] Bell notification when export ready
6. [ ] Download from Export History

---

# SECTION 24 — FINAL PRE-DEPLOYMENT SIGN-OFF

## 24.1 Functional Sign-off
- [ ] All Section 1–13 items ✅ or documented exceptions
- [ ] All Section 14 UX patterns verified
- [ ] All Section 15 approval workflows pass end-to-end
- [ ] All Section 16 sync behaviors verified
- [ ] All Section 17 performance budgets met
- [ ] All Section 18 edge cases handled
- [ ] All Section 19 security audit passed

## 24.2 Non-Functional Sign-off
- [ ] Performance budgets met (Lighthouse > 90)
- [ ] Accessibility WCAG AA passed
- [ ] Security scan clean (no high/critical vulns)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile tested (iOS Safari, Android Chrome)
- [ ] PWA install + offline tested on real device
- [ ] Load tested (target concurrent users)
- [ ] Backup + restore tested

## 24.3 Documentation Sign-off
- [ ] README accurate
- [ ] Deploy guide accurate
- [ ] Runbook complete
- [ ] User guide available
- [ ] Admin guide available

## 24.4 Go/No-Go Decision
- [ ] **GO**: All critical items ✅, no known critical bugs
- [ ] **NO-GO**: List blockers below

### Blockers (must fix before deploy)
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-blockers (can fix post-deploy)
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

# 🎯 AUDITOR INSTRUCTIONS — COPY/PASTE PROMPT

> **Use the following prompt verbatim to drive an end-to-end AI audit of the codebase against this checklist:**

---

I am performing a production-readiness audit of the Games4Kings Workplace OS codebase (a pnpm monorepo at `apps/web` for Next.js frontend + Laravel/Supabase backend). I will provide you a comprehensive audit checklist. Your job is to systematically walk every file, component, route, API endpoint, and workflow in the codebase and verify each checklist item. For each item, you must:

1. **Locate** the relevant file(s)/code that implements (or should implement) the behavior
2. **Read** the implementation carefully
3. **Verify** it matches the expected behavior described in the checklist
4. **Test** edge cases mentally (and by code inspection)
5. **Report** one of these verdicts per item:
   - ✅ PASS — implemented correctly, behaves as expected
   - ⚠️ PARTIAL — implemented but with bugs, gaps, or deviations (describe)
   - ❌ FAIL — broken, missing, or wrong (describe + file:line)
   - 🔄 UNVERIFIED — could not locate or verify (describe)

For each FAIL/PARTIAL, provide:
- File path + line numbers
- What's wrong
- What's expected
- Recommended fix
- Severity: Blocker / High / Medium / Low

Audit in this order (do not skip ahead):
1. Foundation & infrastructure (Section 1)
2. Auth & onboarding (Section 2)
3. RBAC enforcement — server-side first, then UI (Section 3)
4. Each dashboard role-by-role (Section 4)
5. Attendance state machine + sync (Section 5)
6. Leave workflow end-to-end (Section 6)
7. Projects & Tasks — all 4 views, task detail tabs, dependencies, recurrence (Section 7)
8. Communications — chat types, mentions, files, read receipts, pinning, announcements, notification triggers (Section 8)
9. Directory + people management (Section 9)
10. Reports + exports + background job process (Section 10)
11. System Settings — every section (Section 11)
12. My Profile (Section 12)
13. Mobile + PWA + responsive breakpoints (Section 13)
14. UX patterns + accessibility + dark mode (Section 14)
15. Approval workflows end-to-end (Section 15)
16. Realtime sync + offline + conflict resolution (Section 16)
17. Frontend performance + code quality (Section 17)
18. Data integrity + edge cases (Section 18)
19. Security audit (Section 19)
20. Production readiness (Section 20)
21. Client expectations alignment — verify each specific promise (Section 21)
22. File-by-file broken-implementation scan (Section 22)
23. End-to-end workflow walkthroughs (Section 23)
24. Final sign-off + blockers list (Section 24)

Output format per section:
```
## SECTION X — [NAME]
### Item: [checklist item]
- Verdict: ✅/⚠️/❌/🔄
- File: path:line
- Evidence: [code snippet or behavior description]
- Issue (if any): [description]
- Expected: [from checklist]
- Fix: [recommendation]
- Severity: Blocker/High/Medium/Low
```

At the end, produce:
1. Executive summary (overall readiness)
2. Blockers list (must fix before deploy)
3. Non-blockers list (post-deploy fixes)
4. Top 10 most critical findings
5. Recommended remediation order

Do NOT skip any item. Do NOT summarize prematurely. Treat this as a rigorous, file-level, line-level audit. If you cannot find code for an expected behavior, that itself is a FAIL (missing implementation).

Begin now with Section 1 and proceed sequentially.

---

**End of Audit Checklist.** Use this document as your single source of truth for production-readiness verification of Games4Kings Workplace OS.