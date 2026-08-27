<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PasswordResetRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminPasswordResetController extends Controller
{
    public function index()
    {
        return PasswordResetRequest::with('user:id,name,email,employee_id')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    public function approve(Request $request, $id)
    {
        $resetRequest = PasswordResetRequest::findOrFail($id);
        
        if ($resetRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 400);
        }

        $resetRequest->status = 'approved';
        $resetRequest->admin_id = $request->user()->id;
        $resetRequest->save();

        $user = User::findOrFail($resetRequest->user_id);
        
        $token = Str::random(60);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        if (\App\Support\SmtpSettings::isConfigured()) {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($token, $user->email));
        }

        \App\Services\NotificationService::send(
            $user->id,
            'security',
            'Password Reset Approved',
            "Your password reset request was approved. Please check your email for the reset link.",
            null,
            '/dashboard',
            'urgent'
        );

        \App\Services\AuditLogger::log(
            $request,
            'approve',
            'password_reset_request',
            $resetRequest->id,
            ['status' => 'pending'],
            ['status' => 'approved', 'admin_id' => $request->user()->id]
        );

        return response()->json([
            'message' => 'Password reset request approved'
        ]);
    }

    public function reject(Request $request, $id)
    {
        $resetRequest = PasswordResetRequest::findOrFail($id);
        
        if ($resetRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 400);
        }

        $resetRequest->status = 'rejected';
        $resetRequest->admin_id = $request->user()->id;
        $resetRequest->save();

        \App\Services\NotificationService::send(
            $resetRequest->user_id,
            'security',
            'Password Reset Rejected',
            "Your password reset request was rejected by an administrator.",
            null,
            '/dashboard'
        );

        \App\Services\AuditLogger::log(
            $request,
            'reject',
            'password_reset_request',
            $resetRequest->id,
            ['status' => 'pending'],
            ['status' => 'rejected', 'admin_id' => $request->user()->id]
        );

        return response()->json(['message' => 'Password reset request rejected']);
    }
}
