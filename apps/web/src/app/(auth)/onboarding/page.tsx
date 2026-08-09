"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFinish() {
    setIsLoading(true);
    try {
      await apiFetch("/auth/onboarding/complete", {
        method: "POST",
      });

      toast.success("Welcome aboard!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Could not complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900">
      <Card className="w-full max-w-lg shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 mb-2 shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-display">
            Welcome to Games4King
          </CardTitle>
          <CardDescription className="text-xs">
            Your Workplace OS environment is ready. Let’s get you oriented.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 space-y-2">
                <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">
                  Step 1: Attendance & Time Tracking
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Clock in from your personal dashboard widget when starting your shift. Your hours, break times, and extra hours are automatically calculated.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 space-y-2">
                <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">
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
                  className="w-1/2 h-10 bg-violet-600 hover:bg-violet-700 text-white gap-2"
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
