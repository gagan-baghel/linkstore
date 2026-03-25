import type React from "react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-page-shell flex-1 min-w-0 overflow-x-clip bg-transparent px-4 py-4 pb-24 sm:px-6 sm:py-6 md:px-8 md:py-8 md:pb-8">
      <div className="mx-auto min-w-0 w-full max-w-6xl">{children}</div>
    </div>
  )
}
