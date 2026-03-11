import React, {useMemo} from 'react';

import {Checkbox, CheckboxGroup} from '@heroui/checkbox';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, Grid, GridItem, Heading} from '@/components';
import {getPlayerPositionOptions, PLAYER_POSITION_LABELS, PlayerPosition} from '@/enums';
import {MemberInternal} from '@/types';

export interface LineupMemberSetupData {
  position: PlayerPosition.GOALKEEPER | PlayerPosition.FIELD_PLAYER;
  jerseyNumber: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export const DEFAULT_SETUP_DATA: LineupMemberSetupData = {
  position: PlayerPosition.FIELD_PLAYER,
  jerseyNumber: '',
  isCaptain: false,
  isViceCaptain: false,
};

interface LineupMemberSetupCardProps {
  existingJerseyNumbers: number[];
  selectedMemberData: MemberInternal;
  value: LineupMemberSetupData;
  onChange: (data: LineupMemberSetupData) => void;
}

export const LineupMemberSetupCard = ({
  existingJerseyNumbers,
  selectedMemberData,
  value,
  onChange,
}: LineupMemberSetupCardProps) => {
  const t = translations.lineupMembers.lineupMemberSetupCard;

  const availableJerseyNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 1; i <= 99; i++) {
      if (!existingJerseyNumbers.includes(i)) {
        numbers.push(i);
      }
    }
    return numbers.map((number) => ({
      key: number.toString(),
      label: number.toString(),
    }));
  }, [existingJerseyNumbers]);

  const positionOptions = getPlayerPositionOptions().map((option) => ({
    key: option.value,
    label: option.label,
  }));

  const update = (partial: Partial<LineupMemberSetupData>) => {
    onChange({...value, ...partial});
  };

  return (
    <ContentCard title={translations.lineupMembers.lineupMemberSetupCard.title}>
      <Grid columns={2} gap={'md'}>
        <Choice
          items={positionOptions}
          value={value.position}
          onChange={(v) => update({position: v as PlayerPosition})}
          label={t.labels.position}
          placeholder={t.placeholders.position}
          size="sm"
          isRequired
        />

        <Choice
          items={availableJerseyNumbers}
          value={value.jerseyNumber}
          onChange={(v) => update({jerseyNumber: v as string})}
          label={t.labels.jerseyNumber}
          placeholder={t.placeholders.jerseyNumber}
          size="sm"
        />
      </Grid>

      <div className="mt-4 space-y-2">
        <CheckboxGroup label={t.functionSection.title} orientation={'horizontal'}>
          <Checkbox
            isSelected={value.isCaptain}
            onValueChange={(v) => update({isCaptain: v})}
            isDisabled={value.isViceCaptain}
            size="sm"
          >
            {t.functionSection.captain}
          </Checkbox>
          <Checkbox
            isSelected={value.isViceCaptain}
            onValueChange={(v) => update({isViceCaptain: v})}
            isDisabled={value.isCaptain}
            size="sm"
          >
            {t.functionSection.viceCaptain}
          </Checkbox>
        </CheckboxGroup>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <Heading size={4}>{t.labels.selectedMemberTitle}</Heading>
        <Grid columns={2}>
          <GridItem span={1}>
            <div>
              <strong>{t.labels.name}:</strong> {selectedMemberData.name}{' '}
              {selectedMemberData.surname}
            </div>
            <div>
              <strong>{t.labels.registrationNumber}:</strong>{' '}
              {selectedMemberData.registration_number}
            </div>
            <div>
              <strong>{t.labels.position}:</strong>{' '}
              {value.position === PlayerPosition.GOALKEEPER
                ? PLAYER_POSITION_LABELS.goalkeeper
                : PLAYER_POSITION_LABELS.field_player}
            </div>
          </GridItem>
          <GridItem span={1}>
            {value.jerseyNumber && (
              <div>
                <strong>{t.labels.jerseyNumber}:</strong> {value.jerseyNumber}
              </div>
            )}
            {(value.isCaptain || value.isViceCaptain) && (
              <div>
                <strong>{t.functionSection.title}:</strong>{' '}
                {value.isCaptain ? t.functionSection.captain : t.functionSection.viceCaptain}
              </div>
            )}
          </GridItem>
        </Grid>
      </div>
    </ContentCard>
  );
};
