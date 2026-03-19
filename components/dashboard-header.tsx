import type React from "react"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="mb-2.5 flex flex-col gap-2 px-0.5 md:mb-5 md:flex-row md:items-start md:justify-between md:px-0">
      <div className="grid gap-0.5">
        <h1 className="text-[1rem] font-semibold tracking-tight text-[#162033] sm:text-lg md:text-xl">{heading}</h1>
        {text && <p className="text-[11px] leading-5 text-[#5f6b7e] sm:text-[13px] md:text-sm">{text}</p>}
      </div>
      {children}
    </div>
  )
}
