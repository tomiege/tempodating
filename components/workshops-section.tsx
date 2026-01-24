import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, Star, ArrowRight } from "lucide-react"

const workshops = [
  {
    title: "The Art of First Impressions",
    description: "Learn how to make a memorable first impression in the first 30 seconds of meeting someone new.",
    duration: "90 min",
    attendees: "20 max",
    rating: 4.9,
    price: "$29",
  },
  {
    title: "Dress to Connect",
    description: "Discover how your wardrobe choices impact attraction and learn what works for virtual dating.",
    duration: "60 min",
    attendees: "15 max",
    rating: 4.8,
    price: "$24",
  },
  {
    title: "Conversation Mastery",
    description: "Master the art of engaging conversation with techniques to keep the spark alive.",
    duration: "75 min",
    attendees: "25 max",
    rating: 4.9,
    price: "$34",
  },
]

export function WorkshopsSection() {
  return (
    <section id="workshops" className="py-20 md:py-28 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
            Dating Workshops
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
            Level Up Your Dating Game with Expert Guidance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join our interactive workshops led by dating coaches and relationship experts. 
            Learn practical skills that will transform your dating life.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
              <Image
                src="/images/workshop.jpg"
                alt="Dating coach presenting an engaging workshop"
                width={400}
                height={500}
                className="w-full h-auto object-cover aspect-[4/5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-medium mb-1">Expert-Led Sessions</p>
                <p className="text-white/80 text-sm">Learn from certified dating coaches with years of experience.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {workshops.map((workshop) => (
              <Card key={workshop.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">{workshop.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{workshop.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{workshop.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{workshop.attendees}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{workshop.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-serif text-2xl font-semibold text-foreground">{workshop.price}</p>
                      <Button variant="outline" size="sm">
                        Enroll
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="text-center pt-4">
              <Button variant="link" className="text-primary">
                View All Workshops
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
