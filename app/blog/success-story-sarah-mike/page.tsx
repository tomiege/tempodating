import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"

export default function SuccessStorySarahMikePage() {
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
            <p className="text-primary font-medium mb-2">Success Stories</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              How Sarah and Mike Found Love on Tempo
            </h1>
            <p className="text-muted-foreground">January 5, 2026 · 3 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 flex items-center gap-4">
              <Heart className="w-8 h-8 text-primary fill-primary flex-shrink-0" />
              <p className="text-foreground italic m-0">
                &quot;I never thought I&apos;d meet my soulmate through a screen. Five minutes changed everything.&quot; — Sarah
              </p>
            </div>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">A Skeptic Takes a Chance</h2>
            <p className="text-muted-foreground mb-6">
              Sarah, 32, had tried every dating app out there. &quot;I was tired of endless texting that went nowhere,&quot; she says. &quot;When a friend mentioned Tempo, I was skeptical. Speed dating felt old-fashioned. But the video aspect intrigued me.&quot;
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Five-Minute Connection</h2>
            <p className="text-muted-foreground mb-6">
              Mike was Sarah&apos;s seventh date of the evening. &quot;The moment his face appeared on screen, I felt something different,&quot; Sarah recalls. &quot;He made me laugh within the first 30 seconds. We talked about our dogs, our love of hiking, and before I knew it, time was up.&quot;
            </p>
            <p className="text-muted-foreground mb-6">
              For Mike, 34, it was equally electric. &quot;Sarah had this incredible energy. She was so genuine and easy to talk to. Five minutes flew by like five seconds.&quot;
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">The Mutual Match</h2>
            <p className="text-muted-foreground mb-6">
              Both selected each other as matches. When Sarah received the notification, she &quot;literally screamed.&quot; Their first real date was a hiking trip with their dogs. They&apos;ve been inseparable since.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">One Year Later</h2>
            <p className="text-muted-foreground mb-6">
              Last month, Mike proposed on the same trail where they had their first date. Sarah said yes before he finished the question.
            </p>
            <p className="text-muted-foreground mb-6">
              &quot;Tempo gave us something apps never could—a real first impression,&quot; Mike says. &quot;You can&apos;t fake chemistry through a screen when you&apos;re actually talking to someone.&quot;
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
