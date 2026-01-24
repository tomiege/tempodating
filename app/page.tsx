import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SpeedDatingSection } from "@/components/speed-dating-section"
import { WorkshopsSection } from "@/components/workshops-section"
import { ProductsSection } from "@/components/products-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <SpeedDatingSection />
      <WorkshopsSection />
      <ProductsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
