## Purpose
Deliver the projects and tasks work surface: project lifecycle with team auto-access, rich task authoring (multi-assign, priority, due, scope, dependencies), Kanban and list boards with drag reorder and inline editing, Tiptap comments and an activity log, a per-project QA form builder and submission flow, a per-project work timer, recurring tasks, the end-to-end Quick Task Assignment loop with Global Chat auto-notify, task and project review/approval flows, a Gantt/Timeline view, project history, employee self-create and personal My Tasks lists, and animated progress with pinning and saved views.

## ADDED Requirements

### Requirement: Project create/edit/archive/delete
The system SHALL allow Admins and HR to create, edit, archive, and delete projects capturing name, description, priority, deadline, status, team, and an HR owner. (R7.1)

#### Scenario: create project
- **WHEN** an Admin or HR submits a valid new project
- **THEN** the project is created in the planning status and an audit row is written

#### Scenario: archive project
- **WHEN** an Admin or HR archives a project
- **THEN** the project is hidden from active lists but its tasks, members, and history are preserved

#### Scenario: delete project
- **WHEN** an Admin or HR deletes a project
- **THEN** the project and its tasks are removed and the action is audited

### Requirement: Team auto-access on project assignment
The system SHALL automatically grant project, task list, and project-chat access to every user assigned to a project's team, and SHALL revoke that access when the team changes. (R7.2)

#### Scenario: team members gain access
- **WHEN** a project is created or its team is set
- **THEN** each team member is granted project, task list, and project-chat access immediately

#### Scenario: team change revokes access
- **WHEN** a user is removed from a project's team
- **THEN** their access to that project, its task list, and its project chat is revoked

### Requirement: Project sort
The system SHALL let users sort the projects list by created date, deadline, or priority, ascending or descending. (R7.3)

#### Scenario: sort by deadline
- **WHEN** a user chooses to sort projects by deadline descending
- **THEN** projects are ordered with the latest deadline first and the order persists for that view

### Requirement: Task create with assign, priority, due date, and scope
The system SHALL allow tasks to be created with a title, description, assignees (an individual, a whole team, or company-wide), a priority of Low/Medium/High/Urgent, a due date with reminders, and a scope of Global/Department/Role. (R7.4)

#### Scenario: create task
- **WHEN** a permitted user creates a task with assignees, priority, due date, and scope
- **THEN** the task is created in the To Do status, assignees are recorded, and due-date reminders are scheduled

#### Scenario: assign to a team
- **WHEN** a task is assigned to a team
- **THEN** every member of that team sees the task in their task list

#### Scenario: company-wide scope
- **WHEN** a task is scoped company-wide
- **THEN** every employee can see the task regardless of department or team

### Requirement: Task dependencies
The system SHALL allow HR and Admin to define task dependencies so that a dependent task is blocked until its predecessor is done. (R7.5)

#### Scenario: dependent task is blocked
- **WHEN** task B is marked dependent on task A and task A is not done
- **THEN** task B cannot be started and is visually shown as blocked

#### Scenario: dependency clears
- **WHEN** task A is marked done
- **THEN** task B becomes startable and its blocked state is removed

### Requirement: Per-task comments and activity log
The system SHALL provide per-task comments authored with the Tiptap rich-text editor and a per-item activity log recording created, assigned, progress, submitted, and approved events. (R7.6)

#### Scenario: post comment
- **WHEN** a permitted user writes and submits a comment on a task
- **THEN** the comment is stored as rich text and shown in the task's comment thread

#### Scenario: activity recorded
- **WHEN** a task is created, assigned, progressed, submitted, or approved
- **THEN** an entry is appended to that task's activity log with the actor and timestamp

### Requirement: Kanban board, list view, drag reorder, and inline editing
The system SHALL render a Kanban board with To Do, In Progress, Under Review, and Done columns built on dnd-kit, a list view, drag-to-reorder tasks, and inline editing of task fields. (R7.7)

#### Scenario: move task across columns
- **WHEN** a user drags a task card from one Kanban column to another
- **THEN** the task's status updates to the target column and other connected clients see the move in realtime

