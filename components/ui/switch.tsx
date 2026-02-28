'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-white/60 bg-linear-to-br from-white/90 to-indigo-100/82 p-1 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.88),inset_-2px_-2px_7px_rgba(161,176,215,0.24)] transition-all outline-none data-[state=checked]:bg-linear-to-br data-[state=checked]:from-indigo-400 data-[state=checked]:to-violet-500 data-[state=checked]:shadow-[0_10px_22px_rgba(128,108,255,0.34),inset_1px_1px_3px_rgba(255,255,255,0.48)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:shadow-[0_0_0_4px_rgba(138,124,255,0.2)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 rounded-full bg-white shadow-[3px_3px_8px_rgba(128,146,197,0.3),-2px_-2px_6px_rgba(255,255,255,0.76)] ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
