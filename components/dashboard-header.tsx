import type React from "react"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="mb-3 flex flex-col gap-3 px-1 md:mb-5 md:flex-row md:items-start md:justify-between md:px-0">
      <div className="grid gap-1">
        <h1 className="text-base font-semibold text-[#1c1917] sm:text-lg md:text-xl">{heading}</h1>
        {text && <p className="text-[13px] leading-6 text-[#5f6b7e] md:text-sm">{text}</p>}
      </div>
      {children}
    </div>
  )
}
