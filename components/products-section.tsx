import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, ShoppingBag, ArrowRight, Sparkles } from "lucide-react"

const products = [
  {
    title: "The Complete Online Dating Guide",
    type: "eBook",
    description: "A comprehensive guide to mastering online dating in the modern age.",
    icon: BookOpen,
    available: true,
  },
  {
    title: "Conversation Starters Deck",
    type: "Digital Cards",
    description: "50 thoughtful conversation starters for your next video date.",
    icon: Sparkles,
    available: true,
  },
  {
    title: "Tempo Dating Kit",
    type: "Physical Product",
    description: "Everything you need for the perfect at-home date night.",
    icon: ShoppingBag,
    available: false,
  },
]

export function ProductsSection() {
  return (
    <section id="products" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
            Resources & Products
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
            Tools to Help You Succeed in Dating
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Browse our collection of eBooks, guides, and dating essentials designed to give you the confidence you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.title} className={`overflow-hidden ${!product.available ? 'opacity-75' : ''}`}>
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6">
                  <product.icon className="w-7 h-7 text-primary" />
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {product.type}
                  </span>
                  {!product.available && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg text-foreground mb-2">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-6">{product.description}</p>
                
                <div className="flex items-center justify-end">
                  <Button 
                    variant={product.available ? "default" : "outline"} 
                    size="sm"
                    disabled={!product.available}
                  >
                    {product.available ? "Get Now" : "Notify Me"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="link" className="text-primary" asChild>
            <Link href="/products/onDemand">
              Browse All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
