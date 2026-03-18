"use client"

import { format } from "date-fns"
import { ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClicksTableProps {
  clicks: any[]
}

export function ClicksTable({ clicks }: ClicksTableProps) {
  return (
    <div className="space-y-4">
      {!clicks || clicks.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No click data available yet.</p>
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {clicks.map((click) => (
              <div key={click._id.toString ? click._id.toString() : click._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {click.productId && typeof click.productId === "object" ? click.productId.title : "Unknown Product"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {click.createdAt ? format(new Date(click.createdAt), "MMM d, yyyy HH:mm") : "Unknown Date"}
                </p>
                <div className="mt-2">
                  {click.productId && typeof click.productId === "object" && click.productId.affiliateUrl ? (
                    <a
                      href={click.productId.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Open link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No link</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.map((click) => (
                  <TableRow key={click._id.toString ? click._id.toString() : click._id}>
                    <TableCell className="font-medium">
                      {click.productId && typeof click.productId === "object" ? click.productId.title : "Unknown Product"}
                    </TableCell>
                    <TableCell>
                      {click.createdAt ? format(new Date(click.createdAt), "MMM d, yyyy HH:mm") : "Unknown Date"}
                    </TableCell>
                    <TableCell>
                      {click.productId && typeof click.productId === "object" && click.productId.affiliateUrl ? (
                        <a
                          href={click.productId.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:underline"
                        >
                          <span className="sr-only">Visit</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No link</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
