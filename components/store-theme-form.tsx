"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const colorSchema = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a valid 6-digit hex color.")

const themeSchema = z.object({
  themePrimaryColor: colorSchema,
  themeAccentColor: colorSchema,
  themeBannerStyle: z.enum(["gradient", "solid", "soft"]),
  themeButtonStyle: z.enum(["rounded", "pill", "square"]),
  themeCardStyle: z.enum(["shadow", "outline", "flat"]),
  themeMode: z.enum(["system", "light", "dark"]),
})

type ThemeFormValues = z.infer<typeof themeSchema>

interface StoreThemeFormProps {
  themePrimaryColor?: string
  themeAccentColor?: string
  themeBannerStyle?: "gradient" | "solid" | "soft"
  themeButtonStyle?: "rounded" | "pill" | "square"
  themeCardStyle?: "shadow" | "outline" | "flat"
  themeMode?: "system" | "light" | "dark"
}

export function StoreThemeForm({
  themePrimaryColor = "#4f46e5",
  themeAccentColor = "#eef2ff",
  themeBannerStyle = "gradient",
  themeButtonStyle = "rounded",
  themeCardStyle = "shadow",
  themeMode = "system",
}: StoreThemeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefersDark, setPrefersDark] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setPrefersDark(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      themePrimaryColor,
      themeAccentColor,
      themeBannerStyle,
      themeButtonStyle,
      themeCardStyle,
      themeMode,
    },
  })

  const values = form.watch()

  async function onSubmit(data: ThemeFormValues) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/store/theme", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to update store theme")
      }

      toast({
        title: "Theme Updated",
        description: "Your store theme has been saved.",
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to update store theme.")
    } finally {
      setIsLoading(false)
    }
  }

  const buttonRadiusClass =
    values.themeButtonStyle === "pill"
      ? "rounded-full"
      : values.themeButtonStyle === "square"
        ? "rounded-none"
        : "rounded-md"

  const cardStyleClass =
    values.themeCardStyle === "outline"
      ? "border border-[#d8e2f3] shadow-none"
      : values.themeCardStyle === "flat"
        ? "border-none bg-card/70 shadow-none"
        : "border border-[#d8e2f3] shadow-[0_1px_3px_rgba(18,36,64,0.04),0_4px_12px_rgba(18,36,64,0.06)]"

  const previewIsDark = values.themeMode === "dark" || (values.themeMode === "system" && prefersDark)

  const bannerStyle =
    values.themeBannerStyle === "solid"
      ? { backgroundColor: values.themePrimaryColor }
      : values.themeBannerStyle === "soft"
        ? { background: `linear-gradient(135deg, ${values.themeAccentColor}, ${previewIsDark ? "#0f172a" : "#ffffff"})` }
        : { background: `linear-gradient(135deg, ${values.themePrimaryColor}, ${values.themeAccentColor})` }

  const isSoftBanner = values.themeBannerStyle === "soft"

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <FormField
                control={form.control}
                name="themePrimaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Input type="color" className="h-9 w-14 border-slate-200 p-1" {...field} />
                        <Input className="h-9 border-slate-200 bg-slate-50/60 text-sm focus:bg-white" placeholder="#4f46e5" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">Main action color on buttons and highlights.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeAccentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Accent Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Input type="color" className="h-9 w-14 border-slate-200 p-1" {...field} />
                        <Input className="h-9 border-slate-200 bg-slate-50/60 text-sm focus:bg-white" placeholder="#eef2ff" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">Secondary color used in gradients and surfaces.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-4 md:gap-4">
              <FormField
                control={form.control}
                name="themeMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Theme Mode</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "System", value: "system" as const },
                          { label: "Light", value: "light" as const },
                          { label: "Dark", value: "dark" as const },
                        ].map((mode) => (
                          <Button
                            key={mode.value}
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-9 border px-2 text-xs shadow-none",
                              field.value === mode.value
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100",
                            )}
                            onClick={() => field.onChange(mode.value)}
                          >
                            {mode.label}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">`System` follows the shopper's device setting.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeBannerStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Banner Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50/60 text-sm">
                          <SelectValue placeholder="Select banner style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="soft">Soft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeButtonStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Button Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50/60 text-sm">
                          <SelectValue placeholder="Select button style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="pill">Pill</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeCardStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-slate-600">Card Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50/60 text-sm">
                          <SelectValue placeholder="Select card style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="shadow">Shadow</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 w-full px-3 text-xs sm:w-auto" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Theme"}
              </Button>
            </div>
        </form>
      </Form>

      <div className={cn("rounded-[1.2rem] border p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] md:rounded-lg md:p-5 md:shadow-none", previewIsDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <h2 className={cn("text-sm font-semibold", previewIsDark ? "text-slate-100" : "text-slate-900")}>Live Preview</h2>
        <p className={cn("mb-4 mt-1 text-xs", previewIsDark ? "text-slate-400" : "text-slate-600")}>Quick preview of how your theme will look on your store.</p>
        <div className={cn("overflow-hidden rounded-lg border", previewIsDark ? "border-slate-700" : "border-slate-200")}>
          <div className="p-4" style={bannerStyle}>
            <h3 className={cn("text-base font-semibold", isSoftBanner ? (previewIsDark ? "text-slate-100" : "text-slate-900") : "text-white")}>Your Store Banner</h3>
            <p className={cn("mt-1 text-xs", isSoftBanner ? (previewIsDark ? "text-slate-300" : "text-slate-700") : "text-white/90")}>
              This banner updates instantly as you edit your theme.
            </p>
            <Button
              size="sm"
              className={cn("mt-3 h-8 border-0 px-3 text-xs text-white", buttonRadiusClass)}
              style={{ backgroundColor: values.themePrimaryColor }}
            >
              Shop Now
            </Button>
          </div>
          <div className={cn("p-4", previewIsDark ? "bg-slate-900" : "bg-card/70")}>
            <div className={cn("rounded-lg p-3", cardStyleClass)}>
              <div className={cn("mb-1 text-xs font-semibold", previewIsDark ? "text-slate-100" : "text-slate-900")}>Product Card Preview</div>
              <p className={cn("text-xs", previewIsDark ? "text-slate-400" : "text-muted-foreground")}>Card and button styles from your selected theme.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
