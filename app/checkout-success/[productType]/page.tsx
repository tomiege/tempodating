import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CheckoutSuccessPageProps {
  params: Promise<{
    productType: string;
  }>;
  searchParams: Promise<{
    checkoutSessionId?: string;
    email?: string;
  }>;
}

export default async function CheckoutSuccessPage({ 
  params, 
  searchParams 
}: CheckoutSuccessPageProps) {
  const { productType } = await params;
  const { checkoutSessionId, email } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            Thank You for Your Purchase!
          </CardTitle>
          <CardDescription className="text-lg">
            Your order has been successfully processed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Suspense fallback={<div>Loading...</div>}>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Order Details
                </h3>
                
                {email && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Email
                    </span>
                    <span className="font-medium">
                      {email}
                    </span>
                  </div>
                )}
                
                {checkoutSessionId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Session ID
                    </span>
                    <span className="font-mono text-sm font-medium break-all">
                      {checkoutSessionId}
                    </span>
                  </div>
                )}
                
                {productType && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Product Type
                    </span>
                    <span className="font-medium capitalize">
                      {productType.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>
                A confirmation email has been sent to <strong>{email}</strong> with your order details and ticket information.
              </p>
              <p>
                Please check your inbox (and spam folder) for the confirmation email. If you don't receive it within a few minutes, please contact our support team.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
              >
                Go to Dashboard
              </a>
              <a
                href="/"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                Back to Home
              </a>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
