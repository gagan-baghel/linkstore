import type React from "react"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return <div className="flex-1 bg-slate-50 px-2 py-2 pb-20 sm:px-4 sm:py-4 md:px-6 md:py-6 md:pb-6">{children}</div>
}
