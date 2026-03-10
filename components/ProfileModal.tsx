"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, User } from "lucide-react"

export interface ProfileModalUser {
  id: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  age?: number | null
  city?: string | null
  isMale?: boolean | null
}

interface ProfileModalProps {
  user: ProfileModalUser | null
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center pt-2">
          <Avatar className="w-24 h-24 mb-4">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-red-600 text-white text-2xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>

          <div className="flex items-center gap-2 mt-2">
            {/* {user.age && (
              <Badge variant="secondary" className="text-xs">
                {user.age} years old
              </Badge>
            )} */}
            {user.isMale !== undefined && user.isMale !== null && (
              <Badge
                variant="secondary"
                className={
                  user.isMale
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs"
                    : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 text-xs"
                }
              >
                {user.isMale ? "Male" : "Female"}
              </Badge>
            )}
          </div>

          {/* {user.city && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {user.city}
            </p>
          )} */}

          {user.bio ? (
            <div className="mt-4 w-full text-left">
              <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-line break-words">
                {user.bio}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4 italic">No bio yet</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
