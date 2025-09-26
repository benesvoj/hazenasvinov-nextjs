import React from 'react';
import {Button, ButtonGroup} from '@heroui/react';
import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';
import {UnifiedTable} from '@/components';
import {LineupCoachFormData} from '@/types';
import {getLineupCoachRoleOptions} from '@/enums';

interface CoachesTableProps {
  coaches: LineupCoachFormData[];
  onEditCoach: (index: number) => void;
  onDeleteCoach: (index: number) => void;
  getMemberName: (memberId: string) => string;
  t: any;
}

const CoachesTable: React.FC<CoachesTableProps> = ({
  coaches,
  onEditCoach,
  onDeleteCoach,
  getMemberName,
  t,
}) => {
  const coachesColumns = [
    {key: 'name', label: 'Trenér'},
    {key: 'role', label: 'Funkce'},
    {key: 'actions', label: 'Akce', align: 'center' as const},
  ];

  const renderCoachCell = React.useCallback(
    (coach: LineupCoachFormData, columnKey: React.Key) => {
      const cellValue = coach[columnKey as keyof LineupCoachFormData];

      switch (columnKey) {
        case 'name':
          return getMemberName(coach.member_id);
        case 'role':
          return (
            getLineupCoachRoleOptions().find((role) => role.value === coach.role)?.label ||
            coach.role
          );
        case 'actions':
          const coachIndex = coaches.findIndex((item) => item.member_id === coach.member_id);
          return (
            <ButtonGroup>
              <Button
                size="sm"
                color="primary"
                variant="light"
                onPress={() => onEditCoach(coachIndex)}
                isIconOnly
                aria-label={t.editCoach}
                startContent={<PencilIcon className="w-4 h-4" />}
              />
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={() => onDeleteCoach(coachIndex)}
                isIconOnly
                aria-label={t.deleteCoach}
                startContent={<TrashIcon className="w-4 h-4" />}
              />
            </ButtonGroup>
          );
        default:
          return cellValue;
      }
    },
    [coaches, getMemberName, onEditCoach, onDeleteCoach, t]
  );

  return (
    <UnifiedTable
      columns={coachesColumns}
      data={coaches}
      ariaLabel={t.listOfCoaches}
      renderCell={renderCoachCell}
      getKey={(coach) => coach.member_id}
      isStriped
    />
  );
};

export default CoachesTable;
