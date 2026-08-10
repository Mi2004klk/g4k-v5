<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserPreferenceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\QaController;
use App\Http\Controllers\TimerController;
use App\Http\Controllers\SavedViewController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\AutoNumberingController;

// NOTE: Laravel auto-prefixes every route in this file with "/api" (via bootstrap/app.php
// `withRouting(api: ...)`). So `Route::post('/auth/login')` is served at `/api/auth/login`.
// NEVER add a second `/api/...` copy here — it would create a broken `/api/api/...` route.

// Public (unauthenticated) endpoints
Route::get('/ping', fn () => response()->json(['status' => 'ok', 'service' => 'g4k-api']));
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::get('/auth/refresh', [AuthController::class, 'refresh'])->middleware('throttle:6,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,15');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware(['auth:sanctum', \App\Http\Middleware\ForcePasswordChange::class, \App\Http\Middleware\ForceOnboarding::class])->group(function () {
    Route::get('/auth/profile', function (Request $request) {
        $user = $request->user()->load(['department', 'designation', 'company', 'roleAssignments']);
        $user->active_role = $request->user()->currentAccessToken()->abilities[0] ?? 'employee';
        $user->active_role = str_replace('role:', '', $user->active_role);
        return $user;
    });

    Route::get('/me/capabilities', function (Request $request) {
        $activeRole = $request->user()->currentAccessToken()->abilities[0] ?? 'employee';
        $activeRole = str_replace('role:', '', $activeRole);
        $capabilities = \App\Services\CapabilityMatrix::getCapabilitiesForRole($activeRole);
        return response()->json(['capabilities' => $capabilities]);
    });

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/onboarding/complete', [AuthController::class, 'completeOnboarding']);
    Route::post('/auth/role-select', [AuthController::class, 'roleSelect'])->middleware('throttle:10,1');
    Route::get('/auth/sessions', [AuthController::class, 'sessions']);
    Route::delete('/auth/sessions/{id}', [AuthController::class, 'revokeSession']);

    // Preferences API
    Route::get('/auth/preferences', [UserPreferenceController::class, 'show']);
    Route::put('/auth/preferences', [UserPreferenceController::class, 'update']);

    // Admin Password Resets
    Route::get('/admin/password-resets', [\App\Http\Controllers\AdminPasswordResetController::class, 'index'])->middleware('ability:role:super_admin');
    Route::post('/admin/password-resets/{id}/approve', [\App\Http\Controllers\AdminPasswordResetController::class, 'approve'])->middleware('ability:role:super_admin');
    Route::post('/admin/password-resets/{id}/reject', [\App\Http\Controllers\AdminPasswordResetController::class, 'reject'])->middleware('ability:role:super_admin');

    // Pins API
    Route::get('/pins', [PinController::class, 'index']);
    Route::post('/pins', [PinController::class, 'store']);
    Route::delete('/pins/{id}', [PinController::class, 'destroy']);

    // Dashboard API
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Profile API
    Route::middleware('capability:profile.edit')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    });

    // Directory API
    Route::middleware('capability:directory.view')->group(function () {
        Route::get('/directory', [DirectoryController::class, 'index']);
        Route::get('/directory/{id}', [DirectoryController::class, 'show']);
    });
    Route::post('/directory/{id}/send-message', [DirectoryController::class, 'sendMessage'])->middleware('capability:directory.send-message');

    // Attendance API
    Route::middleware('capability:attendance.clock-self')->group(function () {
        Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/attendance/start-break', [AttendanceController::class, 'startBreak']);
        Route::post('/attendance/end-break', [AttendanceController::class, 'endBreak']);
        Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
        Route::post('/attendance/sync', [AttendanceController::class, 'sync']);
        Route::get('/attendance/me/today', [AttendanceController::class, 'meToday']);
        Route::get('/attendance/me/history', [AttendanceController::class, 'meHistory']);
        Route::get('/attendance/me/day/{date}', [AttendanceController::class, 'meDay']);
    });

    Route::get('/attendance/admin/overview', [AttendanceController::class, 'overview'])->middleware('capability:admin.view-all-attendance');
    
    Route::middleware('capability:hr.view-team-attendance')->group(function () {
        Route::get('/attendance/hr/today', [AttendanceController::class, 'hrToday']);
        Route::get('/attendance/hr/graph', [AttendanceController::class, 'hrGraph']);
        Route::get('/attendance/hr/day/{date}/{userId}', [AttendanceController::class, 'hrDay']);
        Route::get('/attendance/hr/history/{userId}', [AttendanceController::class, 'hrHistory']);
    });

    Route::post('/attendance/correct', [AttendanceController::class, 'correct'])->middleware('capability:admin.correct-attendance');
    Route::get('/attendance/export', [AttendanceController::class, 'export'])->middleware('capability:admin.view-all-attendance');

    // Phase 6 API
    Route::middleware('capability:leave.request-self')->group(function () {
        Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
        Route::get('/leave-requests/history', [LeaveRequestController::class, 'history']);
        Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
        Route::get('/leave-requests/{id}', [LeaveRequestController::class, 'show']);
    });
    // HR or Admin approve
    Route::post('/approvals/{id}/decision', [LeaveRequestController::class, 'decision'])->middleware('capability:leave.approve-employee');
    Route::get('/approvals/pending', [LeaveRequestController::class, 'pending'])->middleware('capability:leave.approve-employee');
    
    Route::get('/holidays', [HolidayController::class, 'index']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/{id}/mark-unread', [NotificationController::class, 'markUnread']);

    // Phase 7 API (Projects & Tasks)
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{id}/submit-review', [TaskController::class, 'submitForReview']);
    Route::post('/tasks/{id}/comments', [TaskController::class, 'addComment']);
    
    Route::get('/qa-forms', [QaController::class, 'index']);
    Route::post('/qa-forms', [QaController::class, 'store']);
    Route::get('/qa-forms/{id}', [QaController::class, 'show']);
    
    Route::post('/timer/log', [TimerController::class, 'logTime']);
    Route::get('/timer/logs', [TimerController::class, 'index']);

    Route::get('/saved-views', [SavedViewController::class, 'index']);
    Route::post('/saved-views', [SavedViewController::class, 'store']);
    Route::delete('/saved-views/{id}', [SavedViewController::class, 'destroy']);

    // Phase 8 API (Chat & Communication)
    Route::get('/conversations', [\App\Http\Controllers\ChatController::class, 'index']);
    Route::post('/conversations/dm', [\App\Http\Controllers\ChatController::class, 'startDirectMessage']);
    Route::get('/conversations/{id}/messages', [\App\Http\Controllers\ChatController::class, 'messages']);
    Route::post('/conversations/{id}/messages', [\App\Http\Controllers\ChatController::class, 'sendMessage']);

    Route::get('/announcements', [\App\Http\Controllers\AnnouncementController::class, 'index']);
    Route::post('/announcements', [\App\Http\Controllers\AnnouncementController::class, 'store']);

    Route::get('/quick-notes', [\App\Http\Controllers\QuickNoteController::class, 'index']);
    Route::post('/quick-notes', [\App\Http\Controllers\QuickNoteController::class, 'store']);
    Route::delete('/quick-notes/{id}', [\App\Http\Controllers\QuickNoteController::class, 'destroy']);

    Route::post('/feedback', [\App\Http\Controllers\FeedbackController::class, 'store']);

    // Phase 9 API (Reports & Exports)
    Route::get('/reports/data', [\App\Http\Controllers\ReportController::class, 'data']);
    Route::post('/reports/export', [\App\Http\Controllers\ReportController::class, 'export']);
    Route::get('/reports/exports', [\App\Http\Controllers\ReportController::class, 'exports']);
    Route::get('/reports/attendance-summary', [\App\Http\Controllers\ReportController::class, 'attendanceSummary']);
    Route::get('/reports/leave-summary', [\App\Http\Controllers\ReportController::class, 'leaveSummary']);
    
    // Phase 10 API (Settings & Audit Logs)
    Route::middleware('capability:settings.manage')->group(function () {
        Route::get('/settings/grouped', [\App\Http\Controllers\SettingsController::class, 'index']);
        Route::post('/settings/bulk', [\App\Http\Controllers\SettingsController::class, 'bulkUpdate']);
        Route::get('/company-profile', [\App\Http\Controllers\CompanyProfileController::class, 'show']);
        Route::post('/company-profile', [\App\Http\Controllers\CompanyProfileController::class, 'update']);
        Route::post('/company-profile/logo', [\App\Http\Controllers\CompanyProfileController::class, 'uploadLogo']);
        Route::get('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'index']);
        Route::put('/work-schedules/{id}', [\App\Http\Controllers\WorkScheduleController::class, 'update']);
    });
    
    Route::get('/audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->middleware('capability:audit.view');
    Route::get('/audit-logs/export', [\App\Http\Controllers\AuditLogController::class, 'export'])->middleware('capability:audit.view');

    // Admin & Master Data APIs
    Route::get('/users/export', [UserController::class, 'export'])->middleware('capability:users.hr.manage');
    Route::middleware('capability:users.hr.manage|users.employee.manage')->group(function () {
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::get('/users/{id}/activity', [UserController::class, 'activity']);
        Route::apiResource('users', UserController::class);
    });
    Route::apiResource('companies', CompanyController::class)->middleware('capability:settings.manage');
    Route::apiResource('auto-numberings', AutoNumberingController::class)->middleware('capability:settings.manage');
    
    // Leave Module
    Route::get('/holidays', [\App\Http\Controllers\HolidayController::class, 'index']);
    Route::middleware('capability:settings.manage')->group(function () {
        Route::post('/holidays', [\App\Http\Controllers\HolidayController::class, 'store']);
        Route::put('/holidays/{id}', [\App\Http\Controllers\HolidayController::class, 'update']);
        Route::delete('/holidays/{id}', [\App\Http\Controllers\HolidayController::class, 'destroy']);
    });

    Route::prefix('leave-requests')->group(function () {
        Route::get('/', [\App\Http\Controllers\LeaveRequestController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\LeaveRequestController::class, 'store']);
        Route::get('/pending', [\App\Http\Controllers\LeaveRequestController::class, 'pending']);
        Route::get('/history', [\App\Http\Controllers\LeaveRequestController::class, 'history']);
        Route::get('/{id}', [\App\Http\Controllers\LeaveRequestController::class, 'show']);
        Route::post('/{id}/decision', [\App\Http\Controllers\LeaveRequestController::class, 'decision']);
    });

    // Departments
    Route::middleware('capability:departments.manage')->group(function () {
        Route::get('/departments/export', [DepartmentController::class, 'export']);
        Route::patch('/departments/{id}/archive', [DepartmentController::class, 'archive']);
        Route::patch('/departments/{id}/restore', [DepartmentController::class, 'restore']);
        Route::post('/departments/{department}/teams', [DepartmentController::class, 'storeTeam']);
        Route::delete('/departments/{department}/teams/{team}', [DepartmentController::class, 'destroyTeam']);
        Route::apiResource('departments', DepartmentController::class);
    });

    // Designations
    Route::middleware('capability:designations.manage')->group(function () {
        Route::get('/designations/export', [DesignationController::class, 'export']);
        Route::patch('/designations/{id}/status', [DesignationController::class, 'updateStatus']);
        Route::apiResource('designations', DesignationController::class);
    });
});
