import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">Last updated: January 1, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground mb-6">
              Cookies are small text files that are placed on your device when you visit a website. They are 
              widely used to make websites work more efficiently and to provide information to website owners.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">How We Use Cookies</h2>
            <p className="text-muted-foreground mb-6">
              Tempo uses cookies to improve your experience on our website, analyze site traffic, and 
              personalize content. We use both session cookies (which expire when you close your browser) 
              and persistent cookies (which remain on your device for a set period).
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable basic 
                    functions like page navigation, secure areas access, and account authentication. 
                    The website cannot function properly without these cookies.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously. This helps us improve our website and services.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Functional Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings. They may be set by us or by third-party providers.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Marketing Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to track visitors across websites to display relevant 
                    advertisements. They help measure the effectiveness of advertising campaigns.
                  </p>
                </CardContent>
              </Card>
            </div>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-6">
              Some cookies on our website are set by third-party services that appear on our pages. 
              These include analytics providers (like Google Analytics), payment processors, and 
              social media platforms. We do not control these third-party cookies.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground mb-6">
              You can control and manage cookies in various ways. Most browsers allow you to refuse or 
              accept cookies, delete existing cookies, and set preferences for certain websites. Please 
              note that removing or blocking cookies may impact your user experience and some functionality 
              may no longer be available.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Browser Settings</h2>
            <p className="text-muted-foreground mb-4">
              You can manage cookies through your browser settings. Here are links to cookie management 
              instructions for popular browsers:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Updates to This Policy</h2>
            <p className="text-muted-foreground mb-6">
              We may update this Cookie Policy from time to time to reflect changes in technology, 
              legislation, or our data practices. Any changes will be posted on this page with an 
              updated revision date.
            </p>

            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about our use of cookies, please contact us at{" "}
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
