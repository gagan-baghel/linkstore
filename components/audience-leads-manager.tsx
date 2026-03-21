"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { format } from "date-fns"
import { Download, Mail, MessageCircle, Search, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AudienceLead = {
  _id: string
  createdAt: number
  email?: string
  whatsapp?: string
  status: "new" | "contacted" | "qualified" | "archived"
  source?: string
  campaign?: string
  collectionSlug?: string
}

function toCsv(rows: AudienceLead[]) {
  const header = ["Captured At", "Email", "WhatsApp", "Source", "Campaign", "Collection", "Status"]
  const lines = rows.map((row) => [
    format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
    row.email || "",
    row.whatsapp || "",
    row.source || "",
    row.campaign || "",
    row.collectionSlug || "",
    row.status,
  ])

  return [header, ...lines]
    .map((line) => line.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n")
}

function getStatusVariant(status: AudienceLead["status"]) {
  switch (status) {
    case "qualified":
      return "default" as const
    case "contacted":
      return "secondary" as const
    case "archived":
      return "outline" as const
    default:
      return "secondary" as const
  }
}

export function AudienceLeadsManager({ leads }: { leads: AudienceLead[] }) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const filteredLeads = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    if (!normalizedQuery) return leads

    return leads.filter((lead) => {
      const haystack = [
        lead.email || "",
        lead.whatsapp || "",
        lead.source || "",
        lead.campaign || "",
        lead.collectionSlug || "",
        lead.status,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [deferredQuery, leads])

  const totals = useMemo(() => {
    let emailReady = 0
    let whatsappReady = 0

    for (const lead of leads) {
      if ((lead.email || "").trim()) emailReady += 1
      if ((lead.whatsapp || "").trim()) whatsappReady += 1
    }

    return {
      total: leads.length,
      emailReady,
      whatsappReady,
    }
  }, [leads])

  function handleExport() {
    const csv = toCsv(filteredLeads)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "audience-leads.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const summaryCardClassName =
    "app-reveal app-surface content-auto min-w-0 rounded-[1.3rem] border border-[#d8e2f3] bg-white/90 p-4 shadow-[0_18px_40px_rgba(87,107,149,0.08)] backdrop-blur-sm md:rounded-[1.45rem] md:p-5"

  return (
    <div className="grid gap-4 md:gap-6">
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <div className={summaryCardClassName}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="rounded-2xl border border-[#dce6f6] bg-[#f6f9ff] p-2.5 text-[#5d6f91]">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6b7e]">Total Leads</p>
          </div>
          <div className="text-[2rem] font-semibold tracking-tight text-[#1c1917]">{totals.total}</div>
          <p className="mt-1 text-sm text-[#70809c]">Captured contacts from your storefront.</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="rounded-2xl border border-[#dce6f6] bg-[#f6f9ff] p-2.5 text-[#5d6f91]">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6b7e]">Email Reachable</p>
          </div>
          <div className="text-[2rem] font-semibold tracking-tight text-[#1c1917]">{totals.emailReady}</div>
          <p className="mt-1 text-sm text-[#70809c]">Contacts with an email address.</p>
        </div>
        <div className={summaryCardClassName}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="rounded-2xl border border-[#dce6f6] bg-[#f6f9ff] p-2.5 text-[#5d6f91]">
              <MessageCircle className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f6b7e]">WhatsApp Reachable</p>
          </div>
          <div className="text-[2rem] font-semibold tracking-tight text-[#1c1917]">{totals.whatsappReady}</div>
          <p className="mt-1 text-sm text-[#70809c]">Contacts ready for WhatsApp follow-up.</p>
        </div>
      </div>

      <section className="app-reveal app-surface content-auto rounded-[1.4rem] border border-[#d8e2f3] bg-white/90 p-4 shadow-[0_18px_40px_rgba(87,107,149,0.08)] backdrop-blur-sm md:rounded-[1.6rem] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1c1917]">Captured Contacts</h2>
            <p className="mt-1 text-sm text-[#70809c]">Search, review, and export the shoppers who opted in from your storefront.</p>
          </div>
          <div className="grid w-full gap-2 lg:w-auto lg:grid-cols-[minmax(0,19rem)_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leads"
                aria-label="Search leads"
                className="h-11 w-full min-w-0 pl-9"
              />
            </div>
            <Button type="button" variant="outline" className="h-11 w-full lg:w-auto" onClick={handleExport} disabled={filteredLeads.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Captured</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-[#8a94a8]">
                    No captured contacts yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell className="text-xs text-[#5f6b7e]">{format(new Date(lead.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell className="text-[#5f6b7e]">{lead.email || "—"}</TableCell>
                    <TableCell className="text-[#5f6b7e]">{lead.whatsapp || "—"}</TableCell>
                    <TableCell className="capitalize text-[#5f6b7e]">{lead.source || "direct"}</TableCell>
                    <TableCell className="text-[#5f6b7e]">{lead.campaign || "Organic"}</TableCell>
                    <TableCell className="text-[#5f6b7e]">{lead.collectionSlug || "Unattributed"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(lead.status)} className="capitalize">
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
