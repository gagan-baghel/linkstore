"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  storeLogo: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountFormProps {
  name: string
  email: string
  username: string
  storeLogo?: string
}

export function AccountForm({ name, email, username, storeLogo }: AccountFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: name || "",
      email: email || "",
      storeLogo: storeLogo || "",
    },
  })

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
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

      router.refresh()
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", files[0])

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Failed to upload image")

      const data = await response.json()
      form.setValue("storeLogo", data.url, { shouldValidate: true })
      toast({ title: "Success", description: "Store logo uploaded successfully." })
    } catch (uploadError) {
      console.error(uploadError)
      toast({ title: "Error", description: "Failed to upload logo. Please try again.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="storeLogo"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Store Logo</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              id="account-store-logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-full px-3 text-xs sm:w-auto"
                              disabled={isUploading}
                              onClick={() => document.getElementById("account-store-logo-upload")?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {isUploading ? "Uploading..." : field.value ? "Change Logo" : "Upload Logo"}
                            </Button>
                            {field.value && (
                              <>
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={field.value || "/placeholder.svg"} alt="Store logo" />
                                  <AvatarFallback className="text-[10px]">SL</AvatarFallback>
                                </Avatar>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-full px-2 text-xs sm:w-auto" onClick={() => field.onChange("")}>
                                  Remove Logo
                                </Button>
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">Shown on your public store header.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Name</FormLabel>
                        <FormControl>
                          <Input className="h-9 border-slate-200 bg-slate-50/60 text-sm focus:bg-white" placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Public display name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Username</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9 border-slate-200 bg-slate-100/70 text-sm text-slate-700"
                        value={username || ""}
                        readOnly
                        disabled
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Auto-generated at signup. This cannot be changed.</FormDescription>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Email</FormLabel>
                        <FormControl>
                          <Input className="h-9 border-slate-200 bg-slate-50/60 text-sm focus:bg-white" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Account email address.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" className="h-8 w-full px-3 text-xs sm:w-auto" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
        </form>
      </Form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Password</h2>
        <p className="mb-4 mt-1 text-xs text-slate-600">Change your account password.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">Update your password to keep your account secure.</p>
            <Button size="sm" className="h-8 w-full px-3 text-xs sm:w-auto" variant="outline" onClick={() => router.push("/dashboard/account/change-password")}>
              Change Password
            </Button>
          </div>
      </div>
    </div>
  )
}
