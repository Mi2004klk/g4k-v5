"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-300 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold font-display">Reset Your Password</CardTitle>
          <CardDescription className="text-xs">
            Enter your identifier and set a new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">New Password</FormLabel>
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
                    <FormLabel className="text-xs font-semibold">Confirm New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Confirm new password" {...field} />
                    </FormControl>
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
