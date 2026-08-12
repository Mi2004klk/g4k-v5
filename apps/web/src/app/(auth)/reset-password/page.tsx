"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@g4k/ui/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@g4k/ui/components";
import { Input, PasswordInput } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

import { strongPasswordSchema } from "@/lib/validations";

// Strong password policy: min 8, mixed case, numbers, symbols
const resetSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  token: z.string().min(1, "Reset token is required"),
  password: strongPasswordSchema,
  password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type FormValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      identifier: "",
      token: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange"
  });

  const [missingDetails, setMissingDetails] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (!token || !email) {
      setMissingDetails(true);
    } else {
      form.setValue("token", token);
      form.setValue("identifier", email);
    }
  }, [searchParams, form]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push("/login");
    } catch (error: any) {
      if (error.errors) {
        if (error.errors.identifier) form.setError("identifier", { message: error.errors.identifier[0] });
        if (error.errors.password) form.setError("password", { message: error.errors.password[0] });
        if (error.errors.token) form.setError("root", { message: error.errors.token[0] });
      } else {
        form.setError("root", { type: "manual", message: error.message || "Failed to reset password." });
      }
      toast.error(error.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background font-sans">
      <Card className="w-full max-w-md shadow-e1 border border-border overflow-hidden bg-card rounded-xl relative">
        <div className="w-full h-28 bg-primary relative flex items-center justify-center pt-2 pb-2">
           <Image
              src="/landscape-logo.png"
              alt="Games4King Logo"
              width={200}
              height={80}
              priority
              className="object-contain max-h-[80px]"
            />
        </div>

        <CardHeader className="space-y-2 pb-6 pt-6 text-center">
          <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
            Create New Password
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {missingDetails ? (
            <div className="text-center space-y-4 font-sans">
              <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-sm font-medium">
                Invalid or missing reset link. Please request a new password reset.
              </div>
              <Link href="/forgot-password" className="block w-full">
                <Button variant="outline" className="w-full h-11 gap-2 mt-2 font-sans shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  Request Password Reset
                </Button>
              </Link>
            </div>
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-md text-sm font-medium text-center font-sans">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Email or Username
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your identifier..." {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Reset Token
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Paste your reset token..." {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                disabled={isLoading}
              >
<span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </span>
              </Button>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 font-sans">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
