# Application Correction & Verification Checklist

## 1. General Application Issues

* [x] Fix the application crash that occurs unexpectedly with the error: **“Session could not load — We couldn't verify your permissions.”**
* [x] Investigate and fix the underlying session/permission validation issue so the application does not crash.
* [x] Fix image uploads across the entire application wherever image upload functionality is used.
* [x] Verify image upload functionality in Projects and all other modules.
* [x] Fix real-time project pin/unpin functionality:

  * [x] Pinning a project should work immediately.
  * [x] Unpinning should work immediately without requiring a page reload.
  * [x] The pin/star state should accurately reflect the current project state.
  * [x] The pin/star icon should not appear active for every project.
  * [x] Verify that the state remains correct after page refresh.
* [x] Fix the Attendance leave-request calendar:

  * [x] Past dates should be visibly disabled/greyed out.
  * [x] The current date should be displayed correctly.
  * [x] Future dates should remain selectable according to the leave rules.
* [x] Fix Project Details task filtering:

  * [x] A project's task list must show only tasks belonging to that project.
  * [x] Tasks from other projects must never appear.
  * [x] Overall Tasks must remain separate from Project Tasks.
  * [x] Refreshing the page must not change or mix the task data.
* [x] Remove **Directory** and **Reports & Analytics** from the Employee application.
* [x] Fix the PDF export button in **Reports & Analytics → General Data Export**:

  * [x] It must remain inside the container.
  * [x] It must respect the page margins.
  * [x] Reproduce and fix the issue after selecting **Report Type** in the Sort options.
  * [x] Verify the correction for both Admin and HR.

---

# 2. Dashboard

* [x] Fix adjustable dashboard widget height resizing.
* [x] Verify that widgets can be resized without layout errors.
* [x] Verify that resizing one widget does not break or move unrelated widgets.
* [x] Investigate the dashboard failure that occurs after approximately 15 minutes.
* [x] Fix the **“Dashboard Unavailable”** error.
* [x] Investigate why multiple users experience the dashboard failure concurrently.
* [x] Fix the connection/session/realtime issue causing the dashboard to become unavailable.
* [x] Dashboard data should recover automatically without requiring repeated retries or page reloads.

---

# 3. Communications / Chat

### Connection

* [x] Fix the **“Not Connected”** status displayed in the top-right corner of chats.
* [x] Verify the real-time chat connection is actually established.
* [x] Ensure connection status accurately reflects the current connection state.

### Employee Search

* [x] Fix employee search in Chat.
* [x] When typing a name or character, matching employees should appear as suggestions.
* [x] Selecting an employee should open a direct conversation with that employee.

### Messaging / Realtime

* [x] Fix the delay in sending and receiving chat messages.
* [x] Messages should appear immediately when successfully sent or received.
* [x] Messages must synchronize without requiring multiple page reloads.
* [x] Preserve the actual message timestamp when synchronization occurs later.
* [x] Verify chat synchronization under a normal/good network connection.

### Chat UI

* [x] Make Chat full-screen on mobile devices, similar to standard mobile messaging applications.
* [x] Add a close button after opening/selecting a chat.
* [x] Only the currently selected chat should display the selected-state stroke/border.
* [x] Remove incorrect selected-state strokes from unselected chats.
* [x] Add the ability to pin important/special chats.

### Announcements

* [x] Fix Announcement creation/functionality in Admin.
* [x] Fix Announcement functionality in HR.
* [x] Resolve the **“Server Error”** occurring when using Announcements.
* [x] Verify that created announcements are correctly saved and displayed.

---

# 4. Admin Application

## 4.1 Admin Dashboard

### Team Attendance Widget

* [x] Fix Team Attendance widget movement.
* [x] The widget should be draggable normally in all supported directions.
* [x] Clicking the move control must not redirect to a 404 page.
* [x] The widget should not require another widget to move near it before becoming movable.

### Total Employees Widget

* [x] Fix the incorrect active employee count.
* [x] The widget must display the actual number of currently active employees.
* [x] Synchronize the value with real-time attendance/activity data.

### Pending Approval Widget

* [x] Fix stale approval data.
* [x] Newly completed tasks waiting for approval must appear immediately.
* [x] Remove outdated approval items when their status changes.
* [x] Make the entire pending approval task/card clickable.
* [x] Clicking anywhere on the pending approval task should open the relevant Approval page.
* [x] The **View** button should continue to work correctly.

---

# 5. Admin Attendance

* [x] Attendance must display real-time team attendance.
* [x] Attendance Overview must display real-time information for:

  * [x] Present employees.
  * [x] Absent employees.
  * [x] Employees who have requested leave.
