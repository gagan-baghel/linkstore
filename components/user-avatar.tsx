import type { User } from "next-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  user: Pick<User, "name" | "image">
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {user.image ? (
        <AvatarImage alt="Profile picture" src={user.image || "/placeholder.svg"} />
      ) : (
        <AvatarFallback>
          {user.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            : "?"}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
