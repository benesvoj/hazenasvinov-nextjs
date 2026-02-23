'use client';

import React from 'react';

import {translations} from '@/lib/translations/index';

import {AdminContainer, UnifiedTable} from '@/components';
import {useFetchRoleDefinitions} from '@/hooks';
import {RoleDefinitionSchema} from '@/types';

export default function UserRolesPage() {
  const {data: roleDefinitions, loading, refetch} = useFetchRoleDefinitions();

  const columns = [
    {key: 'name', label: translations.admin.roleDefinitions.table.columns.name},
    {key: 'display_name', label: translations.admin.roleDefinitions.table.columns.displayName},
    {key: 'description', label: translations.admin.roleDefinitions.table.columns.description},
    {key: 'permissions', label: translations.admin.roleDefinitions.table.columns.permissions},
    {key: 'isActive', label: translations.admin.roleDefinitions.table.columns.isActive},
  ];

  const renderCells = (item: RoleDefinitionSchema, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{item.name}</span>;
      case 'display_name':
        return <span className="font-medium">{item.display_name}</span>;
      case 'description':
        return <span className="font-medium">{item.description || '-'}</span>;
      case 'permissions':
        return <span className="font-medium">{''}</span>;
      case 'isActive':
        return (
          <span className={`font-medium ${item.is_active ? 'text-green-600' : 'text-red-600'}`}>
            {item.is_active ? 'Yes' : 'No'}
          </span>
        );
    }
  };

  return (
    <AdminContainer loading={loading}>
      <UnifiedTable
        columns={columns}
        data={roleDefinitions}
        ariaLabel={translations.admin.roleDefinitions.table.ariaLabel}
        getKey={(item: RoleDefinitionSchema) => item.id}
        renderCell={renderCells}
        isStriped
      />
    </AdminContainer>
  );
}
