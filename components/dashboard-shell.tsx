import type React from "react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-page-shell flex-1 min-w-0 overflow-x-clip bg-transparent px-2.5 py-2.5 pb-24 sm:px-4 sm:py-4 md:px-6 md:py-6 md:pb-6">
      <div className="mx-auto min-w-0 w-full max-w-[28rem] sm:max-w-none">{children}</div>
    </div>
  )
}
