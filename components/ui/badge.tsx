import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-white/30 bg-linear-to-br from-indigo-400 to-violet-500 text-white shadow-[0_8px_16px_rgba(125,104,255,0.28),inset_1px_1px_3px_rgba(255,255,255,0.44)]',
        secondary:
          'border-white/60 bg-linear-to-br from-white/85 to-sky-100/85 text-secondary-foreground shadow-[5px_5px_11px_rgba(155,171,219,0.25),-5px_-5px_11px_rgba(255,255,255,0.82)]',
        destructive:
          'border-red-300/65 bg-linear-to-br from-rose-400 to-red-500 text-white shadow-[0_8px_16px_rgba(239,95,95,0.28),inset_1px_1px_3px_rgba(255,255,255,0.44)]',
        outline:
          'border-white/65 bg-linear-to-br from-white/82 to-indigo-50/82 text-foreground shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_7px_rgba(161,176,215,0.2)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
