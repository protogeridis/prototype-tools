'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { DELIVERY, getProduct } from '@/data/products';

export function CheckoutForm() {
  const router = useRouter();
  const product = getProduct(useSearchParams().get('id') ?? '');
  const [quantity, setQuantity] = useState(1);
  if (!product) return <p>Nothing to check out. <Link href="/">Back to the shop</Link></p>;
  const total = product.price * quantity + DELIVERY;
  return (
    <>
      <div className="row">
        <span>{product.name}</span>
        <span>
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button> {quantity}{' '}
          <button onClick={() => setQuantity((q) => q + 1)}>+</button>
        </span>
      </div>
      <div className="row"><span>Delivery</span><span>£{DELIVERY.toFixed(2)}</span></div>
      <div className="row"><strong>Total</strong><strong>£{total.toFixed(2)}</strong></div>
      <p>
        <button className="button" onClick={() => router.push(`/checkout/done?total=${total.toFixed(2)}`)}>
          Place order
        </button>{' '}
        <button onClick={() => router.back()}>Cancel</button>
      </p>
    </>
  );
}
