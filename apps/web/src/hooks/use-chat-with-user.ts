import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";

/**
 * Centralized hook to start a direct message conversation with a user.
 * Finds or creates a DM conversation, then navigates to the chat page.
 * Replaces duplicate implementations across the app.
 */
export function useChatWithUser() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (recipientId: number | string) => {
      return apiFetch("/conversations/dm", {
        method: "POST",
        body: JSON.stringify({ recipient_id: recipientId }),
      });
    },
    onSuccess: (conversation: any) => {
      if (isQueued(conversation)) return;
      
      const convId =
        conversation?.id ||
        conversation?.conversation_id ||
        (conversation?.data &&
          (conversation.data.id || conversation.data.conversation_id));
          
      if (convId) {
        router.push(`/dashboard/chat?conversation=${convId}`);
      } else {
        toast.error("Failed to open conversation: Invalid response.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation.");
    },
  });
}
