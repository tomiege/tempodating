import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-6">
              By accessing or using Tempo Dating&apos;s services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">2. Eligibility</h2>
            <p className="text-muted-foreground mb-6">
              You must be at least 18 years old to use Tempo. By using our services, you represent and warrant 
              that you are at least 18 years of age and have the legal capacity to enter into these terms.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground mb-6">
              To use certain features of our service, you must register for an account. You agree to provide 
              accurate, current, and complete information during registration and to update such information 
              to keep it accurate, current, and complete.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Post false or misleading information</li>
              <li>Upload malicious content or interfere with the service</li>
              <li>Use the service for commercial purposes without authorization</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">5. Event Participation</h2>
            <p className="text-muted-foreground mb-6">
              When participating in Tempo events, you agree to conduct yourself respectfully and professionally. 
              We reserve the right to remove any participant who violates our community guidelines or disrupts 
              an event.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">6. Payments and Refunds</h2>
            <p className="text-muted-foreground mb-6">
              Event fees are charged at the time of registration. All sales are final and no refunds will be issued for any reason, including cancellations or no-shows.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground mb-6">
              All content and materials available on Tempo, including but not limited to text, graphics, logos, 
              and software, are the property of Tempo or its licensors and are protected by intellectual 
              property laws.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-6">
              Tempo provides a platform for users to connect but does not guarantee any outcomes from using our 
              service. We are not liable for any damages arising from your use of the service or interactions 
              with other users.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">9. Termination</h2>
            <p className="text-muted-foreground mb-6">
              We may terminate or suspend your account at any time for violations of these terms or for any 
              other reason at our sole discretion. You may also delete your account at any time through your 
              account settings.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground mb-6">
              We reserve the right to modify these terms at any time. We will notify you of any changes by 
              posting the new terms on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@tempodating.com" className="text-primary hover:underline">
                legal@tempodating.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
