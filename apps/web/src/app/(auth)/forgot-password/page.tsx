"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

const forgotSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

type FormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      identifier: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: data.identifier }),
      });

      if (res.email_not_configured) {
        toast.error("Email not configured yet. Setup email from Admin Settings.");
        return;
      }

      if (res.email_send_failed) {
        toast.error("We could not send the email right now. Please try again later.");
        return;
      }

      setIsSubmitted(true);
    } catch (error: any) {
      if (error.status === 429) {
        form.setError("root", { type: "manual", message: "Too many requests. Please try again later." });
      } else {
        form.setError("root", { type: "manual", message: error.message || "Failed to submit request." });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-primary relative flex items-center justify-center pt-2 pb-2">
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
            Password Recovery
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            Enter your email, username, or employee ID
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4 font-sans">
              <div className="p-4 rounded-xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 text-sm font-medium">
                If an account matching your identifier exists, a password-reset link has been sent.
              </div>
              <Link href="/login" className="block w-full">
                <Button variant="outline" className="w-full h-11 gap-2 mt-2 font-sans shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {form.formState.errors.root && (
                  <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-md text-sm font-medium text-center font-sans">
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
                        <Input placeholder="Enter your identifier..." {...field} className="font-sans" disabled={isLoading} />
                      </FormControl>
                      <FormMessage className="font-sans" />
                    </FormItem>
                  )}
                />



                <Button
                  type="submit"
                  className="w-full h-11 mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm transition-all duration-300 active:scale-[0.98] relative overflow-hidden group font-sans disabled:opacity-50 disabled:cursor-not-allowed border-none"
                  disabled={isLoading}
                >
<span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex space-x-1.5 items-center justify-center h-full">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      "Recover Password"
                    )}
                  </span>
                </Button>
              </form>
            </Form>

            <div className="pt-2 text-center">
               <Link href="/login" className="text-sm font-medium font-sans text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Back to Sign In
               </Link>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
