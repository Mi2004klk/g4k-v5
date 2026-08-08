<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;
        
        $conversations = DB::table('conversations')
            ->join('conversation_user', 'conversations.id', '=', 'conversation_user.conversation_id')
            ->where('conversation_user.user_id', $userId)
            ->select('conversations.*')
            ->get();
            
        return response()->json(['data' => $conversations]);
    }

    public function messages(Request $request, $conversationId)
    {
        // Enforce membership (omitted for brevity)
        $messages = DB::table('messages')
            ->join('users', 'users.id', '=', 'messages.sender_id')
            ->where('conversation_id', $conversationId)
            ->select('messages.*', 'users.name as sender_name')
            ->orderBy('created_at', 'asc')
            ->get();
            
        return response()->json(['data' => $messages]);
    }

    public function store(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'body' => 'required|string'
        ]);

        $id = DB::table('messages')->insertGetId([
            'conversation_id' => $conversationId,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Normally, dispatch Reverb/Pusher Event here:
        // broadcast(new MessageSent($message))->toOthers();

        return response()->json(['data' => DB::table('messages')->where('id', $id)->first()], 201);
    }
}
