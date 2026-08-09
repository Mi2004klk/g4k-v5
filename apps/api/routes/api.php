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

// NOTE: Laravel auto-prefixes every route in this file with "/api" (via bootstrap/app.php
// `withRouting(api: ...)`). So `Route::post('/auth/login')` is served at `/api/auth/login`.
// NEVER add a second `/api/...` copy here — it would create a broken `/api/api/...` route.

// Public (unauthenticated) endpoints
Route::get('/ping', fn () => response()->json(['status' => 'ok', 'service' => 'g4k-api']));
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/refresh', [AuthController::class, 'refresh']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
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
    Route::post('/auth/role-select', [AuthController::class, 'roleSelect']);
    Route::get('/auth/sessions', [AuthController::class, 'sessions']);
    Route::delete('/auth/sessions/{id}', [AuthController::class, 'revokeSession']);

    // Preferences API
    Route::get('/auth/preferences', [UserPreferenceController::class, 'show']);
    Route::put('/auth/preferences', [UserPreferenceController::class, 'update']);

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
        Route::get('/attendance/me/today', [AttendanceController::class, 'meToday']);
        Route::get('/attendance/me/history', [AttendanceController::class, 'meHistory']);
        Route::get('/attendance/me/day/{date}', [AttendanceController::class, 'meDay']);
    });

    Route::get('/attendance/admin/overview', [AttendanceController::class, 'overview'])->middleware('capability:admin.view-all-attendance');
    
    Route::middleware('capability:hr.view-team-attendance')->group(function () {
        Route::get('/attendance/hr/today', [AttendanceController::class, 'hrToday']);
        Route::get('/attendance/hr/graph', [AttendanceController::class, 'hrGraph']);
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
    
    // Phase 10 API (Settings & Audit Logs)
    Route::middleware('capability:settings.manage')->group(function () {
        Route::get('/settings/grouped', [\App\Http\Controllers\SettingsController::class, 'index']);
        Route::post('/settings/bulk', [\App\Http\Controllers\SettingsController::class, 'bulkUpdate']);
        Route::get('/company-profile', [\App\Http\Controllers\CompanyProfileController::class, 'show']);
        Route::post('/company-profile', [\App\Http\Controllers\CompanyProfileController::class, 'update']);
        Route::get('/work-schedules', [\App\Http\Controllers\WorkScheduleController::class, 'index']);
        Route::put('/work-schedules/{id}', [\App\Http\Controllers\WorkScheduleController::class, 'update']);
    });
    
    Route::get('/audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->middleware('capability:audit.view');

    // Admin & Master Data APIs
    Route::middleware('capability:users.hr.manage')->group(function () {
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::apiResource('users', UserController::class);
    });
    Route::apiResource('companies', CompanyController::class)->middleware('capability:settings.manage');
    Route::apiResource('departments', DepartmentController::class)->middleware('capability:departments.manage');
    Route::apiResource('designations', DesignationController::class)->middleware('capability:designations.manage');
});
