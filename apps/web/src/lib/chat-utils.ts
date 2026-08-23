import { ChatConversation, ChatUser } from "@/components/chat/conversation-list";

/**
 * Checks if a chat conversation is pinned by the current user.
 */
export function isChatPinned(conversation: ChatConversation | undefined, currentUserId: number | undefined): boolean {
  if (!conversation || !currentUserId || !conversation.users) return false;
  const currentUserData = conversation.users.find((u: ChatUser) => u.id === currentUserId);
  if (!currentUserData) return false;
  
  const isPinned = (currentUserData as any).pivot?.is_pinned;
  return isPinned === 1 || isPinned === true;
}
