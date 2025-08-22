'use client';

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { PhotoIcon, FolderIcon } from "@heroicons/react/24/outline";
import { translations } from "@/lib/translations";
import AlbumsTab from "./components/AlbumsTab";
import PhotosTab from "./components/PhotosTab";

export default function PhotoGalleryAdminPage() {
  const [selectedTab, setSelectedTab] = useState("albums");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <PhotoIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fotogalerie
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Správa fotoalb a fotografií
          </p>
        </div>
      </div>

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
        <CardBody className="pt-6">
          {/* Tab content is rendered by the tab components */}
        </CardBody>
      </Card>
    </div>
  );
}
