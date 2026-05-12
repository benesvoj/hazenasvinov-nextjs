'use client';

import {Card, CardBody} from '@heroui/react';

import {ChartBarIcon} from '@heroicons/react/24/outline';

import {AppPageLayout} from '@/shared/components';

export default function CoachesStatisticsPage() {
  return (
    <AppPageLayout>
      <Card>
        <CardBody className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Funkce brzy k dispozici</h3>
          <p className="text-gray-600">Statistiky a analýzy budou brzy implementovány.</p>
        </CardBody>
      </Card>
    </AppPageLayout>
  );
}
