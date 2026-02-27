'use client';

import React from 'react';

import {Badge, Button} from '@heroui/react';

import {DocumentTextIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {hasItems} from '@/utils/arrayHelper';

import {ThemeSwitch} from '@/components';
import {UserRoles} from '@/enums';
import {ReleaseNote} from '@/types';

interface TopBarActionsProps {
  releaseNotes: ReleaseNote[];
  variant: UserRoles;
  handleReleaseNotes: () => void;
}

export const TopBarActions = ({releaseNotes, variant, handleReleaseNotes}: TopBarActionsProps) => {
  return (
    <>
      <ThemeSwitch />
      <Button
        isIconOnly
        variant="light"
        size="sm"
        className="relative hidden sm:flex"
        onPress={handleReleaseNotes}
        title={translations.topBar.labels.releaseNotes}
      >
        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {hasItems(releaseNotes) && (
          <Badge
            color="primary"
            size="sm"
            className={variant === UserRoles.ADMIN ? '' : 'absolute -top-1 -right-1'}
          >
            {releaseNotes.length}
          </Badge>
        )}
      </Button>
    </>
  );
};
