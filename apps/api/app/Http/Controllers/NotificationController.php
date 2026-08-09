<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        return response()->json($query->cursorPaginate(50));
    }

    public function markRead(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }
}
