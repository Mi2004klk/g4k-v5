"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary, AppIcon } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { ChatTab } from "@/components/chat/chat-tab";
import { NotificationsTab } from "@/components/chat/notifications-tab";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { PersonalRemindersWidget } from "@/components/widgets/personal-reminders-widget";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export default function ChatModulePage() {
  const [tab, setTab] = useUrlState("tab", "chat");

  const { data: notificationsCountData } = useQuery({
    queryKey: queryKeys.notificationsUnreadCount,
    queryFn: () => apiFetch("/notifications/unread-count"),
  });
  const unreadNotifications = notificationsCountData?.count || 0;

  return (
    <PageContainer
      title="Communications & Inbox"
      description="Access chats, view announcements, and manage notifications in one place."
    >
      <ErrorBoundary resetKeys={[tab]}>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 overflow-x-auto h-auto p-0 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none w-full justify-start gap-6 no-scrollbar">
            <TabsTrigger value="chat" className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2.5 text-xs font-semibold text-neutral-500 data-[state=active]:text-primary-600 hover:text-neutral-700 transition-colors flex items-center gap-2">
              <AppIcon name="chat" size="xs" /> Chat
            </TabsTrigger>
            <TabsTrigger value="announcements" className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2.5 text-xs font-semibold text-neutral-500 data-[state=active]:text-primary-600 hover:text-neutral-700 transition-colors flex items-center gap-2">
              <AppIcon name="bell" size="xs" /> Announcements & Reminders
            </TabsTrigger>
            <TabsTrigger value="notifications" className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2.5 text-xs font-semibold text-neutral-500 data-[state=active]:text-primary-600 hover:text-neutral-700 transition-colors flex items-center gap-2">
              <AppIcon name="bell" size="xs" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="flex items-center justify-center bg-rose-500 text-white text-xs font-bold h-4 w-4 rounded-full ml-0.5">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <ChatTab />
          </TabsContent>

          <TabsContent value="announcements" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="col-span-1 lg:col-span-2">
                <AnnouncementBoard />
              </div>
              <div className="col-span-1">
                <PersonalRemindersWidget />
              </div>
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
