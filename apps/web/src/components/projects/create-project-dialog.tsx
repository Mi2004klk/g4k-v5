"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Calendar, FileUploadPopup } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { format } from "date-fns";

export function CreateProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [departmentId, setDepartmentId] = useState("none");
  const [qaFormId, setQaFormId] = useState("none");
  const [deadline, setDeadline] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [allowEmployeeTasks, setAllowEmployeeTasks] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: deptsData } = useQuery({ queryKey: ["departments"], queryFn: () => apiFetch("/departments") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch("/users") });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          priority,
          department_id: departmentId === "none" ? null : departmentId,
          qa_form_id: qaFormId === "none" ? null : qaFormId,
          deadline: deadline || null,
          member_ids: memberIds,
          cover_image: coverImage,
          allow_employee_tasks: allowEmployeeTasks,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Project created successfully.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setPriority("medium");
      setDepartmentId("none");
      setQaFormId("none");
      setDeadline("");
      setMemberIds([]);
      setCoverImage(null);
      setAllowEmployeeTasks(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create project.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Add a new project to the workspace.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">Name</label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Name" className={fieldErrors.name ? "border-red-500" : ""} />
            {fieldErrors.name && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.name[0]}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-medium">Description</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`flex w-full rounded-[var(--radius)] border bg-white px-3 py-2 text-sm shadow-e1 ${fieldErrors.description ? "border-red-500" : "border-neutral-200"}`}
              rows={3}
              placeholder="Project Description"
            />
            {fieldErrors.description && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="project-priority" className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="project-priority">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="project-department" className="text-sm font-medium">Department</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="project-department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Company-Wide</SelectItem>
                  {Array.isArray(deptsData?.data) ? deptsData.data.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  )) : deptsData?.data?.data?.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="project-qa" className="text-sm font-medium">QA Form</label>
              <Select value={qaFormId} onValueChange={setQaFormId}>
                <SelectTrigger id="project-qa">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Array.isArray(qaFormsData) ? qaFormsData.map((q: any) => (
                    <SelectItem key={q.id} value={String(q.id)}>{q.title}</SelectItem>
                  )) : qaFormsData?.data?.map((q: any) => (
                    <SelectItem key={q.id} value={String(q.id)}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="project-deadline" className="text-sm font-medium">Deadline</label>
              <Input id="project-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldErrors.deadline ? "border-red-500" : ""} />
              {fieldErrors.deadline && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.deadline[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Cover (Optional)</label>
            <div className="flex items-center gap-3">
              {coverImage && (
                <img src={coverImage} alt="Cover Preview" className="h-10 w-10 object-cover rounded-[var(--radius)] border" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadPopup(true)}>
                {coverImage ? "Change Image" : "Upload Image"}
              </Button>
              <FileUploadPopup
                open={showUploadPopup}
                onOpenChange={setShowUploadPopup}
                title="Upload Project Cover"
                maxSizeMB={5}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append("cover_image", file);
                  const res = await apiFetch("/projects/cover", {
                    method: "POST",
                    body: formData,
                  });
                  setCoverImage(res.url);
                }}
              />
              {coverImage && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setCoverImage(null)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Team Members</label>
            <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-[var(--radius)] p-2 space-y-1">
              {usersData?.data?.map((u: any) => (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={memberIds.includes(String(u.id))}
                    onChange={(e) => {
                      if (e.target.checked) setMemberIds([...memberIds, String(u.id)]);
                      else setMemberIds(memberIds.filter(id => id !== String(u.id)));
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="allow-employee-tasks" 
              checked={allowEmployeeTasks}
              onChange={(e) => setAllowEmployeeTasks(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
            />
            <label htmlFor="allow-employee-tasks" className="text-sm cursor-pointer select-none">
              Allow employees to create tasks
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-primary-600 hover:bg-primary-700 text-white" 
            onClick={() => {
              setFieldErrors({});
              createMutation.mutate();
            }}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

