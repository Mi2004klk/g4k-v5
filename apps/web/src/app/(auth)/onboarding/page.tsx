"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFinish() {
    setIsLoading(true);
    try {
      await apiFetch("/auth/onboarding/complete", {
        method: "POST",
      });

      if (user && token) {
        const updatedUser = { ...user, onboarded_at: new Date().toISOString() };
        setAuth(token, updatedUser, user.roles?.[0] || 'employee');
      }

      toast.success("Welcome aboard!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Could not complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg shadow-xl border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden bg-white dark:bg-neutral-900">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-brand" />

        <CardHeader className="text-center space-y-4 pb-6 pt-8">
          <div className="mx-auto w-48 h-16 relative flex items-center justify-center mb-2">
            <Image
              src="/landscape-logo.png"
              alt="Games4King Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
              Welcome to Games4King
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Your Workplace OS environment is ready. Let’s get you oriented.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/10 dark:border-brand-violet/20 space-y-2">
                <h4 className="font-semibold text-sm text-brand-violet-deep dark:text-brand-violet">
                  Step 1: Attendance & Time Tracking
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Clock in from your personal dashboard widget when starting your shift. Your hours, break times, and extra hours are automatically calculated.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-10 bg-gradient-brand text-white gap-2 shadow-e2 transition-all duration-150 active:scale-[0.96]"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/10 dark:border-brand-violet/20 space-y-2">
                <h4 className="font-semibold text-sm text-brand-violet-deep dark:text-brand-violet">
                  Step 2: Leave & Requests
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Need time off? Submit leave requests directly from the dashboard. Track your balances and review approval notifications in real-time.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/2 h-10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="w-1/2 h-10 bg-gradient-brand text-white gap-2 shadow-e2 transition-all duration-150 active:scale-[0.96]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Get Started
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
