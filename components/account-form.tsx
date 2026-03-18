"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AtSign, ExternalLink, Mail, PencilLine, ShieldCheck, User, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { buildStorefrontUrl } from "@/lib/storefront-url"
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, getUsernameValidationMessage, normalizeUsernameInput } from "@/lib/username"

const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  username: z.string().min(USERNAME_MIN_LENGTH, {
    message: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
  }).max(USERNAME_MAX_LENGTH, {
    message: `Username must be at most ${USERNAME_MAX_LENGTH} characters.`,
  }).refine((value) => getUsernameValidationMessage(value) === "", {
    message: "Use lowercase letters, numbers, or hyphens. Hyphens cannot start or end the username.",
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
    username: username || "",
  }

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  })

  const values = form.watch()
  const normalizedUsername = normalizeUsernameInput(values.username || username || "")
  const storefrontUrl = buildStorefrontUrl(normalizedUsername)

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        name: data.name.trim(),
        username: normalizeUsernameInput(data.username),
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

      form.reset({
        name: data.name.trim(),
        username: normalizeUsernameInput(data.username),
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
                {email || "Not set"}
              </p>
              <p className="mt-2 text-xs text-[#60708a]">Managed by Google sign-in.</p>
            </div>

            <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4 sm:col-span-2 lg:col-span-1">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Username</p>
              <p className="flex items-center gap-2 text-sm font-medium text-[#1f2a44]">
                <AtSign className="h-4 w-4 text-[#6a7a96]" />
                {normalizedUsername || "Not available"}
              </p>
              <p className="mt-2 text-xs text-[#60708a]">This username controls your public store URL and must stay unique.</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold text-[#162033]">Edit Profile</h2>
          <p className="mt-1 text-xs text-[#60708a]">Update your public display name and username. Your sign-in email stays managed by Google.</p>

          <Form {...form}>
            <form id="account-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Name</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 border-[#cfd8ea] bg-white text-sm text-[#1f2a44]"
                        placeholder="John Doe"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-[#41506a]">Username</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 border-[#cfd8ea] bg-white text-sm text-[#1f2a44]"
                        placeholder="your-store-name"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(normalizeUsernameInput(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Email</p>
                <p className="mt-1 break-all text-sm font-medium text-[#1f2a44]">{email || "Not available"}</p>
                <p className="mt-2 text-xs text-[#60708a]">Google controls this email address.</p>
              </div>

              <div className="rounded-lg border border-[#e7eefb] bg-[#fbfcff] p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#60708a]">Store URL Preview</p>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all text-sm font-medium text-[#1f2a44]">{storefrontUrl || "Store URL unavailable"}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-[#cfd8ea] bg-white px-3 text-xs text-[#1f2a44] shadow-none hover:bg-[#f3f6fc]"
                    onClick={() => window.open(storefrontUrl, "_blank", "noopener,noreferrer")}
                    disabled={!storefrontUrl}
                  >
                    Open Preview
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-[#60708a]">Your username must be unique and becomes your public storefront address.</p>
              </div>
            </form>
          </Form>
        </section>
      )}

      <div className="rounded-xl border border-[#d8e2f3] bg-white p-5 md:p-6">
        <h2 className="text-base font-semibold text-[#162033]">Authentication & Sessions</h2>
        <p className="mb-4 mt-1 text-xs text-[#60708a]">Google handles identity. Linkstore handles session revocation.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#4f5f7a]">Open security settings to review your Google sign-in method and sign out older app sessions.</p>
          <Button
            size="sm"
            className="h-9 w-full border-[#cfd8ea] bg-white px-3 text-xs text-[#1f2a44] shadow-none hover:bg-[#f3f6fc] sm:w-auto"
            variant="outline"
            onClick={() => router.push("/dashboard/account/security")}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Open Security Settings
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
