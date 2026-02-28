"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AtSign, Mail, PencilLine, User, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountFormProps {
  name: string
  email: string
  username: string
}

export function AccountForm({ name, email, username }: AccountFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultValues: AccountFormValues = {
    name: name || "",
    email: email || "",
  }

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  })

  const values = form.watch()

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
      }

      const response = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update account")
      }

      toast({
        title: "Success",
        description: "Your account has been updated.",
      })

      setIsEditing(false)
      router.refresh()
    } catch (submitError) {
      console.error(submitError)
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    form.reset(defaultValues)
    setError(null)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 pb-24">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isEditing ? (
        <section className="rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#162033]">Profile Overview</h2>
              <p className="mt-1 text-xs text-[#60708a]">Your account details used across your dashboard.</p>
            </div>
            <span className="rounded-full border border-[#d8e2f3] bg-[#f7f9ff] px-3 py-1 text-xs font-medium text-[#41506a]">@{username || "username"}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Name</p>
              <p className="flex items-center gap-2 text-sm font-medium text-[#1f2a44]">
                <User className="h-4 w-4 text-[#6a7a96]" />
                {values.name || "Not set"}
              </p>
            </div>

            <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Email</p>
              <p className="flex items-center gap-2 break-all text-sm font-medium text-[#1f2a44]">
                <Mail className="h-4 w-4 shrink-0 text-[#6a7a96]" />
                {values.email || "Not set"}
              </p>
            </div>

            <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4 sm:col-span-2 lg:col-span-1">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Username</p>
              <p className="flex items-center gap-2 text-sm font-medium text-[#1f2a44]">
                <AtSign className="h-4 w-4 text-[#6a7a96]" />
                {username || "Not available"}
              </p>
              <p className="mt-2 text-xs text-[#60708a]">Username is fixed after signup and cannot be changed.</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold text-[#162033]">Edit Profile</h2>
          <p className="mt-1 text-xs text-[#60708a]">Update your public name and account email.</p>

          <Form {...form}>
            <form id="account-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Name</FormLabel>
                    <FormControl>
                      <Input className="h-10 border-[#cfd8ea] bg-white text-sm text-[#1f2a44]" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Email</FormLabel>
                    <FormControl>
                      <Input className="h-10 border-[#cfd8ea] bg-white text-sm text-[#1f2a44]" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Username</p>
                <p className="mt-1 text-sm font-medium text-[#1f2a44]">@{username || "Not available"}</p>
                <p className="mt-2 text-xs text-[#60708a]">Auto-generated at signup. This cannot be changed.</p>
              </div>
            </form>
          </Form>
        </section>
      )}

      <div className="rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
        <h2 className="text-base font-semibold text-[#162033]">Password</h2>
        <p className="mb-4 mt-1 text-xs text-[#60708a]">Change your account password.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#4f5f7a]">Update your password to keep your account secure.</p>
          <Button
            size="sm"
            className="h-9 w-full border-[#cfd8ea] bg-white px-3 text-xs text-[#1f2a44] shadow-none hover:bg-[#f3f6fc] sm:w-auto"
            variant="outline"
            onClick={() => router.push("/dashboard/account/change-password")}
          >
            Change Password
          </Button>
        </div>
      </div>

      <div className="fixed bottom-6 right-4 z-40 flex items-center gap-2 sm:right-6">
        {!isEditing ? (
          <Button
            type="button"
            className="h-10 border border-[#3e55df] bg-[#4a63f6] px-4 text-sm text-white shadow-[0_10px_24px_rgba(74,99,246,0.35)] hover:bg-[#3f56de]"
            onClick={() => setIsEditing(true)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-[#cfd8ea] bg-white px-4 text-sm text-[#1f2a44] shadow-[0_10px_24px_rgba(19,34,68,0.14)] hover:bg-[#f3f6fc]"
              onClick={cancelEdit}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="account-edit-form"
              disabled={isLoading}
              className="h-10 border border-[#3e55df] bg-[#4a63f6] px-4 text-sm text-white shadow-[0_10px_24px_rgba(74,99,246,0.35)] hover:bg-[#3f56de]"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