#### Scenario: reorder within a column
- **WHEN** a user drags a task within its column to reorder
- **THEN** the new order is persisted and reflected for other viewers

#### Scenario: inline edit
- **WHEN** a user activates inline edit on a task field and commits the change
- **THEN** the field is updated in place without opening a separate form

### Requirement: QA form builder and submission note
The system SHALL let HR and Admin build a QA form attached to a project, and SHALL let an employee fill out that QA form with a submission note when submitting their work. (R7.8)

#### Scenario: build QA form
- **WHEN** an HR or Admin composes a QA form (fields, types, required flags) and attaches it to a project
- **THEN** the form schema is stored on the project and shown on its tasks' submission step

#### Scenario: employee submits QA
- **WHEN** an employee fills the attached QA form and adds a submission note
- **THEN** the QA responses and note are stored against the submission for review

### Requirement: Per-project work timer
The system SHALL provide a per-project work timer with start, pause, resume, and end actions, and SHALL log time spent per project per user. (R7.9)

#### Scenario: start and end timer
- **WHEN** an employee starts a timer on a project and later ends it
- **THEN** the elapsed time is logged against that project and user

#### Scenario: pause and resume
- **WHEN** an employee pauses and later resumes a project timer
- **THEN** only the active intervals contribute to the logged duration

### Requirement: Recurring tasks
The system SHALL support recurring tasks configured as daily, weekly-on-days, or monthly-on-date inside an advanced collapsed section, auto-recreate the next occurrence on completion, notify HR, and allow the recurrence to be toggled off. (R7.10)

#### Scenario: auto-recreate on completion
- **WHEN** a recurring task is marked done
- **THEN** the next occurrence is generated per its recurrence rule and HR is notified

#### Scenario: toggle off recurrence
- **WHEN** a user toggles off a task's recurrence
- **THEN** no further occurrences are generated for that task

### Requirement: Quick Task Assignment wired with Global Chat notify
The system SHALL wire the Quick Task Assignment widget end-to-end: from the dashboard the user picks an employee, the task appears in that employee's task list, and Global Chat is auto-notified when the task is completed. (R7.11)

#### Scenario: assign via quick widget
- **WHEN** a user assigns a task to an employee through the Quick Task Assignment widget
- **THEN** the task immediately appears in that employee's task list

#### Scenario: completion notifies Global Chat
- **WHEN** a Quick-Assigned task is marked complete
- **THEN** an automatic notification is posted into Global Chat

### Requirement: Task submit, review, approve, and redo
The system SHALL let an employee submit a task for review, let HR or Admin approve it or request a redo, and reflect the resulting status instantly. (R7.12)

#### Scenario: submit for review
- **WHEN** an employee submits a task
- **THEN** the task moves to Under Review and is surfaced to HR/Admin for review

#### Scenario: approve task
- **WHEN** an HR or Admin approves a submitted task
- **THEN** the task is marked done and the assignee is notified

#### Scenario: request redo
- **WHEN** an HR or Admin requests a redo with a reason
- **THEN** the task returns to In Progress with the reason visible to the assignee

### Requirement: Project submit, review, approve, and redo
The system SHALL let a team submit a project completion report for HR review, let HR approve or request a redo, and ensure an Admin sees all projects. (R7.13)

#### Scenario: submit project
- **WHEN** a project's owner submits a completion report
- **THEN** the project enters Under Review and is surfaced to HR

#### Scenario: admin sees all projects
- **WHEN** an Admin opens the projects list
- **THEN** every project across all teams is visible regardless of team membership

#### Scenario: approve or redo project
- **WHEN** HR approves or requests a redo on a submitted project
- **THEN** the project status updates to done or back to in progress accordingly

### Requirement: Gantt and Timeline view
The system SHALL provide a Gantt/Timeline view for HR and Admin showing horizontal bars for task durations and milestone diamonds, driven by task due dates and dependencies. (R7.14)

