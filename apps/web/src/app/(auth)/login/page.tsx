"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";
import { usePublicConfig } from "@/lib/use-public-config";
import { apiFetch } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

import { Button } from "@g4k/ui/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { DisabledWhileSubmitting, ValidationSummary } from "@g4k/ui/components/state-helpers";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const queryClient = useQueryClient();
  const { data: config } = usePublicConfig();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      remember: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => setLockoutSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  async function onSubmit(data: LoginFormValues) {
    if (lockoutSeconds > 0) return;
    setIsLoading(true);
    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        toast.error("You are currently offline. Please connect to the internet to sign in.");
        setIsLoading(false);
        return;
      }

      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setAuth(result.token, result.user, result.active_role, result.refresh_token, result.capabilities, true, data.remember);
      queryClient.setQueryData(queryKeys.capabilities(), result.capabilities);
      toast.success("Login successful!");

      const targetRoute = result.user?.must_change_password
        ? "/change-password"
        : !result.onboarded
        ? "/onboarding"
        : (result.user?.roles?.length > 1 || result.user?.role_assignments?.length > 1)
        ? (returnTo ? `/role-select?returnTo=${encodeURIComponent(returnTo)}` : "/role-select")
        : (returnTo || "/dashboard");

      router.push(targetRoute);
    } catch (error) {
      const e = error as { status?: number; data?: { retry_after?: number }; message?: string };
      if (e.status === 423 && e.data?.retry_after) {
        setLockoutSeconds(e.data.retry_after);
        form.setError("root", { type: "manual", message: `Account locked. Try again in ${Math.ceil(e.data.retry_after / 60)} minutes.` });
      } else if (e.status === 429) {
        form.setError("root", { type: "manual", message: "Too many login attempts. Please try again later." });
      } else {
        const errorMsg = (!e.message || e.message === "Server Error") ? "Wrong Username or Password." : e.message;
        form.setError("root", { type: "manual", message: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent">
      <Card className="w-full max-w-md shadow-e1 border border-border overflow-hidden bg-card rounded-xl relative">
        <div className="w-full pt-10 pb-2 relative flex items-center justify-center bg-card">
          <Image src={config?.logo_url || "/landscape-logo.png"} alt={config?.name || "Games4King"} width={280} height={100} priority
                 className="object-contain w-[260px] md:w-[300px] h-auto drop-shadow-e1" />
        </div>

        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to your Workplace OS account to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <DisabledWhileSubmitting isSubmitting={isLoading}>
                <ValidationSummary errors={form.formState.errors} />

              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="identifier" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Email, Username, or Employee ID
                    </FormLabel>
                    <FormControl>
                      <Input id="identifier" placeholder="e.g. you@games4king.in or G4K-001" {...field} disabled={lockoutSeconds > 0} autoComplete="username" />
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
                    <FormLabel htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput id="password" placeholder="••••••••" {...field} disabled={lockoutSeconds > 0} autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0 p-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={lockoutSeconds > 0}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                        Keep me signed in
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed border-none"
                disabled={isLoading || lockoutSeconds > 0}
              >
                {/* Rainbow Hover Border Effect */}
<span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-card rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : lockoutSeconds > 0 ? (
                    `Try again in ${Math.ceil(lockoutSeconds / 60)}m ${lockoutSeconds % 60}s`
                  ) : (
                    "Sign In"
                  )}
                </span>
              </Button>
              <div className="text-center mt-4">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-neutral-900 dark:hover:text-white transition-colors block"
                >
                  Forgot password?
                </Link>
                </div>
              </DisabledWhileSubmitting>
            </form>
          </Form>

          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>Games4king Workplace OS</span>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="System info"
                          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <AppIcon name="info" size="sm" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Gen2k Conglomerate (2018) • Milestone 1
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
