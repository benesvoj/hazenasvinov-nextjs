'use client';

import React, {useState} from 'react';
import {useAppData} from '@/contexts/AppDataContext';
import {Tabs, Tab} from '@heroui/react';
import MembersStatisticTab from './components/MembersStatisticTab';
import MembersListTab from './components/MembersListTab';
import {getGenderOptions} from '@/enums';

export default function MembersAdminPage() {
  const genderOptions = getGenderOptions().reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );

  // State for tabs
  const [activeTab, setActiveTab] = useState('members');

  // Use AppDataContext for members and category data
  const {members, membersLoading, membersError, categories, categoriesLoading, categoriesError} =
    useAppData();

  return (
    <div className="p-6">
      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab key="members" title="Seznam členů">
          <div className="flex flex-col gap-4">
            <MembersListTab categoriesData={categories} sexOptions={genderOptions} />
          </div>
        </Tab>
        <Tab key="statistics" title="Statistiky">
          <div className="flex flex-col gap-4">
            <MembersStatisticTab members={members} categoriesData={categories} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
