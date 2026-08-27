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
import { usePublicConfig } from "@/lib/use-public-config";

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

const createResetSchema = (policy: any) => {
  const min = policy?.min_length || 8;
  
  let passwordRule = z.string().min(min, `Password must be at least ${min} characters`);
  
  if (policy?.require_mixed) {
    passwordRule = passwordRule.regex(/[A-Z]/, "Must contain uppercase letter")
                               .regex(/[a-z]/, "Must contain lowercase letter");
  }
  if (policy?.require_number) {
    passwordRule = passwordRule.regex(/[0-9]/, "Must contain a number");
  }
  if (policy?.require_symbol) {
    passwordRule = passwordRule.regex(/[^A-Za-z0-9]/, "Must contain a symbol");
  }

  return z.object({
    identifier: z.string().min(1, "Identifier is required"),
    token: z.string().min(1, "Reset token is required"),
    password: passwordRule,
    password_confirmation: z.string()
  }).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: config } = usePublicConfig();
  const [isLoading, setIsLoading] = useState(false);

  const dynamicSchema = createResetSchema(config?.password_policy);
  type FormValues = z.infer<typeof dynamicSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      identifier: "",
      token: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange"
  });

  const isMissingDetails = !searchParams.get("token") || !searchParams.get("email");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email) {
      form.setValue("token", token);
      form.setValue("identifier", email);
    }
  }, [searchParams, form]);

  const passwordValue = form.watch("password");

  // Calculate password strength
  const getStrength = (pass: string) => {
    let score = 0;
    const policy = config?.password_policy || { min_length: 8, require_mixed: true, require_number: true, require_symbol: true };
    if (pass.length >= (policy.min_length || 8)) score++;
    if (!policy.require_mixed || (/[A-Z]/.test(pass) && /[a-z]/.test(pass))) score++;
    if (!policy.require_number || /[0-9]/.test(pass)) score++;
    if (!policy.require_symbol || /[^A-Za-z0-9]/.test(pass)) score++;
    return score; // Max 4
  };
  const strengthScore = getStrength(passwordValue || "");
  const strengthColors = ["bg-neutral-200 dark:bg-neutral-800", "bg-red-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-600"];

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push("/login");
    } catch (error) {
      const e = error as { errors?: { identifier?: string[], password?: string[], token?: string[] }, message?: string };
      if (e.errors) {
        if (e.errors.identifier) form.setError("identifier", { message: e.errors.identifier[0] });
        if (e.errors.password) form.setError("password", { message: e.errors.password[0] });
        if (e.errors.token) form.setError("root", { message: e.errors.token[0] });
      } else {
        form.setError("root", { type: "manual", message: e.message || "Failed to reset password." });
      }
      toast.error(e.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
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
          <CardTitle className="text-2xl font-bold font-display tracking-tight text-foreground">
            Create New Password
          </CardTitle>
          <CardDescription className="text-sm font-sans text-muted-foreground">
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isMissingDetails ? (
            <div className="text-center space-y-4 font-sans">
              <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-sm font-medium">
                Invalid or missing reset link. Please request a new password reset.
              </div>
              <Link href="/forgot-password" className="block w-full">
                <Button variant="outline" className="w-full h-11 gap-2 mt-2 font-sans shadow-e1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  Request Password Reset
                </Button>
              </Link>
            </div>
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-[var(--radius)] text-sm font-medium text-center font-sans">
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
                  <FormItem className="hidden">
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
                    {passwordValue?.length > 0 && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in zoom-in duration-200">
                        <div className="flex gap-1 h-1.5 w-full">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                                step <= strengthScore ? strengthColors[strengthScore] : "bg-neutral-200 dark:bg-neutral-800"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-neutral-500 flex justify-between font-medium">
                          <span>
                            {strengthScore === 0 ? "Very Weak" : 
                             strengthScore === 1 ? "Weak" : 
                             strengthScore === 2 ? "Fair" : 
                             strengthScore === 3 ? "Good" : "Strong"}
                          </span>
                        </div>
                      </div>
                    )}
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
                className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                disabled={isLoading}
              >
<span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-card font-sans">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
