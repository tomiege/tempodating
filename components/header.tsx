"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">Tempo</span>
          </Link>

          {isHomePage && (
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#speed-dating" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Speed Dating
              </Link>
              <Link href="#workshops" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Workshops
              </Link>
              {/* <Link href="#products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Products
              </Link> */}
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
            </nav>
          )}

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 cursor-pointer">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {isHomePage && (
              <>
                <Link href="#speed-dating" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Speed Dating
                </Link>
                <Link href="#workshops" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Workshops
                </Link>
                <Link href="#products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </Link>
                <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </>
            )}
            <div className={`flex flex-col gap-2 ${isHomePage ? 'pt-4 border-t border-border' : ''}`}>
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 cursor-pointer">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
