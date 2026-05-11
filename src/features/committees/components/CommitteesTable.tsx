'use client';

import React from 'react';

import {translations} from '@/lib/translations';

import {UnifiedTable} from '@/components';
import {ActionTypes} from '@/enums';
import {Committee} from '@/types';

interface CommitteesTableProps {
  data: Committee[];
  isLoading: boolean;
  onEdit: (c: Committee) => void;
  onDelete: (c: Committee) => void;
}

export const CommitteesTable = ({data, isLoading, onEdit, onDelete}: CommitteesTableProps) => {
  const committeeColumns = [
    {key: 'code', label: translations.committees.table.code},
    {key: 'name', label: translations.committees.table.name},
    {key: 'description', label: translations.committees.table.description},
    {key: 'status', label: translations.committees.table.status},
    {key: 'sort_order', label: translations.committees.table.sortOrder},
    {
      key: 'actions',
      label: translations.common.table.columns.actions,
      isActionColumn: true,
      actions: [
        {
          type: ActionTypes.UPDATE,
          onPress: onEdit,
          title: translations.common.actions.edit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: onDelete,
          title: translations.common.actions.delete,
        },
      ],
    },
  ];

  const renderCommitteeCell = (committee: Committee, columnKey: string) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-medium">{committee.code}</span>;
      case 'name':
        return <span className="font-medium">{committee.name}</span>;
      case 'description':
        return <span className="font-medium">{committee.description || '-'}</span>;
      case 'status':
        return (
          <span className="font-medium">
            {committee.is_active
              ? translations.committees.table.activeLabel
              : translations.committees.table.inactiveLabel}
          </span>
        );
      case 'sort_order':
        return <span className="font-medium">{committee.sort_order}</span>;
    }
  };

  return (
    <UnifiedTable
      isLoading={isLoading}
      columns={committeeColumns}
      data={data}
      ariaLabel={translations.committees.title}
      renderCell={renderCommitteeCell}
      getKey={(committee: Committee) => committee.id}
      emptyContent={translations.committees.table.noCommittees}
      isStriped
    />
  );
};
