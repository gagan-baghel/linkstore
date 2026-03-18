import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 caret-slate-900 outline-none transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4',
        'focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-200',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
