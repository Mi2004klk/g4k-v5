"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const passwordSchema = z.object({
  min_length: z.coerce.number().min(8, "Minimum 8 characters required").max(32, "Maximum 32 characters allowed"),
  require_mixed: z.boolean(),
  require_number: z.boolean(),
  require_symbol: z.boolean(),
  force_password_change: z.boolean(),
});

const sessionSchema = z.object({
  access_token_ttl: z.coerce.number().min(5, "Minimum 5 mins").max(1440, "Maximum 1440 mins"),
  refresh_token_ttl: z.coerce.number().min(1, "Minimum 1 day").max(90, "Maximum 90 days"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type SessionFormValues = z.infer<typeof sessionSchema>;

export function PoliciesConfig() {
  const queryClient = useQueryClient();

  const { data: settingsGrouped, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/settings/grouped"),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema) as any,
    defaultValues: {
      min_length: 8,
      require_mixed: true,
      require_number: true,
      require_symbol: true,
      force_password_change: false,
    },
    mode: "onTouched",
    delayError: 400,
  });

  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: {
      access_token_ttl: 15,
      refresh_token_ttl: 7,
    },
    mode: "onTouched",
    delayError: 400,
  });

  useEffect(() => {
    if (settingsGrouped?.security) {
      const securityMap: any = {};
      settingsGrouped.security.forEach((s: any) => {
        securityMap[s.key] = s.value;
      });
      passwordForm.reset({
        min_length: parseInt(securityMap["password.min_length"]) || 8,
        require_mixed: securityMap["password.require_mixed"] === "true",
        require_number: securityMap["password.require_number"] === "true",
        require_symbol: securityMap["password.require_symbol"] === "true",
        force_password_change: securityMap["force_password_change"] === "true" || securityMap["force_password_change"] === true,
      });
      sessionForm.reset({
        access_token_ttl: parseInt(securityMap["session.access_token_ttl"]) || 15,
        refresh_token_ttl: parseInt(securityMap["session.refresh_token_ttl"]) || 7,
      });
    }
  }, [settingsGrouped, passwordForm, sessionForm]);

  const updateMutation = useMutation({
    mutationFn: (updates: any[]) =>
      apiFetch("/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: updates }),
      }),
    onSuccess: () => {
      toast.success("Security policies updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handlePasswordSubmit = (data: any) => {
    const updates = [
      { category: "security", key: "password.min_length", value: data.min_length.toString() },
      { category: "security", key: "password.require_mixed", value: data.require_mixed.toString() },
      { category: "security", key: "password.require_number", value: data.require_number.toString() },
      { category: "security", key: "password.require_symbol", value: data.require_symbol.toString() },
      { category: "security", key: "force_password_change", value: data.force_password_change.toString() },
    ];
    updateMutation.mutate(updates);
  };

  const handleSessionSubmit = (data: any) => {
    const updates = [
      { category: "security", key: "session.access_token_ttl", value: data.access_token_ttl.toString() },
      { category: "security", key: "session.refresh_token_ttl", value: data.refresh_token_ttl.toString() },
    ];
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-base">Password Policy</CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium">Minimum Length <span className="text-red-500">*</span></label>
            <input
              type="number"
              {...passwordForm.register("min_length")}
              className={`w-full text-sm rounded-lg border ${passwordForm.formState.errors.min_length ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
            />
            {passwordForm.formState.errors.min_length && <p className="text-[10px] text-red-500 mt-1">{passwordForm.formState.errors.min_length.message}</p>}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_mixed"
              {...passwordForm.register("require_mixed")}
            />
            <label htmlFor="require_mixed" className="text-sm">Require uppercase and lowercase letters</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_number"
              {...passwordForm.register("require_number")}
            />
            <label htmlFor="require_number" className="text-sm">Require at least one number</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_symbol"
              {...passwordForm.register("require_symbol")}
            />
            <label htmlFor="require_symbol" className="text-sm">Require at least one symbol</label>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 mt-4">
            <div>
              <h4 className="text-sm font-medium">Force password change</h4>
              <p className="text-xs text-neutral-500">Require users to change password on first login or after admin reset</p>
            </div>
            <input
              type="checkbox"
              {...passwordForm.register("force_password_change")}
              className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
          </div>

          <Button type="submit" disabled={updateMutation.isPending || !passwordForm.formState.isValid} className="mt-4">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {updateMutation.isPending ? "Saving..." : "Save Policy"}
          </Button>
        </form>
      </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-base">Session & Device Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sessionForm.handleSubmit(handleSessionSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-medium">Access Token Expiration (Minutes) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...sessionForm.register("access_token_ttl")}
                className={`w-full text-sm rounded-lg border ${sessionForm.formState.errors.access_token_ttl ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
              />
              {sessionForm.formState.errors.access_token_ttl && <p className="text-[10px] text-red-500 mt-1">{sessionForm.formState.errors.access_token_ttl.message}</p>}
              {!sessionForm.formState.errors.access_token_ttl && <p className="text-[10px] text-neutral-500 mt-1">Short-lived token for API access.</p>}
            </div>
            
            <div>
              <label className="text-xs font-medium">Refresh Token Expiration (Days) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...sessionForm.register("refresh_token_ttl")}
                className={`w-full text-sm rounded-lg border ${sessionForm.formState.errors.refresh_token_ttl ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
              />
              {sessionForm.formState.errors.refresh_token_ttl && <p className="text-[10px] text-red-500 mt-1">{sessionForm.formState.errors.refresh_token_ttl.message}</p>}
              {!sessionForm.formState.errors.refresh_token_ttl && <p className="text-[10px] text-neutral-500 mt-1">Long-lived token used to obtain new access tokens.</p>}
            </div>

            <Button type="submit" disabled={updateMutation.isPending || !sessionForm.formState.isValid} className="mt-4">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {updateMutation.isPending ? "Saving..." : "Save Rules"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
