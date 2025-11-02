"use client"

import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Calendar, Plus, User, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Calendar className="h-6 w-6" />
          EventHub
        </Link>
        
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
          ) : session ? (
            <>
              <Button variant="ghost" asChild className="hover-lift">
                <Link href="/events">Browse Events</Link>
              </Button>
              
              {session.user.role === "organizer" && (
                <Button variant="ghost" asChild className="hover-lift">
                  <Link href="/dashboard/events/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              )}
              
              <Button variant="ghost" asChild className="hover-lift">
                <Link href="/dashboard">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              
              <ThemeToggle />
              
              <Button 
                variant="ghost" 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hover-lift"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hover-lift">
                <Link href="/events">Browse Events</Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" asChild className="hover-lift">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hover-lift">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}