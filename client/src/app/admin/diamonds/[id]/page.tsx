'use client';

import { use } from 'react';
import DiamondForm from '../DiamondForm';

export default function EditDiamondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DiamondForm diamondId={id} />;
}
