import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function FirstSpeedDatingTipsPage() {
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
            <p className="text-primary font-medium mb-2">Tips</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              10 Tips for Your First Online Speed Dating Event
            </h1>
            <p className="text-muted-foreground">January 15, 2026 · 4 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              First-time jitters are completely normal. Here&apos;s how to make the most of your first online speed dating experience.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">1. Test Your Tech Early</h2>
            <p className="text-muted-foreground mb-6">
              Check your camera, microphone, and internet connection at least an hour before the event. Good lighting makes a huge difference—face a window or use a ring light.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">2. Choose Your Background Wisely</h2>
            <p className="text-muted-foreground mb-6">
              A clean, uncluttered background helps keep the focus on you. Avoid sitting in front of bright windows that can make you appear as a silhouette.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">3. Dress to Impress (At Least From the Waist Up)</h2>
            <p className="text-muted-foreground mb-6">
              Wear something that makes you feel confident. Solid colors work better on camera than busy patterns.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">4. Prepare Some Conversation Starters</h2>
            <p className="text-muted-foreground mb-6">
              Have a few questions ready: What&apos;s your ideal weekend? What are you passionate about? What&apos;s the best trip you&apos;ve ever taken?
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">5. Be Present and Listen</h2>
            <p className="text-muted-foreground mb-6">
              Put away your phone and close other tabs. Give each person your full attention—it&apos;s noticeable and appreciated.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">6. Smile and Make Eye Contact</h2>
            <p className="text-muted-foreground mb-6">
              Look at your camera when speaking, not the screen. It creates the feeling of direct eye contact and builds connection.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">7. Keep It Light and Fun</h2>
            <p className="text-muted-foreground mb-6">
              Five minutes goes fast. Save deep topics for later—focus on discovering shared interests and having fun.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">8. Be Authentically You</h2>
            <p className="text-muted-foreground mb-6">
              Don&apos;t try to be someone you&apos;re not. The right person will appreciate the real you.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">9. Take Notes Between Dates</h2>
            <p className="text-muted-foreground mb-6">
              Jot down quick notes about each person during transitions. It helps when selecting matches afterward.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">10. Have Fun!</h2>
            <p className="text-muted-foreground mb-6">
              Remember, everyone else is a little nervous too. Approach it as an opportunity to meet interesting people, and the pressure melts away.
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
