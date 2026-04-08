"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const themeFormSchema = z.object({
  themeMode: z.enum(["light", "dark"]).default("light"),
  themeBackgroundColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || COLOR_REGEX.test(value), "Use a hex color like #f1f5f9."),
  themeBackgroundPattern: z
    .enum([
      "solid",
      "gradient",
      "mesh",
      "confetti",
      "grid",
      "waves",
      "aurora",
      "sunset",
      "neon",
      "paper",
      "dots",
      "stripes",
      "topo",
      "noise",
      "zigzag",
      "halftone",
      "ripple",
      "petals",
      "diagonal",
      "stars",
      "gradient-radial",
      "glow",
      "checkers",
      "chevron",
      "blobs",
      "prism",
      "lava",
      "hologram",
      "blocks",
      "glyphs",
      "pixel",
      "tartan",
      "arches",
      "swoosh",
      "orbit",
      "ribbon",
      "bubble",
      "petal-arc",
    ])
    .default("solid"),
  themeNameColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || COLOR_REGEX.test(value), "Use a hex color like #0f172a."),
  themeBioColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || COLOR_REGEX.test(value), "Use a hex color like #64748b."),
  themeNameFont: z
    .enum([
      "system",
      "serif",
      "grotesk",
      "rounded",
      "mono",
      "display",
      "condensed",
      "elegant",
      "handwritten",
      "modern",
      "soft",
      "editorial",
      "tech",
      "classic",
      "headline",
    ])
    .default("system"),
  themeBioFont: z
    .enum([
      "system",
      "serif",
      "grotesk",
      "rounded",
      "mono",
      "display",
      "condensed",
      "elegant",
      "handwritten",
      "modern",
      "soft",
      "editorial",
      "tech",
      "classic",
      "headline",
    ])
    .default("system"),
  themePrimaryColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || COLOR_REGEX.test(value), "Use a hex color like #0f172a."),
  themeAccentColor: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || COLOR_REGEX.test(value), "Use a hex color like #6366f1."),
  themeButtonStyle: z.enum(["pill", "rounded", "square"]).default("pill"),
  themeCardStyle: z.enum(["soft", "outline", "solid"]).default("soft"),
  themeFooterVisible: z.boolean().default(true),
})

type ThemeFormValues = z.infer<typeof themeFormSchema>

interface StoreThemeFormProps {
  themeMode?: "light" | "dark"
  themeBackgroundColor?: string
  themeBackgroundPattern?:
  | "solid"
  | "gradient"
  | "mesh"
  | "confetti"
  | "grid"
  | "waves"
  | "aurora"
  | "sunset"
  | "neon"
  | "paper"
  | "dots"
  | "stripes"
  | "topo"
  | "noise"
  | "zigzag"
  | "halftone"
  | "ripple"
  | "petals"
  | "diagonal"
  | "stars"
  | "gradient-radial"
  | "glow"
  | "checkers"
  | "chevron"
  | "blobs"
  | "prism"
  | "lava"
  | "hologram"
    | "blocks"
    | "glyphs"
    | "pixel"
    | "tartan"
    | "arches"
    | "swoosh"
    | "orbit"
    | "ribbon"
    | "bubble"
    | "petal-arc"
  themeNameColor?: string
  themeBioColor?: string
  themeNameFont?:
  | "system"
  | "serif"
  | "grotesk"
  | "rounded"
  | "mono"
  | "display"
  | "condensed"
  | "elegant"
  | "handwritten"
  | "modern"
  | "soft"
  | "editorial"
  | "tech"
  | "classic"
  | "headline"
  themeBioFont?:
  | "system"
  | "serif"
  | "grotesk"
  | "rounded"
  | "mono"
  | "display"
  | "condensed"
  | "elegant"
  | "handwritten"
  | "modern"
  | "soft"
  | "editorial"
  | "tech"
  | "classic"
  | "headline"
  themePrimaryColor?: string
  themeAccentColor?: string
  themeButtonStyle?: "pill" | "rounded" | "square"
  themeCardStyle?: "soft" | "outline" | "solid"
  themeFooterVisible?: boolean
  onLiveChange?: (values: ThemeFormValues) => void
}

