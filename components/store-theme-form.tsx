"use client"

import { useState } from "react"
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
})

type ThemeFormValues = z.infer<typeof themeSchema>

interface StoreThemeFormProps {
  themePrimaryColor?: string
  themeAccentColor?: string
  themeBannerStyle?: "gradient" | "solid" | "soft"
  themeButtonStyle?: "rounded" | "pill" | "square"
  themeCardStyle?: "shadow" | "outline" | "flat"
}

export function StoreThemeForm({
  themePrimaryColor = "#4f46e5",
  themeAccentColor = "#eef2ff",
  themeBannerStyle = "gradient",
  themeButtonStyle = "rounded",
  themeCardStyle = "shadow",
}: StoreThemeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      themePrimaryColor,
      themeAccentColor,
      themeBannerStyle,
      themeButtonStyle,
      themeCardStyle,
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

  const bannerStyle =
    values.themeBannerStyle === "solid"
      ? { backgroundColor: values.themePrimaryColor }
      : values.themeBannerStyle === "soft"
        ? { background: `linear-gradient(135deg, ${values.themeAccentColor}, #ffffff)` }
        : { background: `linear-gradient(135deg, ${values.themePrimaryColor}, ${values.themeAccentColor})` }

  const isSoftBanner = values.themeBannerStyle === "soft"

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

            <div className="grid gap-4 md:grid-cols-3">
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Live Preview</h2>
        <p className="mb-4 mt-1 text-xs text-slate-600">Quick preview of how your theme will look on your store.</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="p-4" style={bannerStyle}>
            <h3 className={cn("text-base font-semibold", isSoftBanner ? "text-slate-900" : "text-white")}>Your Store Banner</h3>
            <p className={cn("mt-1 text-xs", isSoftBanner ? "text-slate-700" : "text-white/90")}>
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
          <div className="bg-card/70 p-4">
            <div className={cn("rounded-lg p-3", cardStyleClass)}>
              <div className="mb-1 text-xs font-semibold">Product Card Preview</div>
              <p className="text-xs text-muted-foreground">Card and button styles from your selected theme.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
