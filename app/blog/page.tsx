import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const blogPosts = [
  {
    slug: "first-speed-dating-tips",
    title: "10 Tips for Your First Online Speed Dating Event",
    excerpt: "Nervous about your first event? Here are our top tips to make a great impression and have fun.",
    category: "Tips",
    date: "January 15, 2026",
  },
  {
    slug: "science-of-first-impressions",
    title: "The Science of First Impressions",
    excerpt: "What research tells us about making connections in just a few minutes.",
    category: "Science",
    date: "January 10, 2026",
  },
  {
    slug: "success-story-sarah-mike",
    title: "Success Story: How Sarah and Mike Found Love on Tempo",
    excerpt: "One couple shares their journey from a 5-minute video date to engagement.",
    category: "Success Stories",
    date: "January 5, 2026",
  },
  {
    slug: "virtual-dating-etiquette",
    title: "Virtual Dating Etiquette: Do's and Don'ts",
    excerpt: "Make the most of your video dates with these simple etiquette guidelines.",
    category: "Tips",
    date: "December 28, 2025",
  },
  {
    slug: "personality-matching",
    title: "Why Personality Matching Makes a Difference",
    excerpt: "Learn how our matching algorithm helps you meet compatible singles.",
    category: "Features",
    date: "December 20, 2025",
  },
  {
    slug: "rise-of-online-speed-dating",
    title: "The Rise of Online Speed Dating",
    excerpt: "How virtual events are changing the dating landscape for the better.",
    category: "Trends",
    date: "December 15, 2025",
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dating tips, success stories, and insights from the Tempo team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <Link key={index} href={`/blog/${post.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      {post.excerpt}
                    </p>
                    <p className="text-xs text-muted-foreground">{post.date}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
