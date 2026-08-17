"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/ui-store";

import {
  Button,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@g4k/ui/components";

export function ProfilePreferencesTab() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const restoreWidgets = useUIStore((s) => s.restoreWidgets);
  const dismissedWidgetsCount = useUIStore((s) => s.dismissedWidgets?.length ?? 0);

  const [visibility, setVisibility] = useState(authUser?.preferences?.directory_visibility || "internal");

  useEffect(() => {
    if (authUser?.preferences?.directory_visibility) {
      setVisibility(authUser.preferences.directory_visibility);
    }
  }, [authUser?.preferences?.directory_visibility]);

  const updateVisibilityMutation = useMutation({
    mutationFn: async (val: string) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ directory_visibility: val }),
      });
    },
    onSuccess: (res: any) => {
      toast.success("Visibility preference updated!");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, { ...authUser, preferences: res.preferences }, authUser.active_role);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update preference.");
    },
  });

  const handleVisibilityChange = (val: string) => {
    setVisibility(val);
    updateVisibilityMutation.mutate(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Privacy & Visibility Preferences */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
            <AppIcon name="eye" className=" text-brand-violet" />
            Privacy & Visibility
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans">
            Control who can see your contact information in the company directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleVisibilityChange("public")}
              disabled={updateVisibilityMutation.isPending}
              className={`p-3 text-left border rounded-[var(--radius)] transition-colors ${visibility === "public" ? "border-brand-violet bg-brand-violet/5" : "border-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
            >
              <div className="font-semibold text-foreground mb-0.5">Public</div>
              <div className="text-muted-foreground text-[11px]">Phone and email visible to all users.</div>
            </button>
            <button
              onClick={() => handleVisibilityChange("internal")}
              disabled={updateVisibilityMutation.isPending}
              className={`p-3 text-left border rounded-[var(--radius)] transition-colors ${visibility === "internal" ? "border-brand-violet bg-brand-violet/5" : "border-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
            >
              <div className="font-semibold text-foreground mb-0.5">Internal Only</div>
              <div className="text-muted-foreground text-[11px]">Contact info visible only to your department & HR.</div>
            </button>
            <button
              onClick={() => handleVisibilityChange("private")}
              disabled={updateVisibilityMutation.isPending}
              className={`p-3 text-left border rounded-[var(--radius)] transition-colors ${visibility === "private" ? "border-brand-violet bg-brand-violet/5" : "border-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
            >
              <div className="font-semibold text-foreground mb-0.5">Private</div>
              <div className="text-muted-foreground text-[11px]">Contact info completely hidden from directory.</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Preferences */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
            <AppIcon name="dashboard" className=" text-brand-violet" />
            Dashboard Preferences
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans">
            Manage your dashboard widgets and layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs font-sans space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-800/50">
            <div>
              <div className="font-semibold text-foreground mb-0.5">Hidden Widgets</div>
              <div className="text-muted-foreground text-[11px]">You have {dismissedWidgetsCount} hidden widget(s) on your dashboard.</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                restoreWidgets();
                toast.success("Dashboard widgets restored to default.");
              }}
              disabled={dismissedWidgetsCount === 0}
            >
              Restore Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback & Complaints Form */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
            <AppIcon name="mail" className=" text-brand-violet" />
            Submit Feedback or Complaint
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans">
            Send direct feedback or file a complaint to HR.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs font-sans">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const subject = formData.get('subject') as string;
              const category = formData.get('category') as string;
              const body = formData.get('body') as string;
              if (!subject || !category || !body) {
                toast.error("Please fill all fields");
                return;
              }
              apiFetch('/feedback', {
                method: 'POST',
                body: JSON.stringify({ subject, category, body })
              }).then((res) => {
                toast.success("Feedback submitted successfully. HR will contact you via direct message.");
                (e.target as HTMLFormElement).reset();
                if (res.conversation_id) {
                  router.push(`/dashboard/chat?conversation=${res.conversation_id}`);
                }
              }).catch((err) => {
                toast.error(err.message || "Failed to submit feedback");
              });
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="fb-category" className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Category</label>
              <select id="fb-category" name="category" className="w-full h-9 rounded-[var(--radius)] border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="suggestion">Suggestion</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <label htmlFor="fb-subject" className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Subject</label>
              <Input id="fb-subject" name="subject" placeholder="What is this about?" required />
            </div>
            <div>
              <label htmlFor="fb-body" className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Details</label>
              <textarea id="fb-body" name="body" required rows={4} className="w-full rounded-[var(--radius)] border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" placeholder="Please provide details..."></textarea>
            </div>
            <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white shadow-e1">
              Submit to HR
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
