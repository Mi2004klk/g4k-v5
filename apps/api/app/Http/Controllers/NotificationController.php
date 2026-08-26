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
            ->orderByRaw('CASE WHEN read_at IS NULL THEN 0 ELSE 1 END')
            ->orderBy('created_at', 'desc');
            
        if ($request->query('unreadOnly') === 'true') {
            $query->whereNull('read_at');
        }

        if ($request->query('importantOnly') === 'true') {
            $query->whereIn('priority', ['high', 'urgent']);
        }

        if ($request->query('bell') === 'true') {
            $query->where(function($q) {
                $q->whereIn('priority', ['high', 'urgent'])
                  ->orWhere('type', 'system');
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('lower(title) like ?', ["%{$search}%"])
                  ->orWhereRaw('lower(body) like ?', ["%{$search}%"]);
            });
        }

        $request->validate(['per_page' => 'nullable|integer|in:20,50,100']);
        $perPage = $request->input('per_page', 50);
        return response()->json($query->paginate($perPage));
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
            
        $highPriorityCount = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereIn('priority', ['high', 'urgent'])
            ->count();
            
        return response()->json([
            'count' => $count,
            'high_priority_count' => $highPriorityCount
        ]);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
            
        return response()->json(['status' => 'success']);
    }
}
