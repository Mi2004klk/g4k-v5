"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Building2, Mail, Phone, UserCheck, ArrowLeft, Calendar, FileText, CheckSquare, Activity } from "lucide-react";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";

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

  // Removed blocking isPending return to allow layout to handle loading

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  return (
    <PageContainer
      title="Employee Profile"
      description="View detailed information, attendance, and activity history."
      actions={
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
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
                <p className="text-sm text-neutral-500 mb-4">Detailed attendance tracking is available on the main Attendance dashboard.</p>
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
                        <span className="text-xs text-neutral-500 block mt-1">{new Date(log.at || log.created_at).toLocaleString()} - IP: {log.ip_address}</span>
                      </div>
                   ))}
                 </div>
               ) : <div className="text-sm text-neutral-500">No recent activity.</div>}
            </CardContent></Card>
          </TabsContent>

        </Tabs>
      </div>
    </PageContainer>
  );
}
