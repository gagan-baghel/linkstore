"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
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

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] || "User"
  const lastName = parts.slice(1).join(" ").trim() || undefined
  return { firstName, lastName }
}

export function RegisterForm() {
  const router = useRouter()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResendingCode, setIsResendingCode] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded || !signUp || !setActive) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const emailAddress = values.email.trim().toLowerCase()
      const { firstName, lastName } = splitName(values.name)

      const created = await signUp.create({
        emailAddress,
        password: values.password,
        firstName,
        lastName,
      })

      if (created.status === "complete" && created.createdSessionId) {
        await setActive({ session: created.createdSessionId })
        router.push("/dashboard")
        router.refresh()
        return
      }

      if (created.status === "missing_requirements") {
        setError("More account information is required before signup can continue.")
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
      toast({
        title: "Verification required",
        description: "We sent a verification code to your email.",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Failed to create account. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  async function onVerifyEmail() {
    if (!isLoaded || !signUp || !setActive) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const completed = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      })

      if (completed.status === "complete" && completed.createdSessionId) {
        await setActive({ session: completed.createdSessionId })
        router.push("/dashboard")
        router.refresh()
        return
      }

      setError("Verification is not complete yet. Please try again.")
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Invalid verification code."))
    } finally {
      setIsVerifying(false)
    }
  }

  async function onGoogleSignUp() {
    if (!isLoaded || !signUp) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    setError(null)
    setIsGoogleLoading(true)

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Google sign up is unavailable right now."))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function onResendCode() {
    if (!isLoaded || !signUp) {
      setError("Authentication is still loading. Please try again.")
      return
    }

    setError(null)
    setIsResendingCode(true)
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email.",
      })
    } catch (submitError) {
      console.error(submitError)
      setError(getClerkErrorMessage(submitError, "Unable to resend verification code."))
    } finally {
      setIsResendingCode(false)
    }
  }

  if (pendingVerification) {
    return (
      <div className="grid gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Verify your email</h3>
          <p className="text-sm text-muted-foreground">Enter the code sent to your email address to activate your account.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Verification Code
            </label>
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
            />
          </div>
          <Button type="button" className="w-full" onClick={onVerifyEmail} disabled={isVerifying || !isLoaded}>
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onResendCode}
            disabled={isResendingCode || isVerifying || !isLoaded}
          >
            {isResendingCode ? "Sending..." : "Resend Code"}
          </Button>
        </div>
      </div>
    )
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" autoComplete="name" {...field} />
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
                  <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !isLoaded}>
            {isLoading ? "Creating account..." : "Create Account"}
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
            onClick={onGoogleSignUp}
            disabled={isGoogleLoading || isLoading || !isLoaded}
          >
            {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