const DEFAULT_PRIMARY = "#0f172a"
const DEFAULT_ACCENT = "#6366f1"
const DEFAULT_BACKGROUND = "#f8fafc"
const DEFAULT_NAME_COLOR = "#0f172a"
const DEFAULT_BIO_COLOR = "#475569"

export function StoreThemeForm({
  themeMode = "light",
  themeBackgroundColor,
  themeBackgroundPattern = "solid",
  themeNameColor,
  themeBioColor,
  themeNameFont = "system",
  themeBioFont = "system",
  themePrimaryColor,
  themeAccentColor,
  themeButtonStyle = "pill",
  themeCardStyle = "soft",
  themeFooterVisible = true,
  onLiveChange,
}: StoreThemeFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      themeMode,
      themeBackgroundColor: themeBackgroundColor || DEFAULT_BACKGROUND,
      themeBackgroundPattern,
      themeNameColor: themeNameColor || DEFAULT_NAME_COLOR,
      themeBioColor: themeBioColor || DEFAULT_BIO_COLOR,
      themeNameFont,
      themeBioFont,
      themePrimaryColor: themePrimaryColor || DEFAULT_PRIMARY,
      themeAccentColor: themeAccentColor || DEFAULT_ACCENT,
      themeButtonStyle,
      themeCardStyle,
      themeFooterVisible,
    },
  })

  useEffect(() => {
    if (!onLiveChange) return
    const subscription = form.watch((values) => {
      onLiveChange(values as ThemeFormValues)
    })
    return () => subscription.unsubscribe()
  }, [form, onLiveChange])

  async function onSubmit(values: ThemeFormValues) {
    setIsSaving(true)
    try {
      const response = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to update theme settings")
      }

      toast({
        title: "Theme updated",
        description: "Your storefront theme has been saved.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Update failed",
        description: "Could not save theme settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const primaryColorValue = form.watch("themePrimaryColor") || DEFAULT_PRIMARY
  const accentColorValue = form.watch("themeAccentColor") || DEFAULT_ACCENT
  const backgroundColorValue = form.watch("themeBackgroundColor") || DEFAULT_BACKGROUND
  const nameColorValue = form.watch("themeNameColor") || DEFAULT_NAME_COLOR
  const bioColorValue = form.watch("themeBioColor") || DEFAULT_BIO_COLOR

  const backgroundPatterns = [
    { id: "solid", label: "Solid" },
    { id: "gradient", label: "Gradient" },
    { id: "mesh", label: "Mesh" },
    { id: "confetti", label: "Confetti" },
    { id: "grid", label: "Grid" },
    { id: "waves", label: "Waves" },
    { id: "aurora", label: "Aurora" },
    { id: "sunset", label: "Sunset" },
    { id: "neon", label: "Neon" },
    { id: "paper", label: "Paper" },
    { id: "dots", label: "Dots" },
    { id: "stripes", label: "Stripes" },
    { id: "topo", label: "Topo" },
    { id: "noise", label: "Noise" },
    { id: "zigzag", label: "Zigzag" },
    { id: "halftone", label: "Halftone" },
    { id: "ripple", label: "Ripple" },
    { id: "petals", label: "Petals" },
    { id: "diagonal", label: "Diagonal" },
    { id: "stars", label: "Stars" },
    { id: "gradient-radial", label: "Radial" },
    { id: "glow", label: "Glow" },
    { id: "checkers", label: "Checkers" },
    { id: "chevron", label: "Chevron" },
    { id: "blobs", label: "Blobs" },
    { id: "prism", label: "Prism" },
    { id: "lava", label: "Lava" },
    { id: "hologram", label: "Hologram" },
    { id: "blocks", label: "Blocks" },
    { id: "glyphs", label: "Glyphs" },
    { id: "pixel", label: "Pixel" },
    { id: "tartan", label: "Tartan" },
    { id: "arches", label: "Arches" },
    { id: "swoosh", label: "Swoosh" },
    { id: "orbit", label: "Orbit" },
    { id: "ribbon", label: "Ribbon" },
    { id: "bubble", label: "Bubble" },
    { id: "petal-arc", label: "Petal Arc" },
  ] as const

  const fontOptions = [
    { value: "system", label: "System Sans" },
    { value: "serif", label: "Classic Serif" },
    { value: "grotesk", label: "Grotesk" },
    { value: "rounded", label: "Rounded" },
    { value: "mono", label: "Mono" },
    { value: "display", label: "Display" },
    { value: "condensed", label: "Condensed" },
    { value: "elegant", label: "Elegant Serif" },
    { value: "handwritten", label: "Handwritten" },
    { value: "modern", label: "Modern Sans" },
    { value: "soft", label: "Soft Sans" },
    { value: "editorial", label: "Editorial" },
    { value: "tech", label: "Tech" },
    { value: "classic", label: "Classic" },
    { value: "headline", label: "Headline" },
  ] as const

  const vibePresets = [
    {
      id: "miami",
      label: "Miami Night",
      themeMode: "dark",
      themeBackgroundColor: "#0b1020",
      themeBackgroundPattern: "neon",
      themePrimaryColor: "#22d3ee",
      themeAccentColor: "#f472b6",
      themeNameColor: "#f8fafc",
      themeBioColor: "#cbd5f5",
      themeNameFont: "display",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "solid",
    },
    {
      id: "noir",
      label: "Velvet Noir",
      themeMode: "dark",
      themeBackgroundColor: "#0a0a0b",
      themeBackgroundPattern: "halftone",
      themePrimaryColor: "#e2e8f0",
      themeAccentColor: "#f59e0b",
      themeNameColor: "#f8fafc",
      themeBioColor: "#a1a1aa",
      themeNameFont: "elegant",
      themeBioFont: "serif",
      themeButtonStyle: "rounded",
      themeCardStyle: "outline",
    },
    {
      id: "sage",
      label: "Sage Garden",
      themeMode: "light",
      themeBackgroundColor: "#f5f7f2",
      themeBackgroundPattern: "petals",
      themePrimaryColor: "#14532d",
      themeAccentColor: "#65a30d",
      themeNameColor: "#14532d",
      themeBioColor: "#4b5563",
      themeNameFont: "elegant",
      themeBioFont: "serif",
      themeButtonStyle: "pill",
      themeCardStyle: "soft",
    },
    {
      id: "candy",
      label: "Candy Pop",
      themeMode: "light",
      themeBackgroundColor: "#fff1f2",
      themeBackgroundPattern: "confetti",
      themePrimaryColor: "#fb7185",
      themeAccentColor: "#60a5fa",
      themeNameColor: "#1f2937",
      themeBioColor: "#6b7280",
      themeNameFont: "display",
      themeBioFont: "grotesk",
      themeButtonStyle: "rounded",
      themeCardStyle: "soft",
    },
    {
      id: "cosmic",
      label: "Cosmic Drift",
      themeMode: "dark",
      themeBackgroundColor: "#0b1120",
      themeBackgroundPattern: "stars",
      themePrimaryColor: "#a78bfa",
      themeAccentColor: "#38bdf8",
      themeNameColor: "#f8fafc",
      themeBioColor: "#cbd5f5",
      themeNameFont: "display",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "solid",
    },
    {
      id: "desert",
      label: "Desert Glow",
      themeMode: "light",
      themeBackgroundColor: "#fff7ed",
      themeBackgroundPattern: "sunset",
      themePrimaryColor: "#c2410c",
      themeAccentColor: "#f59e0b",
      themeNameColor: "#7c2d12",
      themeBioColor: "#7c2d12",
      themeNameFont: "elegant",
      themeBioFont: "serif",
      themeButtonStyle: "rounded",
      themeCardStyle: "soft",
    },
    {
      id: "iris",
      label: "Iris Bloom",
      themeMode: "light",
      themeBackgroundColor: "#f5f3ff",
      themeBackgroundPattern: "gradient-radial",
      themePrimaryColor: "#6d28d9",
      themeAccentColor: "#22d3ee",
      themeNameColor: "#3b0764",
      themeBioColor: "#475569",
      themeNameFont: "display",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "soft",
    },
    {
      id: "mono",
      label: "Mono Studio",
      themeMode: "light",
      themeBackgroundColor: "#f8fafc",
      themeBackgroundPattern: "paper",
      themePrimaryColor: "#0f172a",
      themeAccentColor: "#64748b",
      themeNameColor: "#0f172a",
      themeBioColor: "#475569",
      themeNameFont: "condensed",
      themeBioFont: "system",
      themeButtonStyle: "square",
      themeCardStyle: "outline",
    },
    {
      id: "holo",
      label: "Holo Bloom",
      themeMode: "light",
      themeBackgroundColor: "#ecfeff",
      themeBackgroundPattern: "hologram",
      themePrimaryColor: "#0ea5e9",
      themeAccentColor: "#a855f7",
      themeNameColor: "#0f172a",
      themeBioColor: "#475569",
      themeNameFont: "display",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "soft",
    },
    {
      id: "curves",
      label: "Big Curves",
      themeMode: "light",
      themeBackgroundColor: "#eef2ff",
      themeBackgroundPattern: "waves",
      themePrimaryColor: "#4f46e5",
      themeAccentColor: "#0ea5e9",
      themeNameColor: "#312e81",
      themeBioColor: "#475569",
      themeNameFont: "rounded",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "soft",
    },
    {
      id: "blocks",
      label: "Block Party",
      themeMode: "light",
      themeBackgroundColor: "#fef3c7",
      themeBackgroundPattern: "blocks",
      themePrimaryColor: "#ea580c",
      themeAccentColor: "#f97316",
      themeNameColor: "#7c2d12",
      themeBioColor: "#7c2d12",
      themeNameFont: "headline",
      themeBioFont: "grotesk",
      themeButtonStyle: "rounded",
      themeCardStyle: "solid",
    },
    {
      id: "glyph",
      label: "Glyph Wave",
      themeMode: "light",
      themeBackgroundColor: "#eef2ff",
      themeBackgroundPattern: "glyphs",
      themePrimaryColor: "#6366f1",
      themeAccentColor: "#0ea5e9",
      themeNameColor: "#1e1b4b",
      themeBioColor: "#475569",
      themeNameFont: "condensed",
      themeBioFont: "mono",
      themeButtonStyle: "square",
      themeCardStyle: "outline",
    },
    {
      id: "pixel",
      label: "Pixel Pop",
      themeMode: "light",
      themeBackgroundColor: "#f8fafc",
      themeBackgroundPattern: "pixel",
      themePrimaryColor: "#0ea5e9",
      themeAccentColor: "#a855f7",
      themeNameColor: "#0f172a",
      themeBioColor: "#475569",
      themeNameFont: "tech",
      themeBioFont: "mono",
      themeButtonStyle: "square",
      themeCardStyle: "outline",
    },
    {
      id: "tartan",
      label: "City Tartan",
      themeMode: "dark",
      themeBackgroundColor: "#0b1120",
      themeBackgroundPattern: "tartan",
      themePrimaryColor: "#38bdf8",
      themeAccentColor: "#22c55e",
      themeNameColor: "#f8fafc",
      themeBioColor: "#cbd5f5",
      themeNameFont: "headline",
      themeBioFont: "grotesk",
      themeButtonStyle: "pill",
      themeCardStyle: "solid",
    },
    {
      id: "arches",
      label: "Soft Arches",
      themeMode: "light",
      themeBackgroundColor: "#fff7ed",
      themeBackgroundPattern: "arches",
      themePrimaryColor: "#fb7185",
      themeAccentColor: "#f59e0b",
      themeNameColor: "#7c2d12",
      themeBioColor: "#7c2d12",
      themeNameFont: "elegant",
      themeBioFont: "serif",
      themeButtonStyle: "rounded",
      themeCardStyle: "soft",
    },
  ] as const

  const getPatternStyle = (patternId: string, baseColor: string) => {
    const style: Record<string, string | number> = { backgroundColor: baseColor }
    if (patternId === "gradient") {
      style.backgroundImage = "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(16,185,129,0.35))"
    } else if (patternId === "mesh") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.4), transparent 55%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.4), transparent 50%), radial-gradient(circle at 40% 80%, rgba(14,165,233,0.35), transparent 60%)"
    } else if (patternId === "confetti") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(236,72,153,0.5) 0 8%, transparent 9%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.5) 0 6%, transparent 7%), radial-gradient(circle at 30% 80%, rgba(16,185,129,0.5) 0 7%, transparent 8%), radial-gradient(circle at 70% 70%, rgba(245,158,11,0.5) 0 6%, transparent 7%)"
    } else if (patternId === "grid") {
      style.backgroundImage = "linear-gradient(rgba(15,23,42,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.15) 1px, transparent 1px)"
      style.backgroundSize = "16px 16px"
    } else if (patternId === "waves") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 10%, rgba(14,165,233,0.35), transparent 55%), radial-gradient(circle at 80% 30%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.35), transparent 55%)"
    } else if (patternId === "aurora") {
      style.backgroundImage =
        "linear-gradient(120deg, rgba(14,165,233,0.35), rgba(16,185,129,0.28), rgba(59,130,246,0.22)), radial-gradient(circle at 15% 20%, rgba(236,72,153,0.25), transparent 55%)"
    } else if (patternId === "sunset") {
      style.backgroundImage = "linear-gradient(140deg, rgba(251,191,36,0.35), rgba(248,113,113,0.35), rgba(244,63,94,0.25))"
    } else if (patternId === "neon") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.4), transparent 55%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.4), transparent 55%), radial-gradient(circle at 50% 80%, rgba(59,130,246,0.35), transparent 60%)"
    } else if (patternId === "paper") {
      style.backgroundImage = "linear-gradient(0deg, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)"
      style.backgroundSize = "16px 16px"
    } else if (patternId === "dots") {
      style.backgroundImage = "radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)"
      style.backgroundSize = "16px 16px"
    } else if (patternId === "stripes") {
      style.backgroundImage = "repeating-linear-gradient(45deg, rgba(15,23,42,0.12) 0 10px, transparent 10px 20px)"
    } else if (patternId === "topo") {
      style.backgroundImage = "repeating-radial-gradient(circle at 30% 30%, rgba(15,23,42,0.12) 0 2px, transparent 3px 10px)"
    } else if (patternId === "noise") {
      style.backgroundImage =
        "repeating-linear-gradient(0deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 2px)"
      style.backgroundSize = "12px 12px"
    } else if (patternId === "zigzag") {
      style.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.14) 0 6px, transparent 6px 12px)"
    } else if (patternId === "halftone") {
      style.backgroundImage = "radial-gradient(rgba(15,23,42,0.22) 1px, transparent 2px)"
      style.backgroundSize = "14px 14px"
    } else if (patternId === "ripple") {
      style.backgroundImage = "repeating-radial-gradient(circle at 50% 50%, rgba(15,23,42,0.12) 0 2px, transparent 3px 14px)"
    } else if (patternId === "petals") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(236,72,153,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(14,165,233,0.25), transparent 55%), radial-gradient(circle at 40% 80%, rgba(16,185,129,0.25), transparent 60%)"
    } else if (patternId === "diagonal") {
      style.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.1) 0 8px, transparent 8px 16px)"
    } else if (patternId === "stars") {
      style.backgroundImage = "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 2px)"
      style.backgroundSize = "18px 18px"
    } else if (patternId === "gradient-radial") {
      style.backgroundImage =
        "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.3), transparent 60%)"
    } else if (patternId === "glow") {
      style.backgroundImage =
        "radial-gradient(circle at 50% 20%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.25), transparent 55%)"
    } else if (patternId === "checkers") {
      style.backgroundImage =
        "linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15,23,42,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(15,23,42,0.08) 75%)"
      style.backgroundSize = "20px 20px"
    } else if (patternId === "chevron") {
      style.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.12) 0 6px, transparent 6px 12px), repeating-linear-gradient(45deg, rgba(15,23,42,0.08) 0 6px, transparent 6px 12px)"
    } else if (patternId === "blobs") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 70% 20%, rgba(236,72,153,0.25), transparent 50%), radial-gradient(circle at 60% 80%, rgba(16,185,129,0.22), transparent 55%)"
    } else if (patternId === "prism") {
      style.backgroundImage =
        "linear-gradient(120deg, rgba(14,165,233,0.3), rgba(99,102,241,0.25), rgba(236,72,153,0.22)), repeating-linear-gradient(45deg, rgba(15,23,42,0.08) 0 8px, transparent 8px 16px)"
    } else if (patternId === "lava") {
      style.backgroundImage =
        "radial-gradient(circle at 20% 70%, rgba(249,115,22,0.4), transparent 55%), radial-gradient(circle at 70% 20%, rgba(244,63,94,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(234,179,8,0.3), transparent 55%)"
    } else if (patternId === "hologram") {
      style.backgroundImage =
        "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(168,85,247,0.26), rgba(34,211,238,0.22)), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)"
    } else if (patternId === "blocks") {
      style.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(15,23,42,0.12) 12px, transparent 12px), linear-gradient(90deg, rgba(15,23,42,0.12) 12px, transparent 12px)"
      style.backgroundSize = "96px 96px"
    } else if (patternId === "glyphs") {
      style.backgroundImage =
        "radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.12) 2px, transparent 2px)"
      style.backgroundSize = "48px 48px"
    } else if (patternId === "pixel") {
      style.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.1) 1px, transparent 1px)"
      style.backgroundSize = "28px 28px"
    } else if (patternId === "tartan") {
      style.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.18) 2px, transparent 2px), linear-gradient(90deg, rgba(15,23,42,0.18) 2px, transparent 2px), linear-gradient(0deg, rgba(15,23,42,0.08) 10px, transparent 10px), linear-gradient(90deg, rgba(15,23,42,0.08) 10px, transparent 10px)"
      style.backgroundSize = "80px 80px"
    } else if (patternId === "arches") {
      style.backgroundImage =
        "radial-gradient(circle at 50% 0%, rgba(15,23,42,0.12) 0 18px, transparent 19px), radial-gradient(circle at 0% 50%, rgba(15,23,42,0.08) 0 18px, transparent 19px)"
      style.backgroundSize = "96px 96px"
    } else if (patternId === "swoosh") {
      style.backgroundImage =
        "radial-gradient(circle at 10% 20%, rgba(14,165,233,0.32), transparent 60%), radial-gradient(circle at 90% 10%, rgba(168,85,247,0.28), transparent 55%), linear-gradient(135deg, rgba(251,191,36,0.2), transparent 70%)"
    } else if (patternId === "orbit") {
      style.backgroundImage =
        "radial-gradient(circle at 50% 50%, rgba(15,23,42,0.18) 0 2px, transparent 3px), radial-gradient(circle at 30% 30%, rgba(59,130,246,0.28), transparent 55%), radial-gradient(circle at 70% 60%, rgba(16,185,129,0.24), transparent 60%)"
    } else if (patternId === "ribbon") {
      style.backgroundImage =
        "linear-gradient(160deg, rgba(59,130,246,0.3), transparent 60%), linear-gradient(20deg, rgba(236,72,153,0.28), transparent 65%)"
    } else if (patternId === "bubble") {
      style.backgroundImage =
        "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 60% 80%, rgba(16,185,129,0.2), transparent 60%)"
    } else if (patternId === "petal-arc") {
      style.backgroundImage =
        "radial-gradient(circle at 50% 10%, rgba(236,72,153,0.22), transparent 60%), radial-gradient(circle at 0% 70%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(circle at 100% 70%, rgba(59,130,246,0.2), transparent 60%)"
    }
    return style
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(87,107,149,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Theme & Design</h3>
                <p className="text-xs text-slate-500">Control colors, buttons, and storefront vibe.</p>
              </div>
              <Button type="submit" className="h-9 rounded-full px-4 text-sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save theme"}
              </Button>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Start with a preset</h4>
                <p className="text-xs text-slate-500">Choose a vibe, then customize.</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {vibePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      form.setValue("themeMode", preset.themeMode)
                      form.setValue("themeBackgroundColor", preset.themeBackgroundColor)
                      form.setValue("themeBackgroundPattern", preset.themeBackgroundPattern)
                      form.setValue("themePrimaryColor", preset.themePrimaryColor)
                      form.setValue("themeAccentColor", preset.themeAccentColor)
                      form.setValue("themeNameColor", preset.themeNameColor)
                      form.setValue("themeBioColor", preset.themeBioColor)
                      form.setValue("themeNameFont", preset.themeNameFont)
                      form.setValue("themeBioFont", preset.themeBioFont)
                      form.setValue("themeButtonStyle", preset.themeButtonStyle)
                      form.setValue("themeCardStyle", preset.themeCardStyle)
                    }}
                    className="group flex min-w-[180px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
                  >
                    <span
                      className="w-full rounded-lg border border-slate-200"
                      style={{ aspectRatio: "9 / 16", ...getPatternStyle(preset.themeBackgroundPattern, preset.themeBackgroundColor) }}
                    />
                    <span className="text-xs font-semibold text-slate-900">{preset.label}</span>
                    <span className="text-[11px] text-slate-500">
                      {preset.themeMode === "dark" ? "Dark" : "Light"} · {preset.themeButtonStyle} · {preset.themeCardStyle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">Buttons & colors</h4>
              <p className="text-xs text-slate-500">Pick your button, accent, and background colors.</p>

              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="themeBackgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Background color
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={field.value || DEFAULT_BACKGROUND}
                            onChange={(event) => field.onChange(event.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white"
                            aria-label="Background color picker"
                          />
                          <Input {...field} className="h-10" placeholder="#f8fafc" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themePrimaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Button color
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={field.value || DEFAULT_PRIMARY}
                            onChange={(event) => field.onChange(event.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white"
                            aria-label="Primary color picker"
                          />
                          <Input {...field} className="h-10" placeholder="#0f172a" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themeAccentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Accent color
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={field.value || DEFAULT_ACCENT}
                            onChange={(event) => field.onChange(event.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white"
                            aria-label="Accent color picker"
                          />
                          <Input {...field} className="h-10" placeholder="#6366f1" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold">Preview</span>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: backgroundColorValue }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColorValue }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColorValue }} />
                  <span>Background + button + accent swatches</span>
                </div> */}
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">Typography</h4>
              <p className="text-xs text-slate-500">Tune name and bio styling.</p>

              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="themeNameColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Name color
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={field.value || DEFAULT_NAME_COLOR}
                            onChange={(event) => field.onChange(event.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white"
                            aria-label="Name color picker"
                          />
                          <Input {...field} className="h-10" placeholder="#0f172a" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themeBioColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Bio color
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={field.value || DEFAULT_BIO_COLOR}
                            onChange={(event) => field.onChange(event.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white"
                            aria-label="Bio color picker"
                          />
                          <Input {...field} className="h-10" placeholder="#475569" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themeNameFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Name font
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Choose font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="themeBioFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Bio font
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Choose font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p className="text-sm font-semibold" style={{ color: nameColorValue }}>
                    Name preview
                  </p>
                  <p className="text-xs" style={{ color: bioColorValue }}>
                    Bio preview text goes here.
                  </p>
                </div> */}
              </div>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Layout controls</h4>
            <p className="text-xs text-slate-500">Style buttons, cards, and the overall tone.</p>

            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="themeBackgroundPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Background style
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {backgroundPatterns.map((pattern) => {
                          const isSelected = field.value === pattern.id
                          return (
                            <button
                              key={pattern.id}
                              type="button"
                              onClick={() => field.onChange(pattern.id)}
                              className={cn(
                                "group flex min-w-[160px] flex-col gap-2 rounded-xl border p-2 text-left text-xs font-semibold text-slate-700 transition",
                                isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300",
                              )}
                            >
                              <span
                                className={cn("w-full rounded-lg border", isSelected ? "border-slate-900" : "border-slate-200")}
                                style={{ aspectRatio: "9 / 16", ...getPatternStyle(pattern.id, backgroundColorValue) }}
                              />
                              <span>{pattern.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Theme mode
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Button style
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pill">Pill</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Card style
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeFooterVisible"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        Show footer on storefront
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className={cn("flex items-center justify-end gap-3")}>
            <Button type="submit" className="h-10 rounded-full px-5" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save theme"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
