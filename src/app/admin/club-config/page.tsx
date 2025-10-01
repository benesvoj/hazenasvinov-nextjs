'use client';

import {Tabs, Tab} from '@heroui/react';

import {AdminContainer} from '@/components';

import ClubConfigCard from './components/ClubConfigCard';
import ClubPagesCard from './components/ClubPagesCard';

export default function ClubConfigPage() {
  return (
    <AdminContainer>
      <Tabs aria-label="Konfigurace klubu">
        <Tab key="club-config" title="Konfigurace klubu">
          <ClubConfigCard />
        </Tab>
        <Tab key="club-pages" title="Stránky klubu">
          <ClubPagesCard />
        </Tab>
      </Tabs>
    </AdminContainer>
  );
}
