import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8">
          <Heart className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
        </div>
        
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary-foreground mb-6 text-balance">
          Ready to Find Your Perfect Match?
        </h2>
        
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto text-pretty">
          Join thousands of singles who have found meaningful connections through Tempo Dating. 
          Your next great love story starts with one click.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-base px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            asChild
          >
            <Link href="/products/onlineSpeedDating">
              Find Your Event
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          {/* <Button 
            size="lg" 
            variant="outline" 
            className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
          >
            Take Personality Quiz
          </Button> */}
        </div>
        
        <p className="text-primary-foreground/60 text-sm mt-8">
          Your Perfect Match is Just a Click Away!
        </p>
      </div>
    </section>
  )
}
