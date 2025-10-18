'use client';
import React from 'react';

import {useAppData} from '@/contexts/AppDataContext';

import {AdminContainer} from '@/components';
import {getGenderOptions} from '@/enums';
import {translations} from '@/lib';

import MembersListTab from './components/MembersListTab';
import MembersStatisticTab from './components/MembersStatisticTab';

export default function MembersAdminPage() {
  const [activeTab, setActiveTab] = React.useState<string>('members');
  const genderOptions = getGenderOptions().reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );

  // Use AppDataContext for members and category data
  const {members, membersLoading, membersError, categories, categoriesLoading, categoriesError} =
    useAppData();

  const t = translations.members.tabs;

  return (
    <AdminContainer
      loading={membersLoading}
      tabs={[
        {
          key: 'members',
          title: t.members,
          content: <MembersListTab categoriesData={categories} sexOptions={genderOptions} />,
        },
        {
          key: 'statistics',
          title: t.statistics,
          content: <MembersStatisticTab members={members} categoriesData={categories} />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
