"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

function getClerkErrorMessage(error: unknown, fallback: string) {
  const maybeClerkError = error as { errors?: Array<{ longMessage?: string; message?: string }> }
  return maybeClerkError?.errors?.[0]?.longMessage || maybeClerkError?.errors?.[0]?.message || fallback
}

export function LoginForm() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded || !signIn || !setActive) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: values.email.trim().toLowerCase(),
        password: values.password,
      })

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push("/dashboard")
        router.refresh()
        return
      }

      if (result.status === "needs_second_factor") {
        setError("Your account requires an additional verification step. Complete sign in from Clerk account flow.")
        return
      }

      setError("Unable to sign in. Please try again.")
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Invalid email or password. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  async function onGoogleSignIn() {
    if (!isLoaded || !signIn) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    setError(null)
    setIsGoogleLoading(true)

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Google login is unavailable right now."))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" autoComplete="email" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !isLoaded}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogleSignIn}
            disabled={isGoogleLoading || isLoading || !isLoaded}
          >
            {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
