import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, Mail } from "lucide-react"

const openings = [
  {
    title: "Event Host",
    department: "Operations",
    location: "Dallas, Texas",
    type: "Part-time",
  },
]

export default function CareersPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Careers at Tempo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our team and help people find meaningful connections. We&apos;re looking for passionate individuals to host our events.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Why Host With Us?</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-semibold text-foreground mb-1">Fun Events</h3>
                <p className="text-sm text-muted-foreground">Host exciting speed dating events</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-foreground mb-1">Great Pay</h3>
                <p className="text-sm text-muted-foreground">Competitive compensation per event</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">❤️</div>
                <h3 className="font-semibold text-foreground mb-1">Meaningful Work</h3>
                <p className="text-sm text-muted-foreground">Help people find love and connection</p>
              </div>
            </div>
          </div>

          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">{job.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-8 bg-primary/5 border border-primary/20 rounded-2xl text-center">
            <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Interested in Hosting?</h2>
            <p className="text-muted-foreground mb-4">
              Send us your resume and tell us why you&apos;d be a great event host.
            </p>
            <a 
              href="mailto:careers@tempodating.com" 
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              careers@tempodating.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
