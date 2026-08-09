"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const forgotSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  channel: z.enum(["smtp", "admin"]),
});

type FormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      identifier: "",
      channel: "smtp",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setIsSubmitted(true);
      toast.success("Recovery instructions submitted.");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden bg-white dark:bg-neutral-900">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-brand" />

        <CardHeader className="space-y-4 pb-6 pt-8 text-center">
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
            <CardTitle className="text-xl font-bold font-display text-neutral-900 dark:text-white">
              Account Password Recovery
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Enter your email, username, or employee ID to recover your password.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs text-success">
                If an account matching your identifier exists, instructions have been sent via your chosen recovery method.
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full gap-2 mt-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
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
                        <Input placeholder="Enter your identifier..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Recovery Channel
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => field.onChange("smtp")}
                          className={`p-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            field.value === "smtp"
                              ? "border-brand-violet bg-brand-violet/10 text-brand-violet"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          Email (SMTP)
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("admin")}
                          className={`p-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            field.value === "admin"
                              ? "border-brand-violet bg-brand-violet/10 text-brand-violet"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          Admin Approval
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-10 mt-2 bg-gradient-brand text-white font-medium shadow-e2 transition-all duration-150 active:scale-[0.96]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Send Recovery Request"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