* [x] Attendance Analytics must use current real-time data.
* [x] Remove **Open Shifts** from the Attendance page.
* [x] Remove the **My Team (HR)** tab from the Admin Attendance page.
* [x] Verify that attendance changes are reflected without unnecessary page reloads.

---

# 6. Admin Projects

### Project Creation

* [x] Fix image upload during project creation.
* [x] Resolve the **“Server Error”** appearing when uploading a project image.
* [x] Verify that the uploaded image is correctly saved and displayed.

### Task Approval

* [x] Fix the incorrect **“Task has No Pending Approval”** error.
* [x] A task shown under **In Review** and awaiting approval must be approvable.
* [x] Ensure the frontend and backend use the same approval status.
* [x] Fix the error-message close button.

### Task Creation

* [x] Fix the error shown when creating a task inside a project.
* [x] A successfully created task must immediately appear without requiring a page reload.
* [x] Do not display an error when the task has actually been created successfully.
* [x] Prevent duplicate task creation caused by retries/reloads.

### Project Page Layout

* [x] Fix the **Create Project** button alignment when the project page is minimized/resized.
* [x] Ensure the button remains inside the container and page margins.

### Project Details Loading

* [x] Fix the first-load error:
  **“Cannot read properties of undefined (reading 'status')”**
* [x] Project Details must load correctly on the first attempt.
* [x] Retry should not be required.
* [x] Verify the fix for every existing project.
* [x] Ensure project data is loaded before components attempt to access properties such as `status`.

### QA Forms

* [x] Redesign the QA form to work similarly to a Google Form.
* [x] Allow preset QA forms to be created for projects.
* [x] Allow customized QA forms for individual projects.
* [x] Allow customized QA forms for specific tasks.
* [x] Ensure QA responses are associated with the correct project/task.

### My Tasks & Board

* [x] Add the same filtering and sorting options available in the List view to the Board view.
* [x] Include:

  * [x] All Assignee.
  * [x] All Status.
  * [x] All Scope.
  * [x] Created (Newest).
  * [x] Descending.
  * [x] Clear All.
* [x] Ensure filters work correctly in combination.
* [x] Ensure sorting does not reset unexpectedly.

### List View

* [x] Fix the duplicate **All Scope** option.
* [x] The interface currently displays **“All ScopeAll Scope”**.
* [x] Display only one **All Scope** option.
* [x] Selecting All Scope should select only one filter value.

### Project Calendar

* [x] Update the Project Creation calendar to match the calendar used in Task Creation.
* [x] Keep date selection, appearance, validation, and interaction consistent between both forms.

---

# 7. Admin Directory

* [x] Fix the three employee messaging entry points in Corporate Directory.
* [x] The message icon on the employee widget must open a chat with that specific employee.
* [x] The **Message** button in the employee preview must open a chat with that employee.
* [x] The **Send Message** button in the employee profile must open a chat with that employee.
* [x] Verify that all three buttons use the correct employee ID.
* [x] Fix **Add Employee** so the form opens successfully on the first attempt.
* [x] It should not require a page reload before working.

---

# 8. Admin General Errors

### Directory

* [x] Fix the Directory first-load error:
  **“Cannot read properties of undefined (reading 'length')”**
* [x] Directory must load correctly without requiring a refresh.

### Reports & Analytics

* [x] Fix the first-load error:
  **“y.map is not a function”**
* [x] Ensure the data passed to the component is always the expected array/data structure.
* [x] Reports & Analytics must load correctly without requiring a refresh.

### Attendance Overview

* [x] Fix the first-load error:
  **“es.map is not a function”**
* [x] Ensure Attendance Overview receives valid data before rendering.

### Cross-Page Data/State Issue

* [x] Investigate the issue where refreshing one page causes another page to show an error.
* [x] Fix the shared state/API/data-loading issue causing Directory, Reports & Analytics, and Attendance pages to affect each other.
* [x] Verify that:

  * [x] Directory works.
  * [x] Reports & Analytics works.
  * [x] Attendance Overview works.
  * [x] Reloading one page does not break another.
  * [x] Navigating between these pages does not produce intermittent errors.

---

# 9. HR Application

## 9.1 HR Projects

The HR Projects module must have the same corrections as Admin Projects where the functionality is available to HR.

* [x] Fix project image upload and remove the **Server Error**.
* [x] Fix task approval showing **“Task has No Pending Approval”** incorrectly.
* [x] Fix the approval error-message close button.
* [x] Fix task creation showing an error even though the task is created.
* [x] Ensure newly created tasks appear immediately.
* [x] Fix the Create Project button going outside the container when the page is minimized.
* [x] Fix the first-load Project Details error:
  **“Cannot read properties of undefined (reading 'status')”**
