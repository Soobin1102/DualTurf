import { getClearanceSaleProducts } from '@/lib/sanity';
import ClearanceSaleClient from './ClearanceSaleClient';

export const revalidate = 0;

export const metadata = {
  title: 'Clearance Sale — DualTurf',
  description: 'Grab your favourite jerseys at heavily discounted prices. Limited stock — clearance sale on now!',
};

export default async function ClearanceSalePage() {
  const products = await getClearanceSaleProducts();
  return <ClearanceSaleClient products={products || []} />;
}

