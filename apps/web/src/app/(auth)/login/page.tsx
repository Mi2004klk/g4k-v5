"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
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
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username, Email, or Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setAuth(result.token, result.user, result.active_role);
      toast.success("Login successful!");

      if (result.must_change_password) {
        router.push("/change-password");
      } else if (!result.onboarded) {
        router.push("/onboarding");
      } else if (result.user?.roles?.length > 1) {
        router.push("/role-select");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-violet-800 to-pink-700">
      <Card className="w-full max-w-md shadow-2xl border-none relative overflow-hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

        <CardHeader className="space-y-4 pb-6 pt-8 text-center">
          <div className="mx-auto w-16 h-16 relative flex items-center justify-center bg-violet-100 dark:bg-violet-950/50 rounded-2xl p-2 shadow-inner">
            <img
              src="/logo.png"
              alt="Games4King Logo"
              className="w-full h-full object-contain drop-shadow"
              onError={(e) => {
                // Fallback to icon if logo missing
                e.currentTarget.src = "/icon.png";
              }}
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
              Games4King Workplace OS
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Sign in to your corporate account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Email, Username, or Employee ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. karthik or dev@games4king.in" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Password
                      </FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-violet-500/25 transition-all duration-150 active:scale-[0.96]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in to Dashboard"
                )}
              </Button>
            </form>
          </Form>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
            <span>© Games4King Workplace OS</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-200">
                    <Info className="w-3.5 h-3.5" />
                    <span>System info</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Gen2k Conglomerate (2018) • Milestone 1 Baseline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
