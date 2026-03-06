"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PASSWORD_MIN_LENGTH } from "@/lib/auth-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const formSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Enter your current password.",
    }),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH, {
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    }),
    confirmPassword: z.string().min(1, {
      message: "Please confirm your new password.",
    }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Unable to update password.")
      }

      form.reset()
      toast({
        title: "Password updated",
        description: "Other active sessions were signed out.",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(submitError instanceof Error ? submitError.message : "Unable to update password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[#162033]">Change Password</h2>
        <p className="text-sm text-[#4f5f7a]">
          Password updates revoke older sessions. Use at least {PASSWORD_MIN_LENGTH} characters.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Current Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" placeholder="Enter current password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">New Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="Create a new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="Repeat the new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 border border-[#3e55df] bg-[#4a63f6] px-4 text-sm text-white shadow-[0_10px_24px_rgba(74,99,246,0.35)] hover:bg-[#3f56de]"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
