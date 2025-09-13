"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import type { Profile } from "@/lib/types"

interface UserMenuProps {
  user: Profile
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Hard redirect to clear all state
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("[Logout failed]", error)
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const getRoleDisplayName = (role: string) =>
    role === "career_counselor" ? "Career Counselor" : role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* Use a portal to prevent clipping */}
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-56 z-[9999]" align="end" sideOffset={8} forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">{getRoleDisplayName(user.role)}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`/dashboard/${user.role}/profile`} className="cursor-pointer">
              Profile
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={`/dashboard/${user.role}/settings`} className="cursor-pointer">
              Settings
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
