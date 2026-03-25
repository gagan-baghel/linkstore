import type React from "react"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 px-0.5 md:mb-6 md:flex-row md:items-start md:justify-between md:px-0">
      <div className="grid gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Dashboard</p>
        <h1 className="text-[1.15rem] font-semibold tracking-tight text-slate-900 sm:text-xl md:text-2xl">{heading}</h1>
        {text && <p className="text-[12px] leading-5 text-slate-500 sm:text-sm">{text}</p>}
      </div>
      {children}
    </div>
  )
}
