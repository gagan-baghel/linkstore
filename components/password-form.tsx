"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function PasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: PasswordFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update password")
      }

      setSuccess("Your password has been updated successfully.")

      toast({
        title: "Success",
        description: "Your password has been updated.",
      })

      // Reset form
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/account")
      }, 2000)
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-1 px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12 sm:mb-4">
          <KeyRound className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
        </div>
        <CardTitle className="text-center text-lg sm:text-2xl">Change Password</CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm">
          Update your account password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-sm" type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-sm" type="password" placeholder="••••••••" {...field} />
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
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-sm" type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="h-9 w-full text-xs sm:w-auto sm:text-sm" onClick={() => router.push("/dashboard/account")}>
                Cancel
              </Button>
              <Button type="submit" className="h-9 w-full text-xs sm:w-auto sm:text-sm" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
