"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@g4k/ui/components";
import { Skeleton, ConfirmDialog, EmptyState } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { useUserActions } from "@/hooks/use-user-actions";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import Link from "next/link";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";
import { usePins } from "@/hooks/use-pins";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isPending, isError, refetch } = useQuery({
    queryKey: ["user", Number(userId)],
    queryFn: () => apiFetch(`/users/${userId}`),
  });
  
  const { data: capabilities } = useCapabilities();

  const { data: leaves } = useQuery({
    queryKey: ["user-leaves", userId],
    queryFn: () => apiFetch(`/users/${userId}/leave-history`),
  });

  const { data: assignments } = useQuery({
    queryKey: ["user-assignments", userId],
    queryFn: () => apiFetch(`/users/${userId}/assignments`),
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.userActivity(Number(userId)),
    queryFn: () => apiFetch(`/users/${userId}/activity`),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (recipientId: number) => apiFetch("/conversations/dm", {
      method: "POST",
      body: JSON.stringify({ recipient_id: recipientId }),
    }),
    onSuccess: (conversation: { conversation_id?: string | number, id?: string | number }) => {
      router.push(`/dashboard/chat?conversation=${conversation.conversation_id || conversation.id}`);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to start chat."),
  });

  const { pins, pin, unpin, isPinning, isUnpinning } = usePins();
  const pinnedItem = pins?.find(p => p.type === 'user' && p.target_id === String(userId));
  const isPinned = !!pinnedItem;

  const handlePinClick = () => {
    if (isPinned && pinnedItem) {
      unpin(pinnedItem.id);
    } else {
      pin({
        type: 'user',
        target_id: String(userId),
        label: user?.name || "Employee",
        href: `/dashboard/org/users/${userId}`,
        icon: 'userCheck'
      });
    }
  };

  // Removed blocking isPending return to allow layout to handle loading

  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res: { data?: unknown[] }) => Array.isArray(res?.data) ? res.data : []),
    enabled: canManageUsers,
  });

  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations").then((res: { data?: unknown[] }) => Array.isArray(res?.data) ? res.data : []),
    enabled: canManageUsers,
  });

  const { data: workSchedules = [] } = useQuery({
    queryKey: queryKeys.workSchedules,
    queryFn: () => apiFetch("/work-schedules").then((res: { data?: unknown[] }) => Array.isArray(res?.data) ? res.data : []),
    enabled: hasCapability(capabilities, "settings.manage") || hasCapability(capabilities, "users.hr.manage"),
  });

  const {
    confirmState, setConfirmState,
    isEditOpen, setIsEditOpen,
    editingUser, setEditingUser,
    updateMutation, statusMutation, deleteMutation, restoreMutation, resetPasswordMutation
  } = useUserActions();

  if (isPending) {
    return (
      <PageContainer title="Employee Profile" description="Loading profile...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Employee Profile" description="Failed to load profile.">
        <div className="p-8 text-center bg-card dark:bg-neutral-900 border rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150">
          <AppIcon name="audit" size="2xl" className=" text-rose-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Failed to load user</h3>
          <p className="text-xs text-neutral-500 mb-4">The user could not be found or you don&apos;t have permission.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  const onSubmitEdit = (data: Record<string, unknown>) => {
    updateMutation.mutate({ id: (editingUser as any).id, payload: data });
  };

  return (
    <PageContainer
      title="Employee Profile"
      description="View detailed information, attendance, and activity history."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <AppIcon name="arrowLeft" /> Back
          </Button>
          <Button 
            onClick={() => sendMessageMutation.mutate(Number(userId))}
            variant="outline" 
            className="gap-2 text-primary-600 border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            disabled={sendMessageMutation.isPending}
          >
            <AppIcon name="chat" /> Send Message
          </Button>
          {canManageUsers && (
            <>
              <Button onClick={() => { setEditingUser(user); setIsEditOpen(true); }} className="gap-2 bg-neutral-900 text-white">
                <AppIcon name="edit" /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><AppIcon name="more" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.deleted_at ? (
                    <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "restore", payload: user })} className="gap-2 text-emerald-600 font-medium">
                      <AppIcon name="history" /> Restore User
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "reset-password", payload: user })} className="gap-2">
                        <AppIcon name="key" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "status", payload: user })} className="gap-2">
                        <AppIcon name="audit" /> {user.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: user })} className="gap-2 text-rose-600">
                        <AppIcon name="trash" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 bg-card dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar size="lg" className="w-24 h-24">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback name={user.name} className="text-2xl" />
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">{user.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"}`}
                    onClick={handlePinClick}
                    disabled={isPinning || isUnpinning}
                  >
                    <AppIcon name="star" className="h-5 w-5 shrink-0" />
                  </Button>
                </div>
                <p className="text-primary-600 font-medium mb-4">{user.designation?.name || "Employee"} • {user.department?.name || "No Department"}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-2"><AppIcon name="mail" /> {user.email}</div>
                  {user.phone && <div className="flex items-center gap-2"><AppIcon name="phone" /> {user.phone}</div>}
                  <div className="flex items-center gap-2"><AppIcon name="userCheck" /> Code: {user.employee_code || user.employee_id || "N/A"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-neutral-100/50 dark:bg-neutral-900 overflow-x-auto flex-nowrap justify-start h-auto p-1 mb-6">
            <TabsTrigger value="profile" className="gap-2 py-2.5"><AppIcon name="userCheck" /> Personal Info</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 py-2.5"><AppIcon name="calendar" /> Attendance</TabsTrigger>
            <TabsTrigger value="leave" className="gap-2 py-2.5"><AppIcon name="fileText" /> Leave History</TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 py-2.5"><AppIcon name="tasks" /> Projects & Tasks</TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 py-2.5"><AppIcon name="activity" /> Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
             <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150"><CardHeader><CardTitle>Profile Info</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div><span className="text-neutral-500 block mb-1">Email</span><span className="font-medium">{user.email}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Phone</span><span className="font-medium">{user.phone || "N/A"}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Status</span><span className="font-medium capitalize">{user.status}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Joined Date</span><span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span></div>
                </div>
             </CardContent></Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent>
                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-[var(--radius)] border mb-4">
                  <div>
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">Attendance Record</h4>
                    <p className="text-sm text-neutral-500">View detailed attendance history, timesheets, and daily logs for this user.</p>
                  </div>
                  {hasCapability(capabilities, "admin.view-all-attendance") && (
                    <Link href={`/dashboard/org/attendance?search=${user.name}`}>
                      <Button variant="outline" className="gap-2">
                        <AppIcon name="calendar" /> Go to Admin Attendance
                      </Button>
                    </Link>
                  )}
                </div>
                
                <UserAttendanceView userId={Number(userId)} />
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="leave" className="mt-0">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150"><CardHeader><CardTitle>Leave History</CardTitle></CardHeader><CardContent>
               {leaves?.data?.length ? (
                 <div className="space-y-4">
                   {leaves.data.map((l: { id: number; type: string; start_date: string; end_date: string; reason?: string; approval?: { status: string } }) => (
                      <div key={l.id} className="p-4 border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium capitalize">{l.type.replace('_', ' ')} Leave</span>
                          <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${l.approval?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.approval?.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{l.approval?.status || 'pending'}</span>
                        </div>
                        <div className="text-sm text-neutral-500">From {l.start_date ? new Date(l.start_date).toLocaleDateString() : 'N/A'} to {l.end_date ? new Date(l.end_date).toLocaleDateString() : 'N/A'}</div>
                        {l.reason && <div className="text-xs mt-2 text-neutral-600">Reason: {l.reason}</div>}
                      </div>
                   ))}
                 </div>
               ) : (
                 <EmptyState title="No Leave Requests" description="This user has not submitted any leave requests." icon="calendar" />
               )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150"><CardHeader><CardTitle>Assignments</CardTitle></CardHeader><CardContent>
               <h3 className="font-bold mb-3">Projects ({assignments?.projects?.length || 0})</h3>
               {assignments?.projects?.length > 0 ? (
                 <div className="flex flex-wrap gap-2 mb-6">
                   {assignments.projects.map((p: { id: number; name: string }) => <span key={p.id} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-[var(--radius)] text-sm">{p.name}</span>)}
                 </div>
               ) : (
                 <EmptyState title="No Projects" description="No active projects assigned." icon="folder" className="mb-6 p-4" />
               )}
               
               <h3 className="font-bold mb-3">Tasks ({assignments?.tasks?.length || 0})</h3>
               {assignments?.tasks?.length > 0 ? (
                 <div className="space-y-2">
                   {assignments.tasks.map((t: { id: number; title: string; project?: { name: string }; status: string }) => (
                     <div key={t.id} className="flex items-center justify-between p-3 border rounded-[var(--radius)] text-sm">
                       <div><span className="font-medium">{t.title}</span><span className="text-neutral-500 block text-xs">{t.project?.name}</span></div>
                       <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs capitalize">{t.status.replace('_', ' ')}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <EmptyState title="No Tasks" description="No assigned tasks." icon="checkCircle" className="p-4" />
               )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150"><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent>
               {activity?.data?.length ? (
                 <div className="space-y-3">
                   {activity.data.map((log: { id: number; action: string; subject_type?: string; entity_type?: string; at?: string; created_at?: string; ip_address?: string }) => (
                      <div key={log.id} className="p-3 border rounded-[var(--radius)] text-sm bg-neutral-50 dark:bg-neutral-900/50">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.subject_type || log.entity_type}</span>
                        <span className="text-xs text-neutral-500 block mt-1">{new Date(log.at || log.created_at || "").toLocaleString()} - IP: {log.ip_address || 'N/A'}</span>
                      </div>
                   ))}
                 </div>
               ) : (
                 <EmptyState title="No Activity" description="No recent activity logged for this user." icon="activity" />
               )}
            </CardContent></Card>
          </TabsContent>

        </Tabs>
      </div>

      {isEditOpen && !!editingUser && (
        <UserEditDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={editingUser as any}
          departments={departments as any}
          designations={designations as any}
          work_schedules={workSchedules as any}
          onSubmit={onSubmitEdit}
          isPending={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title={confirmState.type === "delete" ? "Delete User" : confirmState.type === "restore" ? "Restore User" : confirmState.type === "status" ? "Change Status" : "Reset Password"}
        description={
          confirmState.type === "delete"
            ? `Are you sure you want to delete ${(confirmState.payload as any)?.name}? This action cannot be undone.`
            : confirmState.type === "restore"
            ? `Are you sure you want to restore ${(confirmState.payload as any)?.name}? Their account will be reactivated.`
            : confirmState.type === "status"
            ? `Are you sure you want to ${(confirmState.payload as any)?.status === 'active' ? 'deactivate' : 'activate'} ${(confirmState.payload as any)?.name}?`
            : `Are you sure you want to reset the password for ${(confirmState.payload as any)?.name} to the system default?`
        }
        confirmText={confirmState.type === "delete" ? "Delete" : confirmState.type === "restore" ? "Restore" : "Confirm"}
        onConfirm={() => {
          if (confirmState.type === "delete") deleteMutation.mutate((confirmState.payload as any).id);
          else if (confirmState.type === "restore") restoreMutation.mutate((confirmState.payload as any).id);
          else if (confirmState.type === "status") statusMutation.mutate({ id: (confirmState.payload as any).id, status: (confirmState.payload as any).status === "active" ? "inactive" : "active" });
          else if (confirmState.type === "reset-password") resetPasswordMutation.mutate((confirmState.payload as any).id);
        }}
        isLoading={deleteMutation.isPending || statusMutation.isPending || restoreMutation.isPending || resetPasswordMutation.isPending}
        isDestructive={confirmState.type === "delete"}
      />
    </PageContainer>
  );
}

function UserAttendanceView({ userId }: { userId: number }) {
  const { data: historyData, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.memberHistory(userId),
    queryFn: () => apiFetch(`/attendance/hr/history/${userId}?limit=365`),
    enabled: !!userId,
    retry: false,
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Skeleton className="w-full h-64" /></div>;
  }

  if (isError) {
    const e = error as { status?: number, message?: string };
    const isForbidden = e?.status === 403 || e?.message?.toLowerCase().includes("unauthorized");
    return (
      <div className="p-8 mt-4 text-center border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900/50">
        <AppIcon name="key" size="2xl" className="text-neutral-400 mx-auto mb-2" />
        <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Access Denied</h4>
        <p className="text-sm text-neutral-500 mt-1">
          {isForbidden ? "You do not have permission to view attendance history for this user." : "Failed to load attendance history."}
        </p>
      </div>
    );
  }

  const days = historyData?.data || [];

  return (
    <div className="mt-4">
      <AttendanceHistoryCalendar days={days} userId={userId} />
    </div>
  );
}
