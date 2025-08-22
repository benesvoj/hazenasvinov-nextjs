'use client';

import { Card, CardHeader, CardBody } from '@heroui/react';

interface SeasonalMatchesFallbackProps {
  categoryName: string;
}

export function SeasonalMatchesFallback({ categoryName }: SeasonalMatchesFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Zápasy - {categoryName}</h2>
      </CardHeader>
      <CardBody>
        <div className="text-center text-gray-500 py-8">
          <p>Pro tuto kategorii zatím nejsou k dispozici žádné zápasy.</p>
          <p className="text-sm mt-2">
            Zápasy se zobrazí po jejich naplánování v administraci.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Zápasy můžete naplánovat v Admin → Zápasy.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
