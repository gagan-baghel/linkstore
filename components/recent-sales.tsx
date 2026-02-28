import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"

interface RecentSalesProps {
  recentClicks?: any[]
}

export function RecentSales({ recentClicks = [] }: RecentSalesProps) {
  if (!recentClicks || recentClicks.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">No recent activity</p>
            <p className="text-sm text-muted-foreground">Add products to your store to get started</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {recentClicks.map((click) => (
        <div key={click._id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {click.productId && typeof click.productId === "object" && click.productId.title
                ? click.productId.title.charAt(0).toUpperCase()
                : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {click.productId && typeof click.productId === "object" ? click.productId.title : "Unknown Product"}
            </p>
            <p className="text-sm text-muted-foreground">
              {click.createdAt ? format(new Date(click.createdAt), "MMM d, yyyy HH:mm") : "Unknown Date"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
