import React from 'react';

import {Button, Tooltip} from '@heroui/react';

import {EyeIcon, PencilIcon, UserGroupIcon, TrashIcon} from '@heroicons/react/24/outline';

import MobileActionsMenu, {ActionItem} from '@/components/ui/navigation/MobileActionsMenu';

import {Match} from '@/types';

interface MatchActionsMenuProps {
  match: Match;
  onAddResult: (match: Match) => void;
  onEditMatch: (match: Match) => void;
  onLineupManager: (match: Match) => void;
  onDeleteMatch: (match: Match) => void;
  isSeasonClosed: boolean;
  className?: string;
}

export default function MatchActionsMenu({
  match,
  onAddResult,
  onEditMatch,
  onLineupManager,
  onDeleteMatch,
  isSeasonClosed,
  className = '',
}: MatchActionsMenuProps) {
  // Prepare actions for mobile menu
  const mobileActions: ActionItem[] = [
    ...(match.status === 'upcoming'
      ? [
          {
            key: 'add-result',
            label: 'Přidat výsledek',
            description: 'Zadat výsledek zápasu',
            color: 'primary' as const,
            variant: 'flat' as const,
            icon: <EyeIcon className="w-4 h-4" />,
            onClick: () => onAddResult(match),
            isDisabled: isSeasonClosed,
          },
        ]
      : []),
    {
      key: 'edit-match',
      label: 'Upravit zápas',
      description: 'Upravit informace o zápasu',
      color: 'warning' as const,
      variant: 'flat' as const,
      icon: <PencilIcon className="w-4 h-4" />,
      onClick: () => onEditMatch(match),
      isDisabled: isSeasonClosed,
    },
    {
      key: 'lineup-manager',
      label: 'Správa sestav',
      description: 'Spravovat sestavy týmů',
      color: 'secondary' as const,
      variant: 'flat' as const,
      icon: <UserGroupIcon className="w-4 h-4" />,
      onClick: () => onLineupManager(match),
      isDisabled: isSeasonClosed,
    },
    {
      key: 'delete-match',
      label: 'Smazat zápas',
      description: 'Trvale smazat zápas',
      color: 'danger' as const,
      variant: 'flat' as const,
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: () => onDeleteMatch(match),
      isDisabled: isSeasonClosed,
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Desktop: Show all buttons horizontally */}
      <div className="hidden lg:flex justify-end space-x-2">
        {match.status === 'upcoming' && (
          <Tooltip content="Přidat výsledek">
            <Button
              size="sm"
              color="primary"
              startContent={<EyeIcon className="w-4 h-4" />}
              onPress={() => onAddResult(match)}
              isDisabled={isSeasonClosed}
            />
          </Tooltip>
        )}
        <Tooltip content="Upravit zápas">
          <Button
            size="sm"
            color="warning"
            startContent={<PencilIcon className="w-4 h-4" />}
            onPress={() => onEditMatch(match)}
            isDisabled={isSeasonClosed}
          />
        </Tooltip>
        <Tooltip content="Správa sestav">
          <Button
            size="sm"
            color="secondary"
            startContent={<UserGroupIcon className="w-4 h-4" />}
            onPress={() => onLineupManager(match)}
            isDisabled={isSeasonClosed}
          />
        </Tooltip>
        <Tooltip content="Smazat zápas">
          <Button
            size="sm"
            color="danger"
            startContent={<TrashIcon className="w-4 h-4" />}
            onPress={() => onDeleteMatch(match)}
            isDisabled={isSeasonClosed}
          />
        </Tooltip>
      </div>

      {/* Mobile: Use MobileActionsMenu component */}
      <div className="lg:hidden">
        <MobileActionsMenu
          actions={mobileActions}
          title={`Akce pro zápas`}
          description={`${match.home_team?.name || 'Domácí tým'} vs ${match.away_team?.name || 'Hostující tým'}`}
          triggerColor="secondary"
          triggerVariant="light"
          triggerSize="sm"
          className="w-auto"
        />
      </div>
    </div>
  );
}
