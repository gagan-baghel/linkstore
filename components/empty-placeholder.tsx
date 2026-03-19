import type * as React from "react"
import { Package } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({ className, children, ...props }: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[17rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-5 text-center sm:min-h-96 sm:rounded-md sm:p-8",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

interface EmptyPlaceholderIconProps extends Partial<React.SVGProps<SVGSVGElement>> {
  name: string
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({ name, className, ...props }: EmptyPlaceholderIconProps) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 sm:h-20 sm:w-20">
      <Package className={cn("h-7 w-7 text-white sm:h-10 sm:w-10", className)} {...props} />
    </div>
  )
}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("mt-4 text-lg font-semibold text-slate-900 sm:mt-6 sm:text-xl", className)} {...props} />
}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mb-6 mt-2 text-center text-[13px] font-normal leading-5 text-slate-600 sm:mb-8 sm:mt-3 sm:text-sm sm:leading-6", className)}
      {...props}
    />
  )
}
