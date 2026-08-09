"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

const resetSchema = z
  .object({
    identifier: z.string().min(1, "Identifier is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      identifier: "",
      password: "",
      password_confirmation: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password reset successfully! You may now sign in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Password reset failed.");
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
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Enter your identifier and set a new password.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="New password (min 8 chars)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Confirm new password" {...field} />
                    </FormControl>
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
                    Resetting Password...
                  </>
                ) : (
                  "Set New Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
