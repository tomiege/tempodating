import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Heart, Users, Globe, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              About Tempo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We believe everyone deserves to find meaningful connections. Tempo makes online speed dating fun, safe, and effective.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-12 mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-6">
              Tempo was founded with a simple mission: to help people find love at the right pace. 
              In a world of endless swiping and superficial connections, we wanted to create something different—a 
              platform where real conversations lead to real relationships.
            </p>
            <p className="text-muted-foreground mb-6">
              Our online speed dating events bring together like-minded singles in a fun, 
              low-pressure environment. With personality matching and professional hosts, 
              we make sure every event is an enjoyable experience.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-12 mb-4">Our Values</h2>
            
            <div className="grid sm:grid-cols-2 gap-6 mt-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Authentic Connections</h3>
                  <p className="text-sm text-muted-foreground">We prioritize meaningful conversations over superficial matches.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Inclusive Community</h3>
                  <p className="text-sm text-muted-foreground">Everyone is welcome. We celebrate diversity in all its forms.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">Connecting singles across cities and countries worldwide.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Quality Experience</h3>
                  <p className="text-sm text-muted-foreground">Professional hosts and curated events for the best experience.</p>
                </div>
              </div>
            </div>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-12 mb-4">Join Us</h2>
            <p className="text-muted-foreground mb-6">
              Whether you&apos;re looking for love, friendship, or just want to meet new people, 
              Tempo is here for you. Join one of our upcoming events and discover the joy of 
              meeting someone special.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
