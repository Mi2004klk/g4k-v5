"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";

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
    resolver: zodResolver(smtpSchema) as any,
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
    if (settingsData && settingsData.mail) {
      const mailSettings = settingsData.mail.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      form.reset({
        from_address: mailSettings.from_address || "",
        from_name: mailSettings.from_name || "",
        host: mailSettings.host || "",
        port: mailSettings.port || 587,
        encryption: mailSettings.encryption || "tls",
        username: mailSettings.username || "",
        password: mailSettings.password || "",
        timeout: mailSettings.timeout || 30,
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
    onSuccess: () => {
      toast.success("SMTP settings saved.");
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    }
  });

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await apiFetch("/settings/mail/test", { method: "POST" });
      toast.success("Test email sent successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email.");
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
          {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Send Test Email
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">From Name</label>
              <input type="text" {...form.register("from_name")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
              {form.formState.errors.from_name && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.from_name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">From Address</label>
              <input type="email" {...form.register("from_address")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
              {form.formState.errors.from_address && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.from_address.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Host</label>
            <input type="text" {...form.register("host")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
            {form.formState.errors.host && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.host.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium">Port</label>
              <input type="number" {...form.register("port")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
              {form.formState.errors.port && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.port.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Encryption</label>
              <Controller
                name="encryption"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent mt-1">
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
              <label className="text-xs font-medium">Timeout (sec)</label>
              <input type="number" {...form.register("timeout")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">Username</label>
              <input type="text" {...form.register("username")} className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
              {form.formState.errors.username && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.username.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">Password</label>
              <input type="password" {...form.register("password")} placeholder="••••••" className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
            </div>
          </div>
          
          <Button type="submit" disabled={updateMutation.isPending} size="sm" className="gap-2 mt-4">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4" />}
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
