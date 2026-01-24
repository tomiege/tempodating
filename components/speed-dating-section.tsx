import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function SpeedDatingSection() {
  return (
    <section id="speed-dating" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
              Online Speed Dating
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-5 text-balance">
              Meet Your Matches in Real-Time Video Dates
            </h2>
            <p className="text-muted-foreground mb-6">
              Our signature online speed dating events connect you with personality-matched singles in your age group. 
              Each 5-minute date gives you just enough time to feel that spark.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Pick Your City</h3>
                  <p className="text-sm text-muted-foreground">Events organized by location to meet local singles.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Complete Personality Quiz</h3>
                  <p className="text-sm text-muted-foreground">Our algorithm pairs you with compatible singles.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Join the Event</h3>
                  <p className="text-sm text-muted-foreground">Meet 8-12 matches in one evening from home.</p>
                </div>
              </div>
            </div>

            <Button size="lg" asChild>
              <Link href="/event">
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
            <Image
              src="/images/speed-dating-grid.jpg"
              alt="Diverse singles participating in an online speed dating event via video call"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
