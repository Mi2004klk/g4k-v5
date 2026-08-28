"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";
import { Input, PasswordInput } from "@g4k/ui/components";
import { DisabledWhileSubmitting, ValidationSummary } from "@g4k/ui/components/state-helpers";

const smtpSchema = z.object({
  from_address: z.string().email("Invalid email address").optional().or(z.literal('')),
  from_name: z.string().optional(),
  host: z.string().optional(),
  port: z.coerce.number().min(1).max(65535).optional(),
  encryption: z.enum(["tls", "ssl", "none"]),
  username: z.string().optional(),
  password: z.string().optional(),
  timeout: z.coerce.number().min(1).optional(),
});

type SmtpFormValues = z.infer<typeof smtpSchema>;

export function MailSmtpConfig() {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiFetch("/settings/grouped"),
  });

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema) as unknown as import('react-hook-form').Resolver<SmtpFormValues>,
    defaultValues: {
      from_address: "",
      from_name: "",
      host: "",
      port: 587,
      encryption: "tls",
      username: "",
      password: "",
      timeout: 30,
    },
  });

  useEffect(() => {
    const rawData = settingsData as Record<string, { key: string, value: string }[]> | undefined;
    if (rawData && rawData.mail) {
      const mailSettings = rawData.mail.reduce((acc: Record<string, string>, curr: { key: string, value: string }) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      form.reset({
        from_address: mailSettings.from_address || "",
        from_name: mailSettings.from_name || "",
        host: mailSettings.host || "",
        port: Number(mailSettings.port) || 587,
        encryption: (mailSettings.encryption as "tls" | "ssl" | "none") || "tls",
        username: mailSettings.username || "",
        password: mailSettings.password || "",
        timeout: Number(mailSettings.timeout) || 30,
      });
    }
  }, [settingsData, form]);

  const updateMutation = useMutation({
    mutationFn: (data: SmtpFormValues) => {
      const settingsPayload = Object.entries(data).map(([key, value]) => ({
        category: "mail",
        key,
        value: value?.toString() || ""
      }));
      return apiFetch("/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: settingsPayload }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("SMTP settings saved.");
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings");
    }
  });

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await apiFetch("/settings/mail/test", { method: "POST" });
      toast.success("Test email sent successfully.");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send test email.");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-96 rounded-xl" />;
  }

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Mail / SMTP Settings</CardTitle>
          <CardDescription className="text-xs mt-1">Configure email delivery for the system.</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleTestEmail} disabled={isTesting}>
          {isTesting ? <Spinner className="mr-2" /> : <AppIcon name="send" className=" mr-2" />}
          Send Test Email
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4 max-w-xl">
          <DisabledWhileSubmitting isSubmitting={updateMutation.isPending}>
          <div className="space-y-4">
          <ValidationSummary errors={form.formState.errors} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">From Name</label>
              <Input type="text" {...form.register("from_name")} className="h-9 text-xs" />
              {form.formState.errors.from_name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.from_name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">From Address</label>
              <Input type="email" {...form.register("from_address")} className="h-9 text-xs" />
              {form.formState.errors.from_address && <p className="text-xs text-red-500 mt-1">{form.formState.errors.from_address.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Host</label>
            <Input type="text" {...form.register("host")} className="h-9 text-xs" />
            {form.formState.errors.host && <p className="text-xs text-red-500 mt-1">{form.formState.errors.host.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Port</label>
              <Input type="number" {...form.register("port")} className="h-9 text-xs" />
              {form.formState.errors.port && <p className="text-xs text-red-500 mt-1">{form.formState.errors.port.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Encryption</label>
              <Controller
                name="encryption"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full text-xs h-9">
                      <SelectValue placeholder="Select Encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Timeout (sec)</label>
              <Input type="number" {...form.register("timeout")} className="h-9 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Username</label>
              <Input type="text" {...form.register("username")} className="h-9 text-xs" />
              {form.formState.errors.username && <p className="text-xs text-red-500 mt-1">{form.formState.errors.username.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Password</label>
              <PasswordInput {...form.register("password")} placeholder="••••••" className="h-9 text-xs" />
            </div>
          </div>
          
          <Button type="submit" disabled={updateMutation.isPending} size="sm" className="gap-2 mt-4">
            {updateMutation.isPending ? <Spinner className="mr-2" /> : <AppIcon name="save" />}
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
          </div>
          </DisabledWhileSubmitting>
        </form>
      </CardContent>
    </Card>
  );
}
