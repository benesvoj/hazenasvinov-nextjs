import React, {memo} from 'react';

import {LINEUP_VALIDATION_RULES} from '@/app/constants/lineupValidationRules';

import {UnifiedCard} from '@/components';
import {TeamTypes} from '@/enums';
import {LineupSummary} from '@/types';

interface TeamSelectorProps {
  selectedTeam: TeamTypes;
  onTeamSelect: (team: TeamTypes) => void;
  homeTeamName: string;
  awayTeamName: string;
  homeFormData: any;
  awayFormData: any;
  calculateLocalSummary: (formData: any) => LineupSummary;
  t: any;
}

const TeamSelector: React.FC<TeamSelectorProps> = memo(
  ({
    selectedTeam,
    onTeamSelect,
    homeTeamName,
    awayTeamName,
    homeFormData,
    awayFormData,
    calculateLocalSummary,
    t,
  }) => {
    const getLineupSummaryDisplay = (summary: LineupSummary | null, teamName: string) => {
      if (!summary) {
        return (
          <div className="text-gray-500 text-sm" role="status" aria-live="polite">
            Žádná sestava
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{teamName}</span>
          </div>
          <div
            className="text-xs text-gray-600 space-x-2"
            role="status"
            aria-live="polite"
            aria-label={`Sestava pro ${teamName}: ${summary.goalkeepers} brankářů z ${LINEUP_VALIDATION_RULES.MAX_GOALKEEPERS}, ${summary.field_players} hráčů z ${LINEUP_VALIDATION_RULES.MAX_FIELD_PLAYERS}, ${summary.coaches} trenérů z ${LINEUP_VALIDATION_RULES.MAX_COACHES}`}
          >
            <span>
              {t.goalkeepers}: {summary.goalkeepers}/{LINEUP_VALIDATION_RULES.MAX_GOALKEEPERS}
            </span>
            <span>
              {t.players}: {summary.field_players}/{LINEUP_VALIDATION_RULES.MAX_FIELD_PLAYERS}
            </span>
            <span>
              {t.coaches}: {summary.coaches}/{LINEUP_VALIDATION_RULES.MAX_COACHES}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UnifiedCard
          onPress={() => onTeamSelect(TeamTypes.HOME)}
          title={t.homeTeam}
          titleSize={4}
          isSelected={selectedTeam === TeamTypes.HOME}
        >
          {getLineupSummaryDisplay(calculateLocalSummary(homeFormData), homeTeamName)}
        </UnifiedCard>
        <UnifiedCard
          onPress={() => onTeamSelect(TeamTypes.AWAY)}
          title={t.awayTeam}
          titleSize={4}
          isSelected={selectedTeam === TeamTypes.AWAY}
        >
          {getLineupSummaryDisplay(calculateLocalSummary(awayFormData), awayTeamName)}
        </UnifiedCard>
      </div>
    );
  }
);

TeamSelector.displayName = 'TeamSelector';

export default TeamSelector;
