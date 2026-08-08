<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/role/select', [AuthController::class, 'roleSelect']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/sessions', [AuthController::class, 'sessions']);
        Route::delete('/sessions/{id}', [AuthController::class, 'revokeSession']);
        Route::post('/logout', [AuthController::class, 'logout']);
        
        Route::get('/me', function (Request $request) {
            $user = $request->user();
            // Active role is parsed from token ability
            $activeRole = null;
            if ($user->currentAccessToken()) {
                foreach ($user->currentAccessToken()->abilities as $ability) {
                    if (str_starts_with($ability, 'role:')) {
                        $activeRole = substr($ability, 5);
                        break;
                    }
                }
            }
            $user->roles = \App\Models\RoleAssignment::where('user_id', $user->id)->pluck('role');
            return response()->json([
                'user' => $user,
                'active_role' => $activeRole
            ]);
        });
    });
});
Route::middleware('auth:sanctum')->group(function () {

    // Profile
    Route::prefix('auth/profile')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProfileController::class, 'show'])->middleware('capability:profile.edit');
        Route::put('/', [\App\Http\Controllers\ProfileController::class, 'update'])->middleware('capability:profile.edit');
        Route::post('/change-password', [\App\Http\Controllers\ProfileController::class, 'changePassword']);
    });

    // Preferences
    Route::prefix('auth/preferences')->group(function () {
        Route::get('/', [\App\Http\Controllers\UserPreferenceController::class, 'show']);
        Route::put('/', [\App\Http\Controllers\UserPreferenceController::class, 'update']);
    });

    // Dashboard Hub
    Route::get('/dashboard/metrics', [\App\Http\Controllers\DashboardController::class, 'metrics']);

    // Attendance
    Route::prefix('attendance')->group(function () {
        Route::get('/today', [\App\Http\Controllers\AttendanceController::class, 'today']);
        Route::post('/clock', [\App\Http\Controllers\AttendanceController::class, 'clock']);
        Route::get('/history', [\App\Http\Controllers\AttendanceController::class, 'history']);
        Route::get('/company', [\App\Http\Controllers\AttendanceController::class, 'company'])->middleware('capability:users.view');
    });

    // Leave & Approvals
    Route::prefix('leave')->group(function () {
        Route::get('/', [\App\Http\Controllers\LeaveRequestController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\LeaveRequestController::class, 'store']);
        Route::post('/{id}/approve', [\App\Http\Controllers\LeaveRequestController::class, 'approve'])->middleware('capability:users.view');
        Route::post('/{id}/reject', [\App\Http\Controllers\LeaveRequestController::class, 'reject'])->middleware('capability:users.view');
    });

    // Projects & Tasks
    Route::prefix('projects')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProjectController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\ProjectController::class, 'show']);
        Route::post('/', [\App\Http\Controllers\ProjectController::class, 'store'])->middleware('capability:users.view');
    });
    
    Route::prefix('tasks')->group(function () {
        Route::get('/pending', [\App\Http\Controllers\TaskController::class, 'pending']);
        Route::post('/', [\App\Http\Controllers\TaskController::class, 'store'])->middleware('capability:users.view');
        Route::patch('/{id}/status', [\App\Http\Controllers\TaskController::class, 'updateStatus']);
        Route::post('/{id}/log-time', [\App\Http\Controllers\TaskController::class, 'logTime']);
    });

    // Chat & Notifications
    Route::prefix('chat')->group(function () {
        Route::get('/conversations', [\App\Http\Controllers\ChatController::class, 'conversations']);
        Route::get('/{conversationId}/messages', [\App\Http\Controllers\ChatController::class, 'messages']);
        Route::post('/{conversationId}/messages', [\App\Http\Controllers\ChatController::class, 'store']);
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::patch('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    });

    Route::prefix('announcements')->group(function () {
        Route::get('/', [\App\Http\Controllers\AnnouncementController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\AnnouncementController::class, 'store'])->middleware('capability:users.view');
    });

    // Reports
    Route::prefix('reports')->middleware('capability:users.view')->group(function () {
        Route::get('/{type}', [\App\Http\Controllers\ReportController::class, 'data']);
        Route::get('/{type}/export', [\App\Http\Controllers\ReportController::class, 'exportCsv']);
    });

    // Settings & Audit
    Route::prefix('settings')->middleware('capability:directory.view')->group(function () {
        Route::get('/', [\App\Http\Controllers\SettingsController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\SettingsController::class, 'update']);
    });

    Route::prefix('audit-logs')->middleware('capability:users.view')->group(function () {
        Route::get('/', [\App\Http\Controllers\AuditLogController::class, 'index']);
        Route::get('/export', [\App\Http\Controllers\AuditLogController::class, 'exportCsv']);
    });

    // Directory
    Route::get('/directory', [\App\Http\Controllers\DirectoryController::class, 'index'])->middleware('capability:directory.view');

    // Org Management
    Route::prefix('org')->group(function () {
        // Departments
        Route::apiResource('departments', \App\Http\Controllers\DepartmentController::class)->middleware('capability:departments.view');
        Route::post('departments/{department}/teams', [\App\Http\Controllers\DepartmentController::class, 'storeTeam'])->middleware('capability:departments.view');
        Route::delete('departments/{department}/teams/{team}', [\App\Http\Controllers\DepartmentController::class, 'destroyTeam'])->middleware('capability:departments.view');

        // Designations
        Route::apiResource('designations', \App\Http\Controllers\DesignationController::class)->middleware('capability:designations.view');

        // Users (HR / Employee Accounts)
        Route::apiResource('users', \App\Http\Controllers\UserController::class)->middleware('capability:users.view');
    });
});
