"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { safeFormat } from "@/lib/format";
import { AppIcon } from "@g4k/ui/components";
import { QAFormViewer } from "@/components/projects/qa-form-viewer";
import { toast } from "sonner";
import { apiFetch, unwrapOne, unwrapList, isQueued } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Button, Textarea, Skeleton, Avatar, AvatarFallback } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { resolveAvatarUrl } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

interface ProjectOverviewTabProps {
  projectId: string;
}

export function ProjectOverviewTab({ projectId }: ProjectOverviewTabProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { data: caps } = useCapabilities();
  const [submissionNote, setSubmissionNote] = useState("");
  const [qaValues, setQaValues] = useState<Record<string, unknown>>({});

  const { data: projectResponse } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiFetch(`/projects/${projectId}`),
  });
  const { data: historyResponse } = useQuery({
    queryKey: [...queryKeys.project(projectId), "history"],
    queryFn: () => apiFetch(`/projects/${projectId}/history`),
  });

  const projectHistory = unwrapList(historyResponse);
  const historyParentRef = useRef<HTMLDivElement>(null);
  const project: any = unwrapOne(projectResponse);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: projectHistory.length,
    getScrollElement: () => historyParentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const submitProjectMutation = useMutation({
    mutationFn: async () => {
      const missingQaLabels = (project?.qa_form?.fields || [])
        .filter((field: any) => field.required && !String(qaValues[field.id] ?? "").trim())
        .map((field: any) => field.label);
        
      if (project?.qa_form_id && missingQaLabels.length > 0) {
        throw new Error(`Please fill in the required QA fields.`);
      }
      return apiFetch(`/projects/${projectId}/submit`, {
        method: "POST",
        body: JSON.stringify({ 
          notes: submissionNote,
          qa_values: Object.keys(qaValues).length > 0 ? qaValues : null,
        }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Project submitted for review.");
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      setSubmissionNote("");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to submit project.");
    },
  });

  const reviewProjectMutation = useMutation({
    mutationFn: async (decision: "approved" | "redo") => {
      return apiFetch(`/projects/${projectId}/review`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
    },
    onSuccess: (_, decision) => {
      if (isQueued(_)) return;
      toast.success(`Project ${decision === 'approved' ? 'approved' : 'sent back for rework'}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Review failed.");
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
      <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
        <Card className="flex flex-col h-full border-none shadow-e1 hover:shadow-e2 transition-shadow overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="py-4 px-5 border-b border-neutral-100 dark:border-neutral-800/50">
            <CardTitle className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <AppIcon name="activity" className="text-primary-500" size="sm" />
              Activity & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col min-h-0">
            <div className="flex flex-col gap-6 h-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 dark:bg-neutral-950/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">Time Spent</span>
                  <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                    {project?.total_time_hours || 0} <span className="text-xs font-semibold text-neutral-500">hrs</span>
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">Tasks Done</span>
                  <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                    {project ? `${project.completed_tasks_count || 0}` : <Skeleton className="h-6 w-8" />}
                    <span className="text-xs font-semibold text-neutral-500 ml-1">/ {project?.total_tasks_count || 0}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">Team</span>
                  <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                    {project?.members?.length || 0} <span className="text-xs font-semibold text-neutral-500">members</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-[250px] border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden">
                <div className="bg-neutral-50/80 dark:bg-neutral-950/40 py-2.5 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
                  <h3 className="font-bold text-[12px] uppercase tracking-wider text-neutral-500">Activity Log</h3>
                </div>
                <div ref={historyParentRef} className="flex-1 overflow-auto bg-white dark:bg-neutral-900 relative">
                  {projectHistory?.length > 0 ? (
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const h = projectHistory[virtualItem.index] as { user?: { name: string, avatar_url?: string }, event?: string, created_at: string };
                        return (
                          <div 
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualItem.start}px)`
                            }}
                            className="flex items-start gap-3 py-3 px-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800/30 group"
                          >
                            <Avatar className="w-8 h-8 shrink-0 border border-neutral-200/50 dark:border-neutral-800/50">
                              {h.user?.avatar_url && <img src={resolveAvatarUrl(h.user.avatar_url)} alt={h.user?.name} />}
                              <AvatarFallback name={h.user?.name || "?"} className="text-xs" />
                            </Avatar>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-tight">
                                <span className="font-bold text-neutral-900 dark:text-white mr-1">{h.user?.name}</span> 
                                {h.event}
                              </span>
                              <span className="text-neutral-400 font-medium text-xs flex items-center gap-1">
                                <AppIcon name="clock" className="w-3 h-3" />
                                {format(new Date(h.created_at), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                      <AppIcon name="history" className="w-8 h-8 opacity-20" />
                      <span className="text-[13px] font-medium">No history recorded yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow bg-white dark:bg-neutral-900">
          <CardHeader className="py-4 px-5 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-950/20">
            <CardTitle className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppIcon name="users" className="text-blue-500" size="sm" />
                Team Members
              </div>
              <Badge variant="secondary" className="px-2 py-0.5 text-xs rounded-full">
                {project?.members?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {project?.members && project.members.length > 0 ? (
                project.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <Avatar className="w-9 h-9 border border-neutral-200/50 dark:border-neutral-800 shadow-sm">
                      {member.avatar_url && <img src={resolveAvatarUrl(member.avatar_url)} alt={member.name} />}
                      <AvatarFallback name={member.name} className="text-xs font-bold" />
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight truncate">{member.name}</span>
                      <span className="text-xs text-neutral-500 font-medium capitalize mt-0.5 truncate">{member.active_role?.replace("_", " ") || "Employee"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[13px] text-neutral-400 font-medium flex flex-col items-center gap-2">
                  <AppIcon name="users" className="w-6 h-6 opacity-20" />
                  No team members assigned
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow bg-primary-50/50 dark:bg-primary-950/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 z-10" />
          <CardHeader className="py-4 px-5 border-b border-primary-100 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20">
            <CardTitle className="text-[14px] font-bold text-primary-800 dark:text-primary-400 flex items-center gap-2">
              <AppIcon name="success" size="sm" /> Project Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {project?.status !== "completed" && project?.status !== "review" && (
              <div className="space-y-5">
                {project?.qa_form && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                      <span>QA Checklist: <span className="text-primary-600 dark:text-primary-400">{project.qa_form.title}</span></span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary-200 text-primary-600 bg-white">Required</Badge>
                    </h4>
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-primary-100 dark:border-primary-800/50 shadow-sm">
                      <QAFormViewer
                        qaForm={project.qa_form}
                        qaValues={qaValues}
                        setQaValues={setQaValues}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Completion Note</label>
                  <Textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Add any final notes before submitting..."
                    className="w-full text-[13px] rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm resize-none focus-visible:ring-primary-500"
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm h-11 rounded-xl font-bold tracking-wide" 
                  onClick={() => submitProjectMutation.mutate()}
                  disabled={submitProjectMutation.isPending || !submissionNote}
                >
                  {submitProjectMutation.isPending ? <AppIcon name="loading" className="animate-spin mr-2" /> : <AppIcon name="check" className="mr-2 h-4 w-4" />}
                  Submit for Review
                </Button>
              </div>
            )}

            {project?.status === "review" && hasCapability(caps, "projects.manage") && project?.approval?.submitted_by !== currentUser?.id && project?.created_by !== currentUser?.id && (
              <div className="space-y-4 p-5 bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-[14px]">
                  <AppIcon name="error" /> Pending HR Review
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[13px] text-neutral-700 dark:text-neutral-300 italic">"{project.submission_note}"</p>
                </div>
                
                {project.qa_submission?.values && project.qa_form && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                      QA Form Answers
                    </h4>
                    <div className="space-y-3">
                      {project.qa_form.fields?.map((field: any) => (
                        <div key={field.id} className="flex flex-col gap-1">
                          <dt className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{field.label}</dt>
                          <dd className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                            {(project.qa_submission?.values as any)?.[field.id] || "—"}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-lg shadow-sm"
                    onClick={() => reviewProjectMutation.mutate("approved")}
                    disabled={reviewProjectMutation.isPending}
                  >
                    <AppIcon name="check" className="mr-1.5 w-4 h-4" /> Approve
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 font-bold h-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 rounded-lg"
                    onClick={() => reviewProjectMutation.mutate("redo")}
                    disabled={reviewProjectMutation.isPending}
                  >
                    <AppIcon name="close" className="mr-1.5 w-4 h-4" /> Redo
                  </Button>
                </div>
              </div>
            )}

            {project?.status === "completed" && (
              <div className="flex flex-col items-center justify-center p-8 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
                  <AppIcon name="success" size="lg" />
                </div>
                <span className="font-bold text-[16px] text-emerald-800 dark:text-emerald-400">Project Completed</span>
                <span className="text-[12px] font-medium text-emerald-700/70 dark:text-emerald-500/70 mt-1">
                  Approved on {safeFormat(project?.completed_at || new Date(), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
