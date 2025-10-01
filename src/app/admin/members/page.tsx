'use client';

import React, {useState} from 'react';

import {Tabs, Tab} from '@heroui/react';

import {useAppData} from '@/contexts/AppDataContext';

import {AdminContainer} from '@/components';
import {getGenderOptions} from '@/enums';

import MembersListTab from './components/MembersListTab';
import MembersStatisticTab from './components/MembersStatisticTab';

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
    <AdminContainer loading={membersLoading}>
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
    </AdminContainer>
  );
}
