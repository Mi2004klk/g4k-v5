"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { AppIcon } from "@g4k/ui/components";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton, EmptyState, Avatar, AvatarFallback, AvatarImage, StatusBadge } from "@g4k/ui/components";
import { resolveAvatarUrl } from "@/lib/utils";
import { TasksTab } from "@/components/projects/tasks-tab";
import { LeaveTab } from "@/components/attendance/leave-tab";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";
import { useChatWithUser } from "@/hooks/use-chat-with-user";
import { useAuthStore } from "@/lib/auth-store";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export default function Employee360Page() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const currentUser = useAuthStore(state => state.user);
  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");
  const isSelf = currentUser?.id === Number(id);
  const canViewFull = canManageUsers || isSelf;

  const endpoint = canViewFull ? `/users/${id}` : `/directory/${id}`;

  const sendMessageMutation = useChatWithUser();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.user(Number(id)),
    queryFn: () => apiFetch(endpoint),
    enabled: !!id,
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => apiFetch(`/users/${id}/activity`),
    enabled: !!id && canViewFull,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4 md:p-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <EmptyState title="User not found" description="The employee record could not be loaded." />
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/directory")}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={() => router.push("/dashboard/directory")} className="gap-2 -ml-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          <AppIcon name="arrowLeft" size="sm" /> Back to Directory
        </Button>
      </div>

      {/* Banner & Header */}
      <div className="relative rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary-500/20 to-primary-600/10 dark:from-primary-900/30 dark:to-primary-800/10 w-full" />
        <div className="px-6 pb-6 pt-0 flex flex-col md:flex-row gap-6 md:items-end relative -top-12 md:-top-8">
          <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-neutral-900 shadow-sm shrink-0">
            <AvatarImage src={resolveAvatarUrl(user.avatar_url) || undefined} />
            <AvatarFallback className="text-xl">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              {user.name}
              <StatusBadge status={user.status} />
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              {user.designation?.name || "Employee"} • {user.department?.name || "No Department"}
            </p>
            <p className="text-sm text-neutral-500 flex items-center gap-2">
              <AppIcon name="mail" size="sm" /> {user.email || 'Hidden'}
              {user.phone && <span className="flex items-center gap-1 ml-3"><AppIcon name="phone" size="sm" /> {user.phone}</span>}
            </p>
          </div>

          <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
            <Button
              onClick={() => sendMessageMutation.mutate(user.id)}
              disabled={sendMessageMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
            >
              <AppIcon name="chat" size="sm" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-6 overflow-x-auto">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm">Profile</TabsTrigger>
          {canViewFull && <TabsTrigger value="attendance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm">Attendance</TabsTrigger>}
          {canViewFull && <TabsTrigger value="leave" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm">Leave</TabsTrigger>}
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm">Projects & Tasks</TabsTrigger>
          {canViewFull && <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 text-sm">Activity</TabsTrigger>}
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="profile" className="m-0">
            <div className={`grid grid-cols-1 ${canViewFull ? 'md:grid-cols-2' : ''} gap-6`}>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Personal Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-neutral-500">Employee ID</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.employee_id || 'N/A'}</dd></div>
                  <div className="flex justify-between"><dt className="text-neutral-500">Joined Date</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.joining_date ? new Date(user.joining_date).toLocaleDateString() : 'N/A'}</dd></div>
                  <div className="flex justify-between"><dt className="text-neutral-500">Birthday</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}</dd></div>
                </dl>
              </div>
              
              {canViewFull && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Emergency Contact</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-neutral-500">Name</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.emergency_contact_name || 'N/A'}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Phone</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.emergency_contact_phone || 'N/A'}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Relation</dt><dd className="font-medium text-neutral-900 dark:text-white">{user.emergency_contact_relation || 'N/A'}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </TabsContent>

          {canViewFull && (
            <TabsContent value="attendance" className="m-0">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                <AttendanceHistoryCalendar days={[]} userId={Number(id)} />
              </div>
            </TabsContent>
          )}

          {canViewFull && (
            <TabsContent value="leave" className="m-0">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                <LeaveTab userId={id} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="tasks" className="m-0">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
              <TasksTab userId={id} />
            </div>
          </TabsContent>

          {canViewFull && (
            <TabsContent value="activity" className="m-0">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {isLoadingActivity ? (
                    <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                  ) : activityData?.data?.length === 0 ? (
                    <EmptyState title="No activity" description="No recent actions recorded." icon={<AppIcon name="history" className="w-8 h-8 text-neutral-400" />} />
                  ) : (
                    activityData?.data?.map((log: any) => (
                      <div key={log.id} className="p-3 border border-neutral-100 dark:border-neutral-800 rounded-lg text-sm bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 mr-2">{log.action}</span>
                          <span className="text-neutral-600 dark:text-neutral-400">{log.subject_type}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{new Date(log.at).toLocaleString()} - IP: {log.ip_address || 'N/A'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
