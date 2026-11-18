import Link from 'next/link';

import { PRODUCTS } from '@/data/products';

export default function HomePage() {
  return (
    <>
      <h1>Fresh from the neighbourhood</h1>
      <p>Delivered to your door this evening.</p>
      <div className="grid">
        {PRODUCTS.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="card">
            <strong>{product.name}</strong>
            <p>£{product.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
