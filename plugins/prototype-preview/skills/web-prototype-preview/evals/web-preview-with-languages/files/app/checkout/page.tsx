import { Suspense } from 'react';

import { CheckoutForm } from './CheckoutForm';

export default function CheckoutPage() {
  return (
    <>
      <h1>Review your order</h1>
      <Suspense>
        <CheckoutForm />
      </Suspense>
    </>
  );
}
