import type React from "react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-page-shell flex-1 min-w-0 overflow-x-clip bg-transparent px-3 py-3 pb-24 sm:px-5 sm:py-5 md:px-7 md:py-7 md:pb-7">
      <div className="mx-auto min-w-0 w-full max-w-[30rem] sm:max-w-none">{children}</div>
    </div>
  )
}
