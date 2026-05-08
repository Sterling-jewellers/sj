import type { Metadata } from 'next';
import DiamondDetailClient from './_DiamondDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/diamonds/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error();
    const d = await res.json();
    const title = `${d.caratWeight}ct ${d.shape.charAt(0).toUpperCase() + d.shape.slice(1)} Diamond — ${d.cut} Cut | Sterling Jewellers`;
    return {
      title,
      description: `${d.caratWeight}ct ${d.shape} diamond, ${d.color} colour, ${d.clarity} clarity, ${d.cut} cut. Certified by ${d.certificate?.lab}. Shop at Sterling Jewellers.`,
      openGraph: { title, description: `${d.caratWeight}ct ${d.shape} ${d.color}/${d.clarity}/${d.cut}`, images: d.imageUrl ? [d.imageUrl] : [] },
    };
  } catch {
    return { title: 'Diamond Details | Sterling Jewellers' };
  }
}

export default function DiamondDetailPage({ params }: { params: { id: string } }) {
  return <DiamondDetailClient id={params.id} />;
}
