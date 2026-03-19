import type React from "react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex-1 bg-transparent px-2.5 py-2.5 pb-24 sm:px-4 sm:py-4 md:px-6 md:py-6 md:pb-6">
      <div className="mx-auto w-full max-w-[28rem] sm:max-w-none">{children}</div>
    </div>
  )
}
