import Link from 'next/link';

export default async function DonePage({ searchParams }: { searchParams: Promise<{ total?: string }> }) {
  const { total } = await searchParams;
  return (
    <>
      <h1>Order placed</h1>
      <p>We charged £{total ?? '0.00'}. Your order arrives this evening.</p>
      <Link href="/" className="button">Back to the shop</Link>
    </>
  );
}
