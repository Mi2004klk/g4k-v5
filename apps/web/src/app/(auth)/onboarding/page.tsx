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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";
import { strongPasswordSchema } from "@/lib/validations";

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  password: strongPasswordSchema,
  password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const [step, setStep] = useState<"profile" | "password" | "tour">("profile");
  
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      router.replace("/login");
    }
  }, [token, user]);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange"
  });

  async function handleProfileSubmit() {
    // If they must change password, go to password step, else tour
    if (user?.must_change_password) {
      setStep("password");
    } else {
      setStep("tour");
    }
  }

  async function handlePasswordSubmit(data: PasswordFormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success("Password updated successfully!");
      setStep("tour");
    } catch (error: any) {
      passwordForm.setError("root", { type: "manual", message: error.message || "Failed to change password." });
      toast.error(error.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinish() {
    setIsLoading(true);
    try {
      const res = await apiFetch("/auth/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          phone: phone || undefined,
          emergency_contact: emergencyContact || undefined,
        }),
      });

      if (user && token) {
        const updatedUser = res.user || { ...user, onboarded_at: new Date().toISOString() };
        // Refetch /auth/refresh so any token changes from change-password get synced if we missed it
        const refreshRes = await apiFetch("/auth/refresh").catch(() => null);
        if (refreshRes) {
            setAuth(refreshRes.token, refreshRes.user, refreshRes.active_role, refreshRes.refresh_token);
        } else {
            setAuth(token, updatedUser, user.active_role || user.roles?.[0] || 'employee');
        }
      }

      toast.success("Welcome aboard!");
      if (user?.roles && user.roles.length > 1) {
          router.push("/role-select");
      } else {
          router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Could not complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="flex space-x-1.5 items-center justify-center">
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const primaryRole = user.roles?.[0] || 'employee';

  return (
    <div className="h-full min-h-screen flex items-center justify-center p-4 bg-transparent font-sans">
      <Card className="w-full max-w-md shadow-e1 hover:shadow-e2 transition-shadow duration-150 border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-card dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full relative flex flex-col items-center justify-center pt-8 pb-4">
           {/* Replace gradient hero with the animated logo */}
           <video 
              src="/animated-logo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-32 h-32 object-contain"
           />
        </div>

        {step === "profile" && (
          <>
            <CardHeader className="text-center space-y-2 pb-6 pt-2">
              <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                Welcome to Games4King
              </CardTitle>
              <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
                Let's confirm your workspace details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Name</div>
                      <div className="font-medium text-neutral-900 dark:text-white">{user.name}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Emp ID</div>
                      <div className="font-medium text-neutral-900 dark:text-white">{user.employee_id || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Primary Role</div>
                      <div className="font-medium text-neutral-900 dark:text-white capitalize">{primaryRole.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1 uppercase tracking-wider">Department</div>
                      <div className="font-medium text-neutral-900 dark:text-white">{user.department?.name || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 block">Phone Number (Optional)</label>
                    <Input placeholder="e.g. +1 234 567 890" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 block">Emergency Contact (Optional)</label>
                    <Input placeholder="Name & Number" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                  </div>
                </div>

                <Button
                  onClick={handleProfileSubmit}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === "password" && (
          <>
            <CardHeader className="text-center space-y-2 pb-6 pt-2">
              <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                Secure your account
              </CardTitle>
              <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
                Please set a new secure password to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-5">
                  {passwordForm.formState.errors.root && (
                    <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-[var(--radius)] text-sm font-medium text-center font-sans">
                      {passwordForm.formState.errors.root.message}
                    </div>
                  )}

                  <FormField
                    control={passwordForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                          Current Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="        " {...field} className="font-sans" disabled={isLoading} autoComplete="current-password" />
                        </FormControl>
                        <FormMessage className="font-sans" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="        " {...field} className="font-sans" disabled={isLoading} autoComplete="new-password" />
                        </FormControl>
                        <FormMessage className="font-sans" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="password_confirmation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                          Confirm New Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="        " {...field} className="font-sans" disabled={isLoading} autoComplete="new-password" />
                        </FormControl>
                        <FormMessage className="font-sans" />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={() => setStep("tour")}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                      disabled={isLoading}
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
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}

        {step === "tour" && (
          <>
            <CardHeader className="text-center space-y-2 pb-6 pt-2">
              <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                Quick Tour
              </CardTitle>
              <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
                Explore your new workspace tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Time & Attendance</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Clock in daily, request leaves, and manage your shifts easily from the dashboard.</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Tasks & Projects</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Track your assignments, update task status, and collaborate with your team.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Company Chat</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Stay connected with your colleagues through our real-time messaging system.</p>
                  </div>
                </div>
              </div>
              <Button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex space-x-1.5 items-center justify-center h-full">
                        <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-surface rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      "Go to Dashboard"
                    )}
                  </span>
                </Button>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}
