import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 caret-slate-900 outline-none transition-[border-color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-4',
        'focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-200',
        'aria-invalid:border-rose-300 aria-invalid:ring-2 aria-invalid:ring-rose-100',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
