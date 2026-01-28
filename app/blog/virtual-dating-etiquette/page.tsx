import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"

export default function VirtualDatingEtiquettePage() {
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
              Virtual Dating Etiquette: Do&apos;s and Don&apos;ts
            </h1>
            <p className="text-muted-foreground">December 28, 2025 · 3 min read</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              Video dating has its own unwritten rules. Master these basics to make every virtual date a success.
            </p>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-4">The Do&apos;s</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Do be on time</p>
                  <p className="text-sm text-muted-foreground">Log in 5 minutes early to sort out any tech issues.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Do maintain eye contact</p>
                  <p className="text-sm text-muted-foreground">Look at your camera when speaking to simulate eye contact.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Do speak clearly</p>
                  <p className="text-sm text-muted-foreground">Enunciate and pace yourself—audio can be tricky on video calls.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Do show enthusiasm</p>
                  <p className="text-sm text-muted-foreground">Nod, smile, and react. Energy translates well on camera.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Do ask follow-up questions</p>
                  <p className="text-sm text-muted-foreground">Show genuine interest in what the other person shares.</p>
                </div>
              </div>
            </div>

            <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-4">The Don&apos;ts</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Don&apos;t multitask</p>
                  <p className="text-sm text-muted-foreground">Close other apps and give your date your full attention.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Don&apos;t interrupt</p>
                  <p className="text-sm text-muted-foreground">Video calls have slight delays—pause before responding.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Don&apos;t dominate the conversation</p>
                  <p className="text-sm text-muted-foreground">Aim for a balanced exchange where both people share equally.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Don&apos;t get too personal too fast</p>
                  <p className="text-sm text-muted-foreground">Save deep topics for when you&apos;ve built more rapport.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Don&apos;t be negative</p>
                  <p className="text-sm text-muted-foreground">Avoid complaining about exes, work, or dating in general.</p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground">
              Remember: the goal is to see if there&apos;s a spark. Keep it light, be respectful, and most importantly—have fun!
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
