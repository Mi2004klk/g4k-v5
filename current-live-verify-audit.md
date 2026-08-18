# Application Correction & Verification Checklist

## 1. General Application Issues

* [ ] Fix the application crash that occurs unexpectedly with the error: **“Session could not load — We couldn't verify your permissions.”**
* [ ] Investigate and fix the underlying session/permission validation issue so the application does not crash.
* [ ] Fix image uploads across the entire application wherever image upload functionality is used.
* [ ] Verify image upload functionality in Projects and all other modules.
* [ ] Fix real-time project pin/unpin functionality:

  * [ ] Pinning a project should work immediately.
  * [ ] Unpinning should work immediately without requiring a page reload.
  * [ ] The pin/star state should accurately reflect the current project state.
  * [ ] The pin/star icon should not appear active for every project.
  * [ ] Verify that the state remains correct after page refresh.
* [ ] Fix the Attendance leave-request calendar:

  * [ ] Past dates should be visibly disabled/greyed out.
  * [ ] The current date should be displayed correctly.
  * [ ] Future dates should remain selectable according to the leave rules.
* [ ] Fix Project Details task filtering:

  * [ ] A project's task list must show only tasks belonging to that project.
  * [ ] Tasks from other projects must never appear.
  * [ ] Overall Tasks must remain separate from Project Tasks.
  * [ ] Refreshing the page must not change or mix the task data.
* [ ] Remove **Directory** and **Reports & Analytics** from the Employee application.
* [ ] Fix the PDF export button in **Reports & Analytics → General Data Export**:

  * [ ] It must remain inside the container.
  * [ ] It must respect the page margins.
  * [ ] Reproduce and fix the issue after selecting **Report Type** in the Sort options.
  * [ ] Verify the correction for both Admin and HR.

---

# 2. Dashboard

* [ ] Fix adjustable dashboard widget height resizing.
* [ ] Verify that widgets can be resized without layout errors.
* [ ] Verify that resizing one widget does not break or move unrelated widgets.
* [ ] Investigate the dashboard failure that occurs after approximately 15 minutes.
* [ ] Fix the **“Dashboard Unavailable”** error.
* [ ] Investigate why multiple users experience the dashboard failure concurrently.
* [ ] Fix the connection/session/realtime issue causing the dashboard to become unavailable.
* [ ] Dashboard data should recover automatically without requiring repeated retries or page reloads.

---

# 3. Communications / Chat

### Connection

* [ ] Fix the **“Not Connected”** status displayed in the top-right corner of chats.
* [ ] Verify the real-time chat connection is actually established.
* [ ] Ensure connection status accurately reflects the current connection state.

### Employee Search

* [ ] Fix employee search in Chat.
* [ ] When typing a name or character, matching employees should appear as suggestions.
* [ ] Selecting an employee should open a direct conversation with that employee.

### Messaging / Realtime

* [ ] Fix the delay in sending and receiving chat messages.
* [ ] Messages should appear immediately when successfully sent or received.
* [ ] Messages must synchronize without requiring multiple page reloads.
* [ ] Preserve the actual message timestamp when synchronization occurs later.
* [ ] Verify chat synchronization under a normal/good network connection.

### Chat UI

* [ ] Make Chat full-screen on mobile devices, similar to standard mobile messaging applications.
* [ ] Add a close button after opening/selecting a chat.
* [ ] Only the currently selected chat should display the selected-state stroke/border.
* [ ] Remove incorrect selected-state strokes from unselected chats.
* [ ] Add the ability to pin important/special chats.

### Announcements

* [ ] Fix Announcement creation/functionality in Admin.
* [ ] Fix Announcement functionality in HR.
* [ ] Resolve the **“Server Error”** occurring when using Announcements.
* [ ] Verify that created announcements are correctly saved and displayed.

---

# 4. Admin Application

## 4.1 Admin Dashboard

### Team Attendance Widget

* [ ] Fix Team Attendance widget movement.
* [ ] The widget should be draggable normally in all supported directions.
* [ ] Clicking the move control must not redirect to a 404 page.
* [ ] The widget should not require another widget to move near it before becoming movable.

### Total Employees Widget

* [ ] Fix the incorrect active employee count.
* [ ] The widget must display the actual number of currently active employees.
* [ ] Synchronize the value with real-time attendance/activity data.

### Pending Approval Widget

* [ ] Fix stale approval data.
* [ ] Newly completed tasks waiting for approval must appear immediately.
* [ ] Remove outdated approval items when their status changes.
* [ ] Make the entire pending approval task/card clickable.
* [ ] Clicking anywhere on the pending approval task should open the relevant Approval page.
* [ ] The **View** button should continue to work correctly.

---

# 5. Admin Attendance

* [ ] Attendance must display real-time team attendance.
* [ ] Attendance Overview must display real-time information for:

  * [ ] Present employees.
  * [ ] Absent employees.
  * [ ] Employees who have requested leave.
