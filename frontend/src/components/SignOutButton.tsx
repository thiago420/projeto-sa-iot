"use client"

import { signOut } from "next-auth/react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export default function SignOutButton() {
  return (
    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
      Sair
    </DropdownMenuItem>
  )
}
