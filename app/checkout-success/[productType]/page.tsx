import CheckoutSuccessClient from './checkout-success-client';

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
    <CheckoutSuccessClient
      productType={productType}
      checkoutSessionId={checkoutSessionId}
      email={email}
    />
  );
}
