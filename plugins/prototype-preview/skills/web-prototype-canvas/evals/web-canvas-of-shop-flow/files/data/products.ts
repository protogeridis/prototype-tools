export type Product = { id: string; name: string; price: number; description: string };

export const PRODUCTS: Product[] = [
  { id: 'sourdough', name: 'Sourdough loaf', price: 4.5, description: 'Baked this morning with a 48-hour ferment.' },
  { id: 'olive-oil', name: 'Olive oil, 500ml', price: 12.95, description: 'Cold-pressed, from a single estate in Crete.' },
  { id: 'coffee', name: 'House coffee beans', price: 9.8, description: 'Medium roast with notes of cocoa and cherry.' },
];

export const DELIVERY = 2.5;

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
