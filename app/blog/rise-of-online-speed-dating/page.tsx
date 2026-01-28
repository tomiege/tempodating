import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function RiseOfOnlineSpeedDatingPage() {
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
            <p className="text-primary font-medium mb-2">Trends</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              The Rise of Online Speed Dating
            </h1>
            <p className="text-muted-foreground">December 15, 2025 · 4 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Virtual speed dating has exploded in popularity. Here&apos;s why more singles are choosing video events over traditional dating apps.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The App Fatigue Problem</h2>
            <p className="text-muted-foreground mb-6">
              After years of swiping, many singles report feeling burned out. The endless cycle of matching, texting, and ghosting leaves people exhausted and cynical. Online speed dating offers a refreshing alternative.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Real Conversations, Real Connections</h2>
            <p className="text-muted-foreground mb-6">
              Unlike apps where you might text for weeks before meeting, video speed dating cuts straight to what matters: face-to-face interaction. You can gauge chemistry, humor, and personality in minutes rather than months.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Efficiency Meets Intention</h2>
            <p className="text-muted-foreground mb-6">
              In a single evening, you can meet 8-12 potential matches. Everyone attending is genuinely looking to connect—no passive swipers or pen pals who never want to meet. This intentionality attracts people who are serious about finding a relationship.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Safe and Accessible</h2>
            <p className="text-muted-foreground mb-6">
              Virtual events eliminate the awkwardness of in-person speed dating. You can participate from the comfort of your home, and if someone isn&apos;t right for you, you&apos;ll naturally move on to the next date without any uncomfortable exits.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Future of Dating</h2>
            <p className="text-muted-foreground mb-6">
              As technology improves and people seek more authentic connections, online speed dating is positioned to become a mainstream way to meet partners. It combines the best of both worlds: the efficiency of technology with the authenticity of real human interaction.
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
