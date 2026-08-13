"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { ChatTab } from "@/components/chat/chat-tab";
import { NotificationsTab } from "@/components/chat/notifications-tab";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";

export default function ChatModulePage() {
  const [tab, setTab] = useUrlState("tab", "chat");

  return (
    <PageContainer
      title="Communications & Inbox"
      description="Access chats, view announcements, and manage notifications in one place."
    >
      <ErrorBoundary>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <ChatTab />
          </TabsContent>

          <TabsContent value="announcements" className="mt-0 space-y-6">
            <div className="max-w-4xl pt-4">
              <AnnouncementBoard />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </PageContainer>
  );
}
