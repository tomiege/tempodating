import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Heart, Star, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Pink gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-100/80 via-pink-50/60 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Personality & Age Matched Dating</span>
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance mb-4">
              Find Your Perfect Match{" "}
              <span className="text-primary">at Your Pace</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mb-6">
              Curated speed dating events matched by age and personality.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Button size="lg" className="text-base px-6" asChild>
                <Link href="/products/onlineSpeedDating">
                  Find Events Near You
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-6 bg-transparent" asChild>
                <Link href="/#how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>

            {/* Bottom stats */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-pink-300 border-2 border-background" />
                  <div className="w-7 h-7 rounded-full bg-pink-400 border-2 border-background" />
                  <div className="w-7 h-7 rounded-full bg-pink-500 border-2 border-background" />
                  <div className="w-7 h-7 rounded-full bg-pink-200 border-2 border-background" />
                </div>
                <span className="text-muted-foreground">2,500+ matches</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 fill-primary text-primary" />
                <span className="text-muted-foreground">4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">500+ events</span>
              </div>
            </div>
          </div>

          {/* Right image with badges below */}
          <div className="order-1 lg:order-2 flex flex-col gap-4">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <Image
                src="/images/hero-couple.jpg"
                alt="Two singles meeting for the first time on a video call"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            
            {/* Badges row - positioned below image */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Perfect Match badge */}
              <div className="bg-card rounded-xl px-4 py-3 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Perfect Match!</p>
                    <p className="text-[10px] text-muted-foreground">92% compatibility</p>
                  </div>
                </div>
              </div>
              
              {/* Age Matched badge */}
              <div className="bg-card rounded-xl px-4 py-3 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Age Matched</p>
                    <p className="text-[10px] text-muted-foreground">Compatible ranges</p>
                  </div>
                </div>
              </div>
              
              {/* Live Now badge */}
              <div className="bg-card rounded-xl px-4 py-3 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 relative">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Live Now
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </p>
                    <p className="text-[10px] text-muted-foreground">124 people online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
