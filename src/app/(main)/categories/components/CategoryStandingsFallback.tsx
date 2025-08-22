'use client';

import { Card, CardHeader, CardBody } from '@heroui/react';

interface CategoryStandingsFallbackProps {
  categoryName: string;
}

export function CategoryStandingsFallback({ categoryName }: CategoryStandingsFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tabulka - {categoryName}</h2>
      </CardHeader>
      <CardBody>
        <div className="text-center text-gray-500 py-8">
          <p>Pro tuto kategorii zatím nejsou k dispozici žádné výsledky.</p>
          <p className="text-sm mt-2">
            Tabulka se zobrazí po odehrání prvních zápasů a vytvoření tabulky v systému.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Tabulka se automaticky aktualizuje po každém odehraném zápasu.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
