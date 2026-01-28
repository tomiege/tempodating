import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-6">
              At Tempo Dating (&quot;Tempo,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), we are committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our website and services.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Account information (name, email, date of birth, gender)</li>
              <li>Profile information (photos, bio, preferences)</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Communications with us and other users</li>
              <li>Survey responses and feedback</li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Match you with compatible singles</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns and trends</li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-6">
              We do not sell your personal information. We may share your information with third parties only in 
              the following circumstances: with your consent, with service providers who assist our operations, 
              to comply with legal obligations, or to protect our rights and safety.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
            <p className="text-muted-foreground mb-6">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the Internet is 100% secure.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground mb-6">
              We retain your personal information for as long as your account is active or as needed to provide 
              you services. You can request deletion of your account and data at any time.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@tempodating.com" className="text-primary hover:underline">
                privacy@tempodating.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
