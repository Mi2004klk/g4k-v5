"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Building2, Users, Trash2, Edit2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => apiFetch("/departments"),
  });

  const createDeptMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiFetch("/departments", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      toast.success("Department created!");
      setIsDeptModalOpen(false);
      setDeptName("");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create department.");
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/departments/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Department deleted.");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete department.");
    },
  });

  const deptList = data?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Departments & Teams
          </h1>
          <p className="text-xs text-neutral-500">
            Structure your organization into departments and specialized sub-teams.
          </p>
        </div>
        <Button
          onClick={() => setIsDeptModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : deptList.length === 0 ? (
        <EmptyState
          title="No departments configured"
          description="Create your first department to start organizing teams."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deptList.map((dept: any) => (
            <Card key={dept.id} className="border-none shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">{dept.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {dept.teams?.length || 0} Sub-teams
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDeptMutation.mutate(dept.id)}
                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Teams
                  </span>
                  {dept.teams && dept.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dept.teams.map((team: any) => (
                        <span
                          key={team.id}
                          className="px-2.5 py-1 rounded-md text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          {team.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No sub-teams assigned.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new operational department in Games4King.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">Department Name *</label>
              <Input
                placeholder="e.g. Quality Assurance"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createDeptMutation.mutate(deptName)}
              disabled={createDeptMutation.isPending || !deptName}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createDeptMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Department"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