* [ ] Attendance Analytics must use current real-time data.
* [ ] Remove **Open Shifts** from the Attendance page.
* [ ] Remove the **My Team (HR)** tab from the Admin Attendance page.
* [ ] Verify that attendance changes are reflected without unnecessary page reloads.

---

# 6. Admin Projects

### Project Creation

* [ ] Fix image upload during project creation.
* [ ] Resolve the **“Server Error”** appearing when uploading a project image.
* [ ] Verify that the uploaded image is correctly saved and displayed.

### Task Approval

* [ ] Fix the incorrect **“Task has No Pending Approval”** error.
* [ ] A task shown under **In Review** and awaiting approval must be approvable.
* [ ] Ensure the frontend and backend use the same approval status.
* [ ] Fix the error-message close button.

### Task Creation

* [ ] Fix the error shown when creating a task inside a project.
* [ ] A successfully created task must immediately appear without requiring a page reload.
* [ ] Do not display an error when the task has actually been created successfully.
* [ ] Prevent duplicate task creation caused by retries/reloads.

### Project Page Layout

* [ ] Fix the **Create Project** button alignment when the project page is minimized/resized.
* [ ] Ensure the button remains inside the container and page margins.

### Project Details Loading

* [ ] Fix the first-load error:
  **“Cannot read properties of undefined (reading 'status')”**
* [ ] Project Details must load correctly on the first attempt.
* [ ] Retry should not be required.
* [ ] Verify the fix for every existing project.
* [ ] Ensure project data is loaded before components attempt to access properties such as `status`.

### QA Forms

* [ ] Redesign the QA form to work similarly to a Google Form.
* [ ] Allow preset QA forms to be created for projects.
* [ ] Allow customized QA forms for individual projects.
* [ ] Allow customized QA forms for specific tasks.
* [ ] Ensure QA responses are associated with the correct project/task.

### My Tasks & Board

* [ ] Add the same filtering and sorting options available in the List view to the Board view.
* [ ] Include:

  * [ ] All Assignee.
  * [ ] All Status.
  * [ ] All Scope.
  * [ ] Created (Newest).
  * [ ] Descending.
  * [ ] Clear All.
* [ ] Ensure filters work correctly in combination.
* [ ] Ensure sorting does not reset unexpectedly.

### List View

* [ ] Fix the duplicate **All Scope** option.
* [ ] The interface currently displays **“All ScopeAll Scope”**.
* [ ] Display only one **All Scope** option.
* [ ] Selecting All Scope should select only one filter value.

### Project Calendar

* [ ] Update the Project Creation calendar to match the calendar used in Task Creation.
* [ ] Keep date selection, appearance, validation, and interaction consistent between both forms.

---

# 7. Admin Directory

* [ ] Fix the three employee messaging entry points in Corporate Directory.
* [ ] The message icon on the employee widget must open a chat with that specific employee.
* [ ] The **Message** button in the employee preview must open a chat with that employee.
* [ ] The **Send Message** button in the employee profile must open a chat with that employee.
* [ ] Verify that all three buttons use the correct employee ID.
* [ ] Fix **Add Employee** so the form opens successfully on the first attempt.
* [ ] It should not require a page reload before working.

---

# 8. Admin General Errors

### Directory

* [ ] Fix the Directory first-load error:
  **“Cannot read properties of undefined (reading 'length')”**
* [ ] Directory must load correctly without requiring a refresh.

### Reports & Analytics

* [ ] Fix the first-load error:
  **“y.map is not a function”**
* [ ] Ensure the data passed to the component is always the expected array/data structure.
* [ ] Reports & Analytics must load correctly without requiring a refresh.

### Attendance Overview

* [ ] Fix the first-load error:
  **“es.map is not a function”**
* [ ] Ensure Attendance Overview receives valid data before rendering.

### Cross-Page Data/State Issue

* [ ] Investigate the issue where refreshing one page causes another page to show an error.
* [ ] Fix the shared state/API/data-loading issue causing Directory, Reports & Analytics, and Attendance pages to affect each other.
* [ ] Verify that:

  * [ ] Directory works.
  * [ ] Reports & Analytics works.
  * [ ] Attendance Overview works.
  * [ ] Reloading one page does not break another.
  * [ ] Navigating between these pages does not produce intermittent errors.

---

# 9. HR Application

## 9.1 HR Projects

The HR Projects module must have the same corrections as Admin Projects where the functionality is available to HR.

* [ ] Fix project image upload and remove the **Server Error**.
* [ ] Fix task approval showing **“Task has No Pending Approval”** incorrectly.
* [ ] Fix the approval error-message close button.
* [ ] Fix task creation showing an error even though the task is created.
* [ ] Ensure newly created tasks appear immediately.
* [ ] Fix the Create Project button going outside the container when the page is minimized.
* [ ] Fix the first-load Project Details error:
  **“Cannot read properties of undefined (reading 'status')”**
