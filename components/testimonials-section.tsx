import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Emma",
    location: "Manchester",
    service: "Speed Dating",
    text: "I was nervous about speed dating, but the age-matching made everyone so relatable. Met three great people and am now dating one!",
    rating: 5,
    duration: "Together 6 months",
  },
  {
    name: "James",
    location: "London",
    service: "Speed Dating",
    text: "The personality matching really works. Every date I had felt like a genuine connection, not just random pairing. Highly recommend the workshops too!",
    rating: 5,
    duration: "Together 4 months",
  },
  {
    name: "Sarah",
    location: "Birmingham",
    service: "Workshop + Events",
    text: "As someone with social anxiety, the video format was perfect. The workshop gave me confidence and I found my match on my first event!",
    rating: 5,
    duration: "Together 8 months",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
            Success Stories
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
            Real People, Real Connections
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Hear from singles who found meaningful connections through Tempo Dating.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="overflow-hidden">
              <CardContent className="p-8">
                {/* Quote marks */}
                <div className="text-primary/30 text-6xl font-serif leading-none mb-4">"</div>
                
                <p className="text-foreground mb-8 leading-relaxed text-lg">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{testimonial.name}</p>
                    <p className="text-sm text-primary">
                      {testimonial.location} • {testimonial.service}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 mb-1 justify-end">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-primary">{testimonial.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
