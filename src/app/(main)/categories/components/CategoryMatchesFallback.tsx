'use client';

import { Card, CardHeader, CardBody } from '@heroui/react';

interface CategoryMatchesFallbackProps {
  categoryName: string;
}

export function CategoryMatchesFallback({ categoryName }: CategoryMatchesFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Zápasy - {categoryName}</h2>
      </CardHeader>
      <CardBody>
        <div className="text-center text-gray-500 py-8">
          <p>Pro tuto kategorii zatím nejsou k dispozici žádné zápasy.</p>
        </div>
      </CardBody>
    </Card>
  );
}