* [ ] Ensure Project Details loads correctly on the first attempt.
* [ ] Implement Google-Form-style QA forms.
* [ ] Support preset QA forms for projects.
* [ ] Support customized QA forms for projects/tasks.
* [ ] Fix Project Details task filtering so only that project's tasks are displayed.
* [ ] Add List-view sorting/filtering options to the Board.
* [ ] Include All Assignee, All Status, All Scope, Created (Newest), Descending, and Clear All.
* [ ] Remove the duplicate All Scope option.
* [ ] Update the Project Creation calendar to match Task Creation.

---

# 10. HR General Errors

### Directory

* [ ] Fix the Directory error:
  **“Cannot read properties of undefined (reading 'length')”**
* [ ] Directory must work correctly on the first load.

### Attendance

* [ ] Fix the Attendance error:
  **“ee.map is not a function”**
* [ ] Ensure Attendance receives valid data before rendering.
* [ ] Attendance must work correctly without requiring a refresh.

### Cross-Page State Issue

* [ ] Fix the issue where loading/reloading Attendance causes Directory to fail temporarily.
* [ ] Fix the issue where loading/reloading Directory causes Attendance to fail.
* [ ] Investigate shared API responses, state management, caching, or data-shape conflicts.
* [ ] Verify that Directory and Attendance can be opened and refreshed independently.

---

# 11. HR Attendance

* [ ] Add an Attendance Heat Map for HR.
* [ ] The Heat Map must show only employees belonging to the HR user's team.
* [ ] Do not display global company attendance data to HR.
* [ ] Attendance must display real-time team attendance.
* [ ] Attendance Analytics must use real-time data.
* [ ] Verify that attendance changes are reflected without unnecessary page reloads.

---

# 12. Role & Permission Verification

## Admin

* [ ] Admin can create projects.
* [ ] Admin can create tasks.
* [ ] Admin can assign projects/tasks to teams or employees.
* [ ] Admin can receive project reports.
* [ ] Admin can receive task reports.
* [ ] Admin can review/approve tasks and projects requiring Admin approval.
* [ ] Admin can view today's team attendance.
* [ ] Admin can view historical employee attendance.
* [ ] Admin can view performance reports.
* [ ] Admin can receive employee leave requests.
* [ ] Admin can approve or reject leave requests.
* [ ] Admin can communicate with all company employees.
* [ ] Admin can create announcements.
* [ ] Admin receives relevant notifications from HR and Employees.

## HR

* [ ] HR can create projects.
* [ ] HR can create tasks.
* [ ] HR can assign projects/tasks to employees within their team.
* [ ] HR can receive project reports for their team.
* [ ] HR can receive task reports for their team.
* [ ] HR can approve tasks/projects where HR approval is required.
* [ ] HR can view attendance for their team.
* [ ] HR can view historical attendance for their team.
* [ ] HR can view team performance reports.
* [ ] HR can receive leave requests from employees in their team.
* [ ] HR can approve or reject applicable leave requests.
* [ ] HR can communicate with company employees.
* [ ] HR can create announcements.
* [ ] HR receives relevant notifications from Admin and Employees.

## Employee

* [ ] Verify all Employee permissions against the intended Employee workflow.
* [ ] Ensure Employee users cannot access Admin-only or HR-only functionality.
* [ ] Confirm that Directory and Reports & Analytics are removed from the Employee application.
* [ ] Verify that Employee attendance, projects, tasks, leave requests, chat, notifications, and other permitted workflows work correctly.

---

# 13. Final End-to-End Verification

* [ ] Test every issue after implementing the correction.
* [ ] Test Admin, HR, and Employee accounts separately.
* [ ] Test first-time page loading without refreshing.
* [ ] Test page refresh/reload behaviour.
* [ ] Test navigation between related modules.
* [ ] Test real-time updates with multiple users simultaneously.
* [ ] Test chat with multiple users simultaneously.
* [ ] Test attendance changes in real time.
* [ ] Test project/task creation and updates in real time.
* [ ] Test approval workflows from creation through approval/rejection.
* [ ] Test leave-request workflows.
* [ ] Test image uploads from every location where uploads are supported.
* [ ] Test desktop, tablet, and mobile layouts.
* [ ] Test responsive/minimized layouts for all affected pages.
* [ ] Verify that no API/data-shape errors such as `.map is not a function` occur.
* [ ] Verify that no `undefined` property access errors occur.
* [ ] Verify that no unexpected 404 pages occur during normal interaction.
* [ ] Verify that no feature requires a page reload to display a successful operation.
* [ ] Verify that real-time state remains consistent after navigation and refresh.
* [ ] Verify that one user's data/state cannot incorrectly appear in another user's view.
* [ ] Verify role-based access and permissions across all three user types.
* [ ] Perform a final regression test of the complete application before release.
