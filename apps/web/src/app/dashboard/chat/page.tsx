"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Globe, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { FeedbackForm } from "@/components/widgets/feedback-form";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { subscribe } = useReverb();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/conversations"),
  });

  const { data: messageData } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => apiFetch(`/conversations/${selectedId}/messages`),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (!selectedId) return;

    const channel = subscribe(`conversation.${selectedId}`);
    if (channel) {
      channel.bind("message-sent", (e: any) => {
        queryClient.setQueryData(["messages", selectedId], (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: [...old.data, e.message],
          };
        });
      });
    }
  }, [selectedId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiFetch(`/conversations/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const messages = messageData?.data || [];
  const selectedConv = conversations.find((c: any) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Communication Hub</h1>
        <p className="text-sm text-neutral-500 mt-1">Real-time chats, company announcements & feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex h-[600px] overflow-hidden">
          {/* Conversation sidebar */}
          <div className="w-1/3 border-r border-neutral-100 dark:border-neutral-800 flex flex-col">
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
              Chats
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />
            </div>
          </div>

          {/* Active conversation panel */}
          <div className="flex-1 flex flex-col bg-neutral-50/30 dark:bg-neutral-950/20">
            {selectedId ? (
              <>
                <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {selectedConv?.name || "Conversation"}
                  </h3>
                </div>

                <MessageList messages={messages} currentUserId={user?.id || 0} />

                <MessageComposer
                  onSend={(body) => sendMessageMutation.mutate(body)}
                  disabled={sendMessageMutation.isPending}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                <MessageSquare className="w-10 h-10 text-neutral-300 mb-2" />
                <p className="text-xs font-medium">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <AnnouncementBoard />
          <QuickNotes />
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
