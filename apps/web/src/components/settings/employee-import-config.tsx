"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Spinner,
  AppIcon,
} from "@g4k/ui/components";

export function EmployeeImportConfig() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append("file", uploadFile);

      return apiFetch("/users/import", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Employees imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["org_users"] });
      setFile(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to import employees.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const downloadTemplate = () => {
    // In a real app, this would trigger a download of a CSV template
    toast.info("Downloading CSV template...");
    const csvContent = "data:text/csv;charset=utf-8,name,email,password,role,department,designation,joining_date\nJohn Doe,john@example.com,secret123,employee,Engineering,Developer,2023-01-15";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-e2 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <AppIcon name="users" size="sm" />
            </div>
            Bulk Employee Import
          </CardTitle>
          <CardDescription>Upload a CSV file to add multiple employees to the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex items-start gap-3">
            <AppIcon name="info" className="text-indigo-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">How to import employees</h4>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mt-1">
                Download the CSV template, fill in the employee details, and upload it back here. Ensure that all required fields (name, email, password) are provided. Passwords will be securely hashed. <b>Users will be prompted to change their password on their first login.</b>
              </p>
              <Button variant="outline" size="sm" className="mt-3 bg-white dark:bg-neutral-900" onClick={downloadTemplate}>
                <AppIcon name="download" size="sm" className="mr-2" />
                Download CSV Template
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
            <input
              type="file"
              id="import-csv"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="import-csv" className="cursor-pointer flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <AppIcon name="upload" className="text-neutral-500" size="lg" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {file ? file.name : "Click to select a CSV file"}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : "or drag and drop here"}
              </p>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              onClick={handleUpload}
              disabled={!file || importMutation.isPending}
              className="px-6"
            >
              {importMutation.isPending ? <Spinner className="mr-2" /> : <AppIcon name="check" className="mr-2" />}
              {importMutation.isPending ? "Importing..." : "Start Import"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
