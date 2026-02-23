'use client';

import {Tabs, Tab} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {AdminContainer} from '@/components';

import ClubConfigCard from './components/ClubConfigCard';
import ClubPagesCard from './components/ClubPagesCard';

export default function ClubConfigPage() {
  return (
    <AdminContainer>
      <Tabs aria-label={translations.clubConfig.ariaLabel}>
        <Tab key="club-config" title={translations.clubConfig.tabTitles.clubConfig}>
          <ClubConfigCard />
        </Tab>
        <Tab key="club-pages" title={translations.clubConfig.tabTitles.clubPages}>
          <ClubPagesCard />
        </Tab>
      </Tabs>
    </AdminContainer>
  );
}
