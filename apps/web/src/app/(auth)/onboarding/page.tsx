"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleFinish() {
    if (user?.must_change_password) {
      if (!password || password !== passwordConfirmation) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);
    try {
      await apiFetch("/auth/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          phone: phone || undefined,
          emergency_contact: emergencyContact || undefined,
          password: password || undefined,
          password_confirmation: passwordConfirmation || undefined,
        }),
      });

      if (user && token) {
        // Silently refresh to clear the needs_onboarding flag correctly from backend
        try {
            const result = await apiFetch("/auth/refresh");
            setAuth(result.token, result.user, result.active_role);
        } catch {
            const updatedUser = { ...user, onboarded_at: new Date().toISOString() };
            setAuth(token, updatedUser, user.roles?.[0] || 'employee');
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
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

        <CardHeader className="text-center space-y-2 pb-6 pt-2">
          <CardTitle className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
            Welcome to Games4King
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            Let’s confirm your workspace details
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

              {user.must_change_password && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg space-y-4 mt-2">
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">Your account requires a password change before continuing.</p>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 block">New Password</label>
                    <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 block">Confirm Password</label>
                    <PasswordInput placeholder="••••••••" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleFinish}
              disabled={isLoading}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-[2px] bg-gradient-brand mask-border z-0" style={{ WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
              
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex space-x-1.5 items-center justify-center h-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  "Get Started"
                )}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
