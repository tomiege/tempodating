'use client'

import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, BookOpen, Users } from "lucide-react"

const productCategories = [
  {
    title: "Online Speed Dating",
    description: "Join virtual speed dating events from the comfort of your home. Meet multiple potential matches in one evening.",
    href: "/products/onlineSpeedDating",
    icon: Video,
  },
  {
    title: "Workshops",
    description: "Interactive workshops designed to help you improve your dating skills and build confidence.",
    href: "/products/workshop",
    icon: Users,
  },
  {
    title: "Dating Resources",
    description: "Ebooks, guides, and other resources to help you on your dating journey.",
    href: "/products/onDemand",
    icon: BookOpen,
  },
]

export default function ProductsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover our range of dating services and resources designed to help you find meaningful connections.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {productCategories.map((category) => (
                <Card key={category.href} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                      <category.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Link href={category.href}>
                      <Button>View Products</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
