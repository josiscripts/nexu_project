'use client';

import { Suspense } from 'react';
import SalasContent from './salas-content';

export default function SalasPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SalasContent />
    </Suspense>
  );
}
