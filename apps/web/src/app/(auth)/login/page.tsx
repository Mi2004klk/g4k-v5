"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
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
  identifier: z.string().min(1, "Username, Email, or Employee ID is required"),
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
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setAuth(result.token, result.user, result.active_role);
      toast.success("Login successful!");

      // Disabled reset password on first login
      if (false && result.must_change_password) {
        router.push("/change-password");
      } else if (!result.onboarded) {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-gradient-brand relative flex items-center justify-center">
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
            Workplace OS
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            Sign in to your corporate account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Email, Username, or Employee ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. karthik or dev@games4king.in" {...field} disabled={lockoutSeconds > 0} className="font-sans" />
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                        Password
                      </FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium font-sans text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} disabled={lockoutSeconds > 0} className="font-sans" />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
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
            </form>
          </Form>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 font-sans">
            <span>© Games4King Workplace OS</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-neutral-500 transition-colors focus:outline-none">
                    <Info className="w-3.5 h-3.5" />
                    <span>System info</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-sans">Gen2k Conglomerate (2018) • Milestone 1 Baseline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
