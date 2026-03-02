import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  user: {
    name?: string | null
    image?: string | null
  }
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