#### Scenario: render Gantt
- **WHEN** an HR or Admin opens the Gantt view for a project
- **THEN** tasks render as horizontal bars positioned by their date range and milestones render as diamonds

#### Scenario: dependency linkage
- **WHEN** tasks have dependencies
- **THEN** the Gantt view draws linkages between dependent tasks and their predecessors

### Requirement: Project history
The system SHALL record and display a project history covering its team, tasks done, time spent, completion date, and approval result. (R7.15)

#### Scenario: view project history
- **WHEN** a user with access opens a project's history
- **THEN** the team, completed tasks, total time spent, completion date, and approval result are listed

### Requirement: Employee self-create tasks and progress updates
The system SHALL allow an employee to create their own tasks inside a project when permitted by HR, and to update the progress of tasks assigned to them. (R7.16)

#### Scenario: self-create when permitted
- **WHEN** an employee whose HR has granted self-create permission adds a task to a project
- **THEN** the task is created and assigned to that employee

#### Scenario: self-create denied
- **WHEN** an employee without the self-create permission attempts to add a task
- **THEN** the action is denied

#### Scenario: update progress
- **WHEN** an assignee updates a task's progress
- **THEN** the new progress value is stored and reflected in the activity log and progress bar

### Requirement: Personal task list (My Tasks)
The system SHALL provide a personal My Tasks list that is private to its owner, into which HR and Admin can assign tasks and the employee can self-create tasks. (R7.17)

#### Scenario: self-create personal task
- **WHEN** an employee creates a task in their My Tasks list
- **THEN** the task is private to them and not visible to other employees

#### Scenario: HR assigns to My Tasks
- **WHEN** an HR or Admin assigns a task to an employee's My Tasks list
- **THEN** the task appears in that employee's My Tasks list

### Requirement: Animated progress bars, pinning, and saved views with custom columns
The system SHALL animate task and project progress bars from zero to their value, support pinning projects/tasks to a Pinned section, and support saved views with custom columns via TanStack Table. (R7.18)

#### Scenario: progress bar animates
- **WHEN** a task or project with a progress value renders or its progress changes
- **THEN** its progress bar animates from the previous value to the new value

#### Scenario: pin item
- **WHEN** a user pins a project or task
- **THEN** it appears in the Pinned section of the sidebar and is quickly reachable from there

#### Scenario: save custom view
- **WHEN** a user configures columns, filters, and sort then saves the view
- **THEN** the saved view is listed by name and re-applies the exact columns, filters, and sort when selected

### Requirement: Smooth 60 FPS optimistic Kanban drag
The system SHALL render the Kanban board at 60 FPS during drag, SHALL apply a card's status change optimistically the moment it is dropped, SHALL debounce within-column reorder persistence, SHALL virtualize columns and any column exceeding 100 cards, and SHALL roll the card back to its source column on a server error. (R7.7, R13.19, R13.14, R13.12)

#### Scenario: optimistic status flip on drop
- **WHEN** a user drops a task card onto another Kanban column
- **THEN** the card's status updates to the target column instantly in the UI and the persist request fires in the background without blocking the drag

#### Scenario: rollback on failed move
- **WHEN** the reorder or status request fails after an optimistic drop
- **THEN** the card snaps back to its source column and a danger toast is shown

#### Scenario: virtualized large board
- **WHEN** a board contains more than 100 cards in a column (or 5000 cards total)
- **THEN** the board virtualizes both columns and cards so DOM nodes stay bounded to visible plus overscan and the board remains at 60 FPS

#### Scenario: memoized cards do not re-render siblings
- **WHEN** a user drags one card
- **THEN** sibling cards and column headers are not re-rendered during the drag (React Profiler asserts zero sibling renders)

### Requirement: Efficient task list queries
The system SHALL serve the task list, board data, and My Tasks endpoints at p95 ≤200ms at 10k tasks, SHALL execute ≤5 SQL queries per list request with zero N+1, SHALL use cursor pagination, and SHALL index the columns used for board ordering, assignee lookup, and urgent/overdue sort. (R13.4, R13.5, R13.6)

