'use client';

import {useState} from 'react';

import {Tabs, Tab} from '@heroui/react';

import {AdminContainer} from '@/components';

import {BusinessPartnersTab} from './components/BusinessPartnersTab';
import {MainPartnersTab} from './components/MainPartnersTab';
import {MediaPartnersTab} from './components/MediaPartnersTab';

export default function SponsorshipPage() {
  const [selectedTab, setSelectedTab] = useState<string>('main-partners');

  return (
    <AdminContainer>
      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
        color="primary"
        variant="underlined"
        size="lg"
      >
        <Tab key="main-partners" title="Hlavní partneři" />
        <Tab key="business-partners" title="Obchodní partneři" />
        <Tab key="media-partners" title="Mediální partneři" />
      </Tabs>

      {/* Tab Content */}
      {selectedTab === 'main-partners' && <MainPartnersTab />}

      {selectedTab === 'business-partners' && <BusinessPartnersTab />}

      {selectedTab === 'media-partners' && <MediaPartnersTab />}
    </AdminContainer>
  );
}
