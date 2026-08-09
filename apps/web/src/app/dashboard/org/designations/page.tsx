"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DesignationsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => apiFetch("/designations"),
  });

  const createMutation = useMutation({
    mutationFn: async (desigName: string) => {
      return apiFetch("/designations", {
        method: "POST",
        body: JSON.stringify({ name: desigName }),
      });
    },
    onSuccess: () => {
      toast.success("Designation added!");
      setIsOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create designation.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/designations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Designation deleted.");
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete designation.");
    },
  });

  const designations = data?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Designations Master
          </h1>
          <p className="text-xs text-neutral-500">
            Define corporate job titles and roles across departments.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Designation</span>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : designations.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No designations defined"
                description="Add designations such as Unity Developer, HR Manager, etc."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Designation Title</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {designations.map((desig: any) => (
                  <tr
                    key={desig.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-violet-500" />
                      {desig.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(desig.id)}
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Designation</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new job title for employee assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">Designation Title *</label>
              <Input
                placeholder="e.g. Lead 3D Animator"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(name)}
              disabled={createMutation.isPending || !name}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Title"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
