import { MapPin, ClipboardCheck, Video, Heart } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Choose Your City",
    description: "Browse events in your area and find one that fits your schedule and age preference.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Complete Your Profile",
    description: "Take our personality quiz so we can match you with compatible singles.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Join the Event",
    description: "Log in at the scheduled time and meet 8-12 curated matches in 5-minute video dates.",
    icon: Video,
  },
  {
    number: "04",
    title: "Connect with Matches",
    description: "After the event, see who you matched with and start conversations.",
    icon: Heart,
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-medium text-primary-foreground/70 uppercase tracking-wider mb-4">
            How It Works
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-background mb-6 text-balance max-w-2xl mx-auto">
            Four Simple Steps to Your Next Great Date
          </h2>
          <p className="text-background/70 max-w-2xl mx-auto text-pretty">
            We&apos;ve made finding love simple. Here&apos;s how our online speed dating process works.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-background/20" />
              )}
              
              <div className="relative text-center">
                <div className="w-24 h-24 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-6 relative">
                  <step.icon className="w-10 h-10 text-background" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-background mb-3">{step.title}</h3>
                <p className="text-background/70 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
