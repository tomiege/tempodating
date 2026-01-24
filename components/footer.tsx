import Link from "next/link"
import { Heart, Instagram, Twitter, Facebook, Youtube } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Footer() {
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
            <div className="flex items-center gap-4">
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
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Speed Dating</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Find Events</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">How It Works</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Cities</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Workshops</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Browse Workshops</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Become a Coach</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Gift a Workshop</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Corporate Events</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-background/60 hover:text-background transition-colors">Press</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="font-semibold text-background mb-4">Stay Updated</h3>
            <p className="text-background/60 text-sm mb-4">
              Get dating tips and event updates in your inbox.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter email" 
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
              />
              <Button variant="secondary" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} Tempo Dating. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#" className="text-background/40 hover:text-background transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-background/40 hover:text-background transition-colors">Terms of Service</Link>
            <Link href="#" className="text-background/40 hover:text-background transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
