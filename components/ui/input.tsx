import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground border border-white/65 h-11 w-full min-w-0 rounded-2xl bg-linear-to-br from-white/78 to-indigo-50/70 px-4 py-2 text-base text-slate-900 placeholder:text-slate-500/85 caret-slate-900 dark:text-slate-900 dark:placeholder:text-slate-500 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_7px_rgba(161,176,215,0.2)] transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-white/90 focus-visible:shadow-[0_0_0_4px_rgba(138,124,255,0.2),inset_1px_1px_3px_rgba(255,255,255,0.95),inset_-2px_-2px_8px_rgba(161,176,215,0.25)]',
        'aria-invalid:shadow-[0_0_0_4px_rgba(243,96,96,0.19),inset_1px_1px_3px_rgba(255,255,255,0.95),inset_-2px_-2px_8px_rgba(237,143,143,0.2)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
