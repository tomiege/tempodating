import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ScienceOfFirstImpressionsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <article className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <header className="mb-8">
            <p className="text-primary font-medium mb-2">Science</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              The Science of First Impressions
            </h1>
            <p className="text-muted-foreground">January 10, 2026 · 3 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Research shows we form impressions of others in just milliseconds. Here&apos;s what science tells us about making those moments count.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The 7-Second Rule</h2>
            <p className="text-muted-foreground mb-6">
              Studies show people form a first impression within 7 seconds of meeting someone. In that brief window, we assess trustworthiness, competence, and likability based on facial expressions, body language, and tone of voice.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">What Matters Most</h2>
            <p className="text-muted-foreground mb-6">
              According to research by Albert Mehrabian, communication is 55% body language, 38% tone of voice, and only 7% actual words. This means how you say something matters far more than what you say.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Power of a Genuine Smile</h2>
            <p className="text-muted-foreground mb-6">
              A Duchenne smile—one that reaches your eyes—signals warmth and authenticity. People who smile genuinely are perceived as more attractive, trustworthy, and approachable.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Mirror Neurons at Work</h2>
            <p className="text-muted-foreground mb-6">
              Our brains contain mirror neurons that cause us to unconsciously mimic others. When someone leans in, we lean in. When they smile, we smile. This mirroring builds rapport naturally.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Bottom Line</h2>
            <p className="text-muted-foreground mb-6">
              While first impressions happen fast, they&apos;re not set in stone. Be warm, be present, and be yourself. Science shows that authenticity is the most attractive quality of all.
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
