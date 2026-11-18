import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getProduct } from '@/data/products';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return (
    <>
      <Link href="/">← All products</Link>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p><strong>£{product.price.toFixed(2)}</strong></p>
      <Link href={`/checkout?id=${product.id}`} className="button">Buy now</Link>
    </>
  );
}
