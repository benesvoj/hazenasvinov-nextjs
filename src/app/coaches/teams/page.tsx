'use client';

import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';

export default function CoachesTeamsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="w-8 h-8 text-green-600" />
            Moje týmy
          </h1>
          <p className="text-gray-600">Správa vašich týmů a hráčů</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardBody className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Funkce brzy k dispozici
          </h3>
          <p className="text-gray-600">
            Správa týmů a hráčů bude brzy implementována.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
