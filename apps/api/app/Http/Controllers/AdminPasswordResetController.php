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

        $user = User::find($resetRequest->user_id);
        if ($user) {
            $token = Str::random(60);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $resetLink = rtrim($frontendUrl, '/') . "/reset-password?token={$token}&email=" . urlencode($user->email);

            Notification::create([
                'user_id' => $user->id,
                'title' => 'Password Reset Approved',
                'body' => "Your password reset request was approved. You can reset it here: {$resetLink}",
                'type' => 'security',
                'priority' => 'urgent',
            ]);
        }

        return response()->json([
            'message' => 'Password reset request approved',
            'reset_link' => $resetLink ?? null
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

        Notification::create([
            'user_id' => $resetRequest->user_id,
            'title' => 'Password Reset Rejected',
            'body' => "Your password reset request was rejected by an administrator.",
            'type' => 'security',
            'priority' => 'normal',
        ]);

        return response()->json(['message' => 'Password reset request rejected']);
    }
}
