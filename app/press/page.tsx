import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Mail } from "lucide-react"

const pressReleases = [
  {
    title: "Tempo Launches in 10 New Cities Across Europe",
    date: "January 20, 2026",
    excerpt: "Online speed dating platform expands European presence to meet growing demand.",
  },
  {
    title: "Tempo Reports 50,000 Successful Matches in 2025",
    date: "December 15, 2025",
    excerpt: "Platform celebrates milestone year with record number of meaningful connections.",
  },
  {
    title: "Tempo Introduces AI-Powered Personality Matching",
    date: "October 5, 2025",
    excerpt: "New matching algorithm improves compatibility rates by 40%.",
  },
  {
    title: "Tempo Raises $10M Series A to Expand Globally",
    date: "July 15, 2025",
    excerpt: "Funding will support expansion into new markets and product development.",
  },
]

export default function PressPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Press & Media
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              News, announcements, and media resources from Tempo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Media Inquiries</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For press inquiries and interview requests
                </p>
                <a href="mailto:press@tempodating.com" className="text-primary hover:underline">
                  press@tempodating.com
                </a>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Download className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Press Kit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Logos, brand guidelines, and media assets
                </p>
                <Button variant="outline" size="sm">Download Press Kit</Button>
              </CardContent>
            </Card>
          </div>

          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">{release.date}</p>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{release.title}</h3>
                  <p className="text-muted-foreground">{release.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-8 bg-muted/50 rounded-2xl text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Company Facts</h2>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-3xl font-bold text-primary">2024</p>
                <p className="text-sm text-muted-foreground">Founded</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Cities</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">100K+</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
