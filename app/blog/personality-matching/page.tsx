import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PersonalityMatchingPage() {
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
            <p className="text-primary font-medium mb-2">Features</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              Why Personality Matching Makes a Difference
            </h1>
            <p className="text-muted-foreground">December 20, 2025 · 3 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Random matching is hit or miss. Our personality-based approach significantly improves your chances of finding a genuine connection.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Beyond Surface-Level Compatibility</h2>
            <p className="text-muted-foreground mb-6">
              While shared interests matter, research shows that compatible values, communication styles, and life goals are stronger predictors of relationship success. Our matching considers all of these factors.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">How Our Matching Works</h2>
            <p className="text-muted-foreground mb-6">
              When you join Tempo, you complete a quick personality assessment. We analyze your responses across five key dimensions: openness, conscientiousness, extraversion, agreeableness, and emotional stability. We then match you with people who complement your personality type.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Results Speak for Themselves</h2>
            <p className="text-muted-foreground mb-6">
              Our data shows that personality-matched participants are 40% more likely to select each other as mutual matches compared to random pairing. They also report higher satisfaction with their conversations.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">Quality Over Quantity</h2>
            <p className="text-muted-foreground mb-6">
              Instead of meeting a random assortment of people, you meet singles who are more likely to be genuinely compatible with you. This makes every five-minute date more meaningful and increases your odds of finding that special someone.
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
