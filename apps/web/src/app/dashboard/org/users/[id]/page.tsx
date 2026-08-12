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
import { Skeleton, ConfirmDialog } from "@g4k/ui/components";
import { Pen, KeyRound, ShieldAlert, Trash2, MoreVertical, MessageSquare, ArrowLeft, Mail, Phone, UserCheck, Calendar, FileText, CheckSquare, Activity } from "lucide-react";
import { useUserActions } from "@/hooks/use-user-actions";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import Link from "next/link";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isPending } = useQuery({
    queryKey: ["user", Number(userId)],
    queryFn: () => apiFetch(`/users/${userId}`),
  });

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
    onSuccess: (conversation: any) => {
      router.push(`/dashboard/chat?conversation=${conversation.conversation_id || conversation.id}`);
    },
    onError: (err: any) => toast.error(err.message || "Failed to start chat."),
  });

  // Removed blocking isPending return to allow layout to handle loading

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
  });

  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations").then(res => res.data || []),
  });

  const { data: workSchedules = [] } = useQuery({
    queryKey: queryKeys.workSchedules,
    queryFn: () => apiFetch("/work-schedules").then(res => res.data || []),
  });

  const {
    confirmState, setConfirmState,
    isEditOpen, setIsEditOpen,
    editingUser, setEditingUser,
    updateMutation, statusMutation, deleteMutation, resetPasswordMutation
  } = useUserActions();

  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  const onSubmitEdit = (data: any) => {
    updateMutation.mutate({ id: editingUser.id, payload: data });
  };

  return (
    <PageContainer
      title="Employee Profile"
      description="View detailed information, attendance, and activity history."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button 
            onClick={() => sendMessageMutation.mutate(Number(userId))}
            variant="outline" 
            className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            disabled={sendMessageMutation.isPending}
          >
            <MessageSquare className="w-4 h-4" /> Send Message
          </Button>
          {canManageUsers && (
            <>
              <Button onClick={() => { setEditingUser(user); setIsEditOpen(true); }} className="gap-2 bg-neutral-900 text-white">
                <Pen className="w-4 h-4" /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "reset-password", payload: user })} className="gap-2">
                    <KeyRound className="w-4 h-4" /> Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "status", payload: user })} className="gap-2">
                    <ShieldAlert className="w-4 h-4" /> {user.status === "active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: user })} className="gap-2 text-rose-600">
                    <Trash2 className="w-4 h-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar size="lg" className="w-24 h-24">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback name={user.name} className="text-2xl" />
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">{user.name}</h2>
                <p className="text-violet-600 font-medium mb-4">{user.designation?.name || "Employee"} • {user.department?.name || "No Department"}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</div>
                  {user.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {user.phone}</div>}
                  <div className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Code: {user.employee_code || user.employee_id || "N/A"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-neutral-100/50 dark:bg-neutral-900 overflow-x-auto flex-nowrap justify-start h-auto p-1 mb-6">
            <TabsTrigger value="profile" className="gap-2 py-2.5"><UserCheck className="w-4 h-4" /> Personal Info</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 py-2.5"><Calendar className="w-4 h-4" /> Attendance</TabsTrigger>
            <TabsTrigger value="leave" className="gap-2 py-2.5"><FileText className="w-4 h-4" /> Leave History</TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 py-2.5"><CheckSquare className="w-4 h-4" /> Projects & Tasks</TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 py-2.5"><Activity className="w-4 h-4" /> Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
             <Card className="border-none shadow-sm"><CardHeader><CardTitle>Profile Info</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div><span className="text-neutral-500 block mb-1">Email</span><span className="font-medium">{user.email}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Phone</span><span className="font-medium">{user.phone || "N/A"}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Status</span><span className="font-medium capitalize">{user.status}</span></div>
                  <div><span className="text-neutral-500 block mb-1">Joined Date</span><span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span></div>
                </div>
             </CardContent></Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <Card className="border-none shadow-sm"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent>
                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg border mb-4">
                  <div>
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">Attendance Record</h4>
                    <p className="text-sm text-neutral-500">View detailed attendance history, timesheets, and daily logs for this user.</p>
                  </div>
                  <Link href={`/dashboard/admin/attendance?search=${user.name}`}>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" /> Go to Admin Attendance
                    </Button>
                  </Link>
                </div>
                
                <UserAttendanceView userId={Number(userId)} />
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="leave" className="mt-0">
            <Card className="border-none shadow-sm"><CardHeader><CardTitle>Leave History</CardTitle></CardHeader><CardContent>
               {leaves?.data?.length ? (
                 <div className="space-y-4">
                   {leaves.data.map((l: any) => (
                      <div key={l.id} className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium capitalize">{l.type.replace('_', ' ')} Leave</span>
                          <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${l.approval?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.approval?.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{l.approval?.status || 'pending'}</span>
                        </div>
                        <div className="text-sm text-neutral-500">From {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                        {l.reason && <div className="text-xs mt-2 text-neutral-600">Reason: {l.reason}</div>}
                      </div>
                   ))}
                 </div>
               ) : <div className="text-sm text-neutral-500">No leave requests found.</div>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <Card className="border-none shadow-sm"><CardHeader><CardTitle>Assignments</CardTitle></CardHeader><CardContent>
               <h3 className="font-bold mb-3">Projects ({assignments?.projects?.length || 0})</h3>
               {assignments?.projects?.length > 0 ? (
                 <div className="flex flex-wrap gap-2 mb-6">
                   {assignments.projects.map((p: any) => <span key={p.id} className="px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-md text-sm">{p.name}</span>)}
                 </div>
               ) : <p className="text-sm text-neutral-500 mb-6">No active projects.</p>}
               
               <h3 className="font-bold mb-3">Tasks ({assignments?.tasks?.length || 0})</h3>
               {assignments?.tasks?.length > 0 ? (
                 <div className="space-y-2">
                   {assignments.tasks.map((t: any) => (
                     <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                       <div><span className="font-medium">{t.title}</span><span className="text-neutral-500 block text-xs">{t.project?.name}</span></div>
                       <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs capitalize">{t.status.replace('_', ' ')}</span>
                     </div>
                   ))}
                 </div>
               ) : <p className="text-sm text-neutral-500">No assigned tasks.</p>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="border-none shadow-sm"><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent>
               {activity?.data?.length ? (
                 <div className="space-y-3">
                   {activity.data.map((log: any) => (
                      <div key={log.id} className="p-3 border rounded-lg text-sm bg-neutral-50 dark:bg-neutral-900/50">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.subject_type || log.entity_type}</span>
                        <span className="text-xs text-neutral-500 block mt-1">{new Date(log.at || log.created_at).toLocaleString()} - IP: {log.ip || 'N/A'}</span>
                      </div>
                   ))}
                 </div>
               ) : <div className="text-sm text-neutral-500">No recent activity.</div>}
            </CardContent></Card>
          </TabsContent>

        </Tabs>
      </div>

      {isEditOpen && editingUser && (
        <UserEditDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={editingUser}
          departments={departments}
          designations={designations}
          work_schedules={workSchedules}
          onSubmit={onSubmitEdit}
          isPending={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title={confirmState.type === "delete" ? "Delete User" : confirmState.type === "status" ? "Change Status" : "Reset Password"}
        description={
          confirmState.type === "delete"
            ? `Are you sure you want to delete ${confirmState.payload?.name}? This action cannot be undone.`
            : confirmState.type === "status"
            ? `Are you sure you want to ${confirmState.payload?.status === 'active' ? 'deactivate' : 'activate'} ${confirmState.payload?.name}?`
            : `Are you sure you want to reset the password for ${confirmState.payload?.name} to the system default?`
        }
        confirmText={confirmState.type === "delete" ? "Delete" : "Confirm"}
        onConfirm={() => {
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
          else if (confirmState.type === "status") statusMutation.mutate({ id: confirmState.payload.id, status: confirmState.payload.status === "active" ? "inactive" : "active" });
          else if (confirmState.type === "reset-password") resetPasswordMutation.mutate(confirmState.payload.id);
        }}
        isDestructive={confirmState.type === "delete"}
      />
    </PageContainer>
  );
}

function UserAttendanceView({ userId }: { userId: number }) {
  const { data: historyData, isLoading } = useQuery({
    queryKey: queryKeys.memberHistory(userId),
    queryFn: () => apiFetch(`/attendance/hr/history/${userId}`),
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Skeleton className="w-full h-64" /></div>;
  }

  const days = historyData?.days || [];

  return (
    <div className="mt-4">
      <AttendanceHistoryCalendar days={days} userId={userId} />
    </div>
  );
}
