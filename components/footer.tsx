"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Instagram, Twitter, Facebook, Youtube, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Thanks for subscribing!' })
        setEmail("")
      } else {
        setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-semibold text-background">Tempo</span>
            </Link>
            <p className="text-background/60 text-sm mb-4">
              Finding love at the right pace. Online speed dating for meaningful connections.
            </p>
            {/* <div className="flex items-center gap-4">
              <Link href="#" className="text-background/60 hover:text-background transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </Link>
            </div> */}
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Speed Dating</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/products/onlineSpeedDating" className="text-background/60 hover:text-background transition-colors">Find Events</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Workshops</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/products/workshop" className="text-background/60 hover:text-background transition-colors">Browse Workshops</Link></li>
              <li><Link href="/products/workshop" className="text-background/60 hover:text-background transition-colors">Gift a Workshop</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-background/60 hover:text-background transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="text-background/60 hover:text-background transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="text-background/60 hover:text-background transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-background/60 hover:text-background transition-colors">Contact</Link></li>
              {/* <li><Link href="/press" className="text-background/60 hover:text-background transition-colors">Press</Link></li> */}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="font-semibold text-background mb-4">Stay Updated</h3>
            <p className="text-background/60 text-sm mb-4">
              Get dating tips and event updates in your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
              />
              <Button 
                type="submit"
                variant="secondary" 
                size="sm" 
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </Button>
            </form>
            {message && (
              <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} Tempo Dating. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-background/40 hover:text-background transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-background/40 hover:text-background transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-background/40 hover:text-background transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
