import React, {memo, useCallback} from 'react';

import {Button, ButtonGroup} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {UnifiedTable} from '@/components';
import {ColumnAlignType, PlayerPosition} from '@/enums';
import {LineupPlayerFormData} from '@/types';

interface PlayersTableProps {
  players: LineupPlayerFormData[];
  onEditPlayer: (index: number) => void;
  onDeletePlayer: (index: number) => void;
  getMemberName: (memberId: string) => string;
  t: any;
}

const PlayersTable: React.FC<PlayersTableProps> = memo(
  ({players, onEditPlayer, onDeletePlayer, getMemberName, t}) => {
    const playersColumns = [
      {key: 'name', label: 'Hráč', allowsSorting: true},
      {key: 'position', label: 'Pozice', allowsSorting: true},
      {key: 'jersey_number', label: 'Dres', allowsSorting: true, align: ColumnAlignType.CENTER},
      {key: 'goals', label: 'Góly', allowsSorting: true, align: ColumnAlignType.CENTER},
      {key: 'yellow_cards', label: 'ŽK', allowsSorting: true, align: ColumnAlignType.CENTER},
      {key: 'red_cards_5min', label: 'ČK5', allowsSorting: true, align: ColumnAlignType.CENTER},
      {key: 'red_cards_10min', label: 'ČK10', allowsSorting: true, align: ColumnAlignType.CENTER},
      {
        key: 'red_cards_personal',
        label: 'ČKOT',
        allowsSorting: true,
        align: ColumnAlignType.CENTER,
      },
      {key: 'actions', label: 'Akce', align: ColumnAlignType.CENTER},
    ];

    const renderPlayerCell = useCallback(
      (player: LineupPlayerFormData, columnKey: React.Key) => {
        const cellValue = player[columnKey as keyof LineupPlayerFormData];

        switch (columnKey) {
          case 'name':
            return getMemberName(player?.member_id || `${t.unknownPlayer}`);
          case 'position':
            return player.position === PlayerPosition.GOALKEEPER ? t.goalkeeper : t.player;
          case 'jersey_number':
            return player.jersey_number || '-';
          case 'goals':
            return player.goals || 0;
          case 'yellow_cards':
            return player.yellow_cards || 0;
          case 'red_cards_5min':
            return player.red_cards_5min || 0;
          case 'red_cards_10min':
            return player.red_cards_10min || 0;
          case 'red_cards_personal':
            return player.red_cards_personal || 0;
          case 'actions':
            const playerIndex = players.findIndex((p) => p.member_id === player.member_id);
            return (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="light"
                  onPress={() => onEditPlayer(playerIndex)}
                  isIconOnly
                  aria-label={`Upravit hráče ${getMemberName(player?.member_id || '')}`}
                  title="Upravit hráče"
                  startContent={<PencilIcon className="w-4 h-4" />}
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => onDeletePlayer(playerIndex)}
                  isIconOnly
                  aria-label={`Odebrat hráče ${getMemberName(player?.member_id || '')}`}
                  title="Odebrat hráče"
                  startContent={<TrashIcon className="w-4 h-4" />}
                />
              </div>
            );
          default:
            return cellValue;
        }
      },
      [players, getMemberName, onEditPlayer, onDeletePlayer, t]
    );

    return (
      <UnifiedTable
        columns={playersColumns}
        data={players}
        ariaLabel={t.listOfPlayers}
        renderCell={renderPlayerCell}
        getKey={(player) => player.member_id || ''}
        isStriped
      />
    );
  }
);

PlayersTable.displayName = 'PlayersTable';

export default PlayersTable;
