"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

import { Button } from "@g4k/ui/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@g4k/ui/components";
import { PasswordInput } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";

import { strongPasswordSchema } from "@/lib/validations";

const changeSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  password: strongPasswordSchema,
  password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type FormValues = z.infer<typeof changeSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange"
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("Password changed successfully!");
      
      // We must silently refresh the user object to clear the `must_change_password` flag
      if (token) {
         try {
            const result = await apiFetch("/auth/refresh");
            setAuth(result.token, result.user, result.active_role);
            if (!result.user.onboarded_at) {
               router.push("/onboarding");
            } else if (result.user.roles?.length > 1) {
               router.push("/role-select");
            } else {
               router.push("/dashboard");
            }
         } catch {
            router.push("/dashboard");
         }
      } else {
         router.push("/dashboard");
      }
      
    } catch (error: any) {
      form.setError("root", { type: "manual", message: error.message || "Failed to change password." });
      toast.error(error.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950 font-sans">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl relative">
        <div className="w-full h-28 bg-gradient-brand relative flex items-center justify-center pt-2 pb-2">
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
            Change Password
          </CardTitle>
          <CardDescription className="text-sm font-sans text-neutral-500 dark:text-neutral-400">
            {user?.must_change_password 
              ? "You must change your password before continuing."
              : "Update your account password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-md text-sm font-medium text-center font-sans">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading} />
                    </FormControl>
                    <FormMessage className="font-sans" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold font-sans text-neutral-700 dark:text-neutral-300">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} className="font-sans" disabled={isLoading} />
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
                <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-[2px] bg-gradient-brand mask-border z-0" style={{ WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex space-x-1.5 items-center justify-center h-full">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
