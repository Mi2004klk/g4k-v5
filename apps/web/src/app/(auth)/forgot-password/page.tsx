"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-300 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold font-display">Account Password Recovery</CardTitle>
          <CardDescription className="text-xs">
            Enter your email, username, or employee ID to recover your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
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
                      <FormLabel className="text-xs font-semibold">
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
                      <FormLabel className="text-xs font-semibold">Recovery Channel</FormLabel>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => field.onChange("smtp")}
                          className={`p-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            field.value === "smtp"
                              ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-600"
                          }`}
                        >
                          Email (SMTP)
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("admin")}
                          className={`p-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            field.value === "admin"
                              ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                              : "border-neutral-200 dark:border-neutral-800 text-neutral-600"
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
                  className="w-full h-10 mt-2 bg-violet-600 hover:bg-violet-700 text-white font-medium"
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
