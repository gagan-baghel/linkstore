import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/35 focus-visible:ring-[4px] active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground border border-white/35 bg-linear-to-br from-indigo-400 to-violet-500 shadow-[0_14px_28px_rgba(125,104,255,0.36),inset_1px_1px_3px_rgba(255,255,255,0.5)] hover:brightness-105 active:shadow-[inset_1px_1px_5px_rgba(61,47,145,0.35),inset_-2px_-2px_6px_rgba(177,158,255,0.6)]',
        destructive:
          'text-destructive-foreground border border-white/25 bg-linear-to-br from-rose-400 to-red-500 shadow-[0_14px_28px_rgba(235,92,92,0.35),inset_1px_1px_3px_rgba(255,255,255,0.52)] hover:brightness-105 active:shadow-[inset_1px_1px_5px_rgba(146,47,47,0.38),inset_-2px_-2px_6px_rgba(255,162,162,0.52)]',
        outline:
          'text-foreground border border-white/65 bg-linear-to-br from-white/85 to-indigo-50/85 shadow-[7px_7px_16px_rgba(155,171,219,0.28),-6px_-6px_14px_rgba(255,255,255,0.9)] hover:brightness-[1.03] active:shadow-[inset_2px_2px_7px_rgba(154,168,209,0.25),inset_-2px_-2px_7px_rgba(255,255,255,0.86)]',
        secondary:
          'text-secondary-foreground border border-white/55 bg-linear-to-br from-sky-100/95 to-violet-100/95 shadow-[8px_8px_16px_rgba(162,178,221,0.3),-7px_-7px_14px_rgba(255,255,255,0.86)] hover:brightness-[1.02] active:shadow-[inset_2px_2px_7px_rgba(161,175,214,0.27),inset_-2px_-2px_7px_rgba(255,255,255,0.86)]',
        ghost:
          'text-foreground/85 border border-transparent bg-transparent shadow-none hover:bg-white/35 hover:shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_6px_rgba(160,175,212,0.2)]',
        link: 'text-primary underline-offset-4 hover:underline shadow-none border-none bg-transparent',
      },
      size: {
        default: 'h-11 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-4 text-xs has-[>svg]:px-3',
        lg: 'h-12 px-7 text-base has-[>svg]:px-5',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