#### Scenario: list endpoint meets latency and query budget
- **WHEN** a client requests the task list at a scale of 10k tasks
- **THEN** the response returns at p95 ≤200ms having executed ≤5 SQL queries with zero N+1 and using cursor pagination

#### Scenario: indexed filter and sort paths
- **WHEN** the board groups by (project, status, order), the My Tasks view filters by assignee and status, or the list sorts by priority and due date
- **THEN** each filtered or ordered column path is backed by a composite index confirmed by EXPLAIN in tests

### Requirement: Lazy Gantt with off-main-thread layout
The system SHALL dynamically import the Gantt/Timeline view so it stays out of the route's First-Load JS, SHALL compute Gantt layout (bar positions, milestone-diamond coordinates, dependency link paths) in a web worker for large projects, and SHALL render milestone diamonds efficiently so the view stays at 60 FPS. (R7.14, R13.8, R13.17)

#### Scenario: Gantt loaded on demand
- **WHEN** a user opens a project workspace
- **THEN** the Gantt view and its ECharts/renderer bundle are not in the route's First-Load JS and are loaded only when the Gantt tab is opened (or idle-prefetched for HR/Admin)

#### Scenario: large project layout does not block the main thread
- **WHEN** a large project with many tasks and dependencies renders its Gantt
- **THEN** the layout computation runs off the main thread (web worker) so no main-thread task exceeds 50ms and INP is not blocked

### Requirement: Isolated project work timer with no sibling re-renders
The system SHALL drive the per-project work timer's HH:MM:SS display with requestAnimationFrame scoped to the timer component only, SHALL hold timer state outside the component tree so navigation does not reset it, and SHALL ensure each timer tick does not re-render the project workspace, board, list, or sibling widgets. (R7.9, R13.12, R13.11)

#### Scenario: timer ticks without re-rendering the workspace
- **WHEN** the project work timer is running and updates its display each second
- **THEN** the project workspace, board, task list, and sibling widgets are not re-rendered (React Profiler asserts zero sibling renders per tick)

#### Scenario: timer survives navigation
- **WHEN** a user switches between board, list, and Gantt tabs while the timer is running
- **THEN** the timer keeps counting from its local baseline and re-mounts instantly on return without resetting

### Requirement: Lazy Tiptap comments with virtualized thread and optimistic post
The system SHALL dynamically import the Tiptap rich-text editor, SHALL virtualize the comment thread above 100 comments, and SHALL post a comment optimistically then remove it on server error. (R7.6, R13.8, R13.14, R13.19)

#### Scenario: editor loaded on demand
- **WHEN** a user opens the task drawer or focuses the comment composer
- **THEN** the Tiptap editor bundle is loaded on demand and is absent from the task-detail route's First-Load JS

#### Scenario: optimistic comment post with rollback
- **WHEN** a user submits a comment
- **THEN** the comment appears in the thread instantly and, if the server rejects it, the optimistic comment is removed and a danger toast is shown

#### Scenario: virtualized comment thread
- **WHEN** a task has more than 100 comments
- **THEN** the thread is virtualized so DOM nodes stay bounded and posting a new comment does not re-render the existing thread

### Requirement: Fast Quick Task Assignment within two clicks
The system SHALL make the Quick Task Assignment widget reachable in ≤2 clicks from the dashboard, SHALL make the assigned task appear instantly in the assignee's task list on submit, SHALL not cause a full reload, and SHALL dispatch the Global Chat auto-notify on completion from a queued job. (R7.11, R13.24, R13.17, R13.19)

#### Scenario: assign within two clicks with instant appear
- **WHEN** a user assigns a task via the Quick Task Assignment widget from the dashboard
- **THEN** the task appears in the assignee's task list in ≤2 clicks with no full reload, optimistically before the server responds

#### Scenario: queued Global Chat notification on completion
- **WHEN** a Quick-Assigned task is marked complete
- **THEN** the Global Chat auto-notify message is produced by a queued job (not inline) so the completing user is not blocked on chat delivery