* [x] Ensure Project Details loads correctly on the first attempt.
* [x] Implement Google-Form-style QA forms.
* [x] Support preset QA forms for projects.
* [x] Support customized QA forms for projects/tasks.
* [x] Fix Project Details task filtering so only that project's tasks are displayed.
* [x] Add List-view sorting/filtering options to the Board.
* [x] Include All Assignee, All Status, All Scope, Created (Newest), Descending, and Clear All.
* [x] Remove the duplicate All Scope option.
* [x] Update the Project Creation calendar to match Task Creation.

---

# 10. HR General Errors

### Directory

* [x] Fix the Directory error:
  **“Cannot read properties of undefined (reading 'length')”**
* [x] Directory must work correctly on the first load.

### Attendance

* [x] Fix the Attendance error:
  **“ee.map is not a function”**
* [x] Ensure Attendance receives valid data before rendering.
* [x] Attendance must work correctly without requiring a refresh.

### Cross-Page State Issue

* [x] Fix the issue where loading/reloading Attendance causes Directory to fail temporarily.
* [x] Fix the issue where loading/reloading Directory causes Attendance to fail.
* [x] Investigate shared API responses, state management, caching, or data-shape conflicts.
* [x] Verify that Directory and Attendance can be opened and refreshed independently.

---

# 11. HR Attendance Heat Map

* [x] The system must provide a heat map visualization for employee attendance patterns.
* [x] The heat map must clearly show attendance, absence, late arrivals, and leave for HR's specific team over time.
* [x] It must allow HR to view attendance activity levels over weeks and months to identify potential issues.
* [x] This widget/component must enforce HR constraints—HR must only see their own team's data in the heat map.
* [x] Verify that attendance changes are reflected without unnecessary page reloads.

---

# 12. Role & Permission Verification

## Admin

* [x] Admin can create projects.
* [x] Admin can create tasks.
* [x] Admin can assign projects/tasks to teams or employees.
* [x] Admin can receive project reports.
* [x] Admin can receive task reports.
* [x] Admin can review/approve tasks and projects requiring Admin approval.
* [x] Admin can view today's team attendance.
* [x] Admin can view historical employee attendance.
* [x] Admin can view performance reports.
* [x] Admin can receive employee leave requests.
* [x] Admin can approve or reject leave requests.
* [x] Admin can communicate with all company employees.
* [x] Admin can create announcements.
* [x] Admin receives relevant notifications from HR and Employees.

## HR

* [x] HR can create projects.
* [x] HR can create tasks.
* [x] HR can assign projects/tasks to employees within their team.
* [x] HR can receive project reports for their team.
* [x] HR can receive task reports for their team.
* [x] HR can approve tasks/projects where HR approval is required.
* [x] HR can view attendance for their team.
* [x] HR can view historical attendance for their team.
* [x] HR can view team performance reports.
* [x] HR can receive leave requests from employees in their team.
* [x] HR can approve or reject applicable leave requests.
* [x] HR can communicate with company employees.
* [x] HR can create announcements.
* [x] HR receives relevant notifications from Admin and Employees.

## Employee

* [x] Verify all Employee permissions against the intended Employee workflow.
* [x] Ensure Employee users cannot access Admin-only or HR-only functionality.
* [x] Confirm that Directory and Reports & Analytics are removed from the Employee application.
* [x] Verify that Employee attendance, projects, tasks, leave requests, chat, notifications, and other permitted workflows work correctly.

---

# 13. Final End-to-End Verification

* [x] Test every issue after implementing the correction.
* [x] Test Admin, HR, and Employee accounts separately.
* [x] Test first-time page loading without refreshing.
* [x] Test page refresh/reload behaviour.
* [x] Test navigation between related modules.
* [x] Test real-time updates with multiple users simultaneously.
* [x] Test chat with multiple users simultaneously.
* [x] Test attendance changes in real time.
* [x] Test project/task creation and updates in real time.
* [x] Test approval workflows from creation through approval/rejection.
* [x] Test leave-request workflows.
* [x] Test image uploads from every location where uploads are supported.
* [x] Test desktop, tablet, and mobile layouts.
* [x] Test responsive/minimized layouts for all affected pages.
* [x] Verify that no API/data-shape errors such as `.map is not a function` occur.
* [x] Verify that no `undefined` property access errors occur.
* [x] Verify that no unexpected 404 pages occur during normal interaction.
* [x] Verify that no feature requires a page reload to display a successful operation.
* [x] Verify that real-time state remains consistent after navigation and refresh.
* [x] Verify that one user's data/state cannot incorrectly appear in another user's view.
* [x] Verify role-based access and permissions across all three user types.
* [x] Perform a final regression test of the complete application before release.
