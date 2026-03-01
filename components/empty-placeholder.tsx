import type * as React from "react"
import { Package } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({ className, children, ...props }: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed border-slate-400/80 bg-white p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

interface EmptyPlaceholderIconProps extends Partial<React.SVGProps<SVGSVGElement>> {
  name: string
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({ name, className, ...props }: EmptyPlaceholderIconProps) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
      <Package className={cn("h-10 w-10 text-white", className)} {...props} />
    </div>
  )
}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("mt-6 text-xl font-semibold text-slate-900", className)} {...props} />
}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-3 mb-8 text-center text-sm font-normal leading-6 text-slate-600", className)}
      {...props}
    />
  )
}
