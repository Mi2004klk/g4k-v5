"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
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
import { PasswordInput } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

// Create a dynamic schema based on config rules
const createChangeSchema = (policy: any) => {
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
    current_password: z.string().min(1, "Current password is required"),
    password: passwordRule,
    password_confirmation: z.string()
  }).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data: config } = usePublicConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      router.replace("/login");
    }
  }, [token, user, router]);

  const dynamicSchema = createChangeSchema(config?.password_policy);
  type FormValues = z.infer<typeof dynamicSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange"
  });

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
  const strengthScore = getStrength(passwordValue);
  const strengthColors = ["bg-neutral-200 dark:bg-neutral-800", "bg-red-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-600"];

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const result = await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password changed successfully!");
      
      if (result.token && result.user) {
         setAuth(result.token, result.user, result.user.active_role || 'employee', result.refresh_token, result.capabilities);
         queryClient.invalidateQueries({ queryKey: queryKeys.profile });
         if (!result.user.onboarded_at) {
            router.push("/onboarding");
         } else if (result.user.roles?.length > 1) {
            router.push("/role-select");
         } else {
            router.push("/dashboard");
         }
      } else {
         router.push("/dashboard");
      }
      
    } catch (error) {
      const e = error as Error;
      form.setError("root", { type: "manual", message: e.message || "Failed to change password." });
      toast.error(e.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSkip() {
    setIsSkipping(true);
    try {
      const result = await apiFetch("/auth/skip-password-change", { method: "POST" });
      updateUser(result.user);
      
      if (!result.user.onboarded_at) {
        router.push("/onboarding");
      } else if (result.user.roles?.length > 1) {
        router.push("/role-select");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Failed to skip password change.");
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
      <Card className="w-full max-w-md shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-card dark:bg-neutral-900 rounded-xl relative">
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
            Change Password
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            {user?.must_change_password 
              ? "You must change your password before continuing."
              : "Update your account password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-[var(--radius)] text-sm font-medium text-center font-sans">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading || isSkipping} autoComplete="current-password" />
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
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading || isSkipping} autoComplete="new-password" />
                    </FormControl>
                    
                    {passwordValue && (
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map((level) => (
                          <div 
                            key={level} 
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${level <= strengthScore ? strengthColors[strengthScore] : strengthColors[0]}`}
                          />
                        ))}
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
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading || isSkipping} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                disabled={isLoading || isSkipping}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </span>
              </Button>

              {config?.force_password_change_compulsive === false && user?.must_change_password && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium font-sans mt-2"
                  disabled={isLoading || isSkipping}
                  onClick={onSkip}
                >
                  {isSkipping ? "Skipping..." : "Skip for now"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
