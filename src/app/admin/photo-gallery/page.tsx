'use client';

import React, {useState, useEffect} from 'react';

import {Card, CardBody, CardHeader} from '@heroui/card';
import {Tabs, Tab} from '@heroui/tabs';

import {PhotoIcon, FolderIcon} from '@heroicons/react/24/outline';

import {AdminContainer} from '@/components/features/admin/AdminContainer';

import {translations} from '@/lib/translations';

import AlbumsTab from './components/AlbumsTab';
import PhotosTab from './components/PhotosTab';

export default function PhotoGalleryAdminPage() {
  const [selectedTab, setSelectedTab] = useState('albums');

  const t = translations.admin.photoGallery;

  return (
    <AdminContainer>
      {/* Main Content */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-0">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="w-full"
            isVertical
          >
            <Tab
              key="albums"
              title={
                <div className="flex justify-start space-x-2">
                  <FolderIcon className="w-5 h-5" />
                  <span>Alba</span>
                </div>
              }
            >
              <AlbumsTab />
            </Tab>
            <Tab
              key="photos"
              title={
                <div className="flex justify-start space-x-2">
                  <PhotoIcon className="w-5 h-5" />
                  <span>Fotografie</span>
                </div>
              }
            >
              <PhotosTab />
            </Tab>
          </Tabs>
        </CardHeader>
        <CardBody className="pt-6">{/* Tab content is rendered by the tab components */}</CardBody>
      </Card>
    </AdminContainer>
  );
}
