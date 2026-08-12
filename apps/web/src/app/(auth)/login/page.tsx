"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
// @ts-ignore - TS sometimes fails to resolve this module depending on moduleResolution setting
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
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
import { Input } from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
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

      setAuth(result.token, result.user, result.active_role, result.refresh_token);
      toast.success("Login successful!");

      if (!result.onboarded) {
        router.push("/onboarding");
      } else if (result.user?.roles?.length > 1) {
        router.push("/role-select");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      if (error.status === 423 && error.data?.retry_after) {
        setLockoutSeconds(error.data.retry_after);
        form.setError("root", { type: "manual", message: `Account locked. Try again in ${Math.ceil(error.data.retry_after / 60)} minutes.` });
        toast.error(`Account locked. Try again in ${Math.ceil(error.data.retry_after / 60)} minutes.`);
      } else {
        form.setError("root", { type: "manual", message: error.message || "Invalid credentials. Please try again." });
        toast.error(error.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-gradient-brand relative flex items-center justify-center">
          <Image src="/landscape-logo.png" alt="Games4King" width={220} height={84} priority
                 className="object-contain max-h-[64px] w-auto" />
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
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-md text-sm font-medium text-center">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Email or Employee ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. you@games4king.in or EMP-1042" {...field} disabled={lockoutSeconds > 0} autoComplete="username" />
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
                    <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} disabled={lockoutSeconds > 0} autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 mt-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm transition-all duration-300 active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed border-none"
                disabled={isLoading || lockoutSeconds > 0}
              >
                {/* Rainbow Hover Border Effect */}
                <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-[2px] bg-gradient-brand mask-border z-0" style={{ WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors block"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </Form>

          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>Games4king Workplace OS</span>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="System info"
                          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-3.5 h-3.5" />
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
