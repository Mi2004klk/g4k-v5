"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "New password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password changed successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-900 to-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-300 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold font-display">Update Password Required</CardTitle>
          <CardDescription className="text-xs">
            For security purposes, you must change your password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Current Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="New password (min 8 chars)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Confirm New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-4 bg-violet-600 hover:bg-violet-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update & Continue"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
