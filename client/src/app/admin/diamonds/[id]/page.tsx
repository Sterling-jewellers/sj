'use client';

import DiamondForm from '../DiamondForm';

export default function EditDiamondPage({ params }: { params: { id: string } }) {
  return <DiamondForm diamondId={params.id} />;
}
