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
            
        if ($request->query('unreadOnly') === 'true') {
            $query->whereNull('read_at');
        }

        return response()->json($query->paginate(50));
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

    public function markUnread(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update(['read_at' => null]);

        return response()->json($notification);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();
            
        return response()->json(['count' => $count]);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
            
        return response()->json(['status' => 'success']);
    }
}
