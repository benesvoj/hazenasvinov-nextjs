'use client';

import {useState, useEffect} from 'react';

import {Input, Checkbox} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal, Heading} from '@/components';
import {PlayerPosition} from '@/enums';
import {LineupPlayerFormData} from '@/types';

interface LineupPlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: LineupPlayerFormData) => void;
  player: LineupPlayerFormData | null;
  playerName?: string; // Add player name as a prop
}

export default function LineupPlayerEditModal({
  isOpen,
  onClose,
  onSave,
  player,
  playerName,
}: LineupPlayerEditModalProps) {
  const [formData, setFormData] = useState<LineupPlayerFormData>({
    position: 'field_player',
    is_captain: false,
    jersey_number: undefined,
    goals: 0,
    yellow_cards: 0,
    red_cards_5min: 0,
    red_cards_10min: 0,
    red_cards_personal: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const t = translations;

  useEffect(() => {
    if (player) {
      setFormData({
        ...player,
        goals: player.goals || 0,
        yellow_cards: player.yellow_cards || 0,
        red_cards_5min: player.red_cards_5min || 0,
        red_cards_10min: player.red_cards_10min || 0,
        red_cards_personal: player.red_cards_personal || 0,
      });
    }
  }, [player]);

  const handleSave = () => {
    setIsLoading(true);
    onSave(formData);
    onClose();
    setIsLoading(false);
  };

  const updateField = (field: keyof LineupPlayerFormData, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  // Get display name from props or construct from player data
  const getDisplayName = () => {
    if (playerName) return playerName;
    if (player?.display_name) return player.display_name;
    if (player?.name && player?.surname) return `${player.surname} ${player.name}`;
    return 'Neznámý hráč';
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t.lineupManager.playerModal.titleEdit}: ${getDisplayName()}`}
      size="lg"
      isFooterWithActions
      isLoading={isLoading}
      onPress={handleSave}
    >
      <div className="space-y-6">
        {/* Jersey Number */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.lineupManager.playerModal.jerseyNumber}
            type="number"
            value={formData.jersey_number?.toString() || ''}
            onChange={(e) =>
              updateField('jersey_number', e.target.value ? parseInt(e.target.value) : undefined)
            }
            min="1"
            max="99"
            placeholder="1-99"
          />
        </div>

        {/* Position */}
        <div className="flex items-center gap-4">
          <Checkbox
            aria-label={t.playerPosition.goalkeeper}
            isSelected={formData.position === PlayerPosition.GOALKEEPER}
            onValueChange={(isSelected) =>
              updateField(
                'position',
                isSelected ? PlayerPosition.GOALKEEPER : PlayerPosition.FIELD_PLAYER
              )
            }
          >
            {t.playerPosition.goalkeeper}
          </Checkbox>
          <Checkbox
            aria-label={t.playerRoles.captain}
            isSelected={formData.is_captain}
            onValueChange={(isSelected) => updateField('is_captain', isSelected)}
          >
            {t.playerRoles.captain}
          </Checkbox>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <Heading size={4}>{t.lineupManager.playerModal.statistics}</Heading>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.lineupManager.playerModal.goals}
              type="number"
              value={formData.goals?.toString() || '0'}
              onChange={(e) => updateField('goals', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label={t.lineupManager.playerModal.yellowCards}
              type="number"
              value={formData.yellow_cards?.toString() || '0'}
              onChange={(e) => updateField('yellow_cards', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label={t.lineupManager.playerModal.redCards5min}
              type="number"
              value={formData.red_cards_5min?.toString() || '0'}
              onChange={(e) => updateField('red_cards_5min', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label={t.lineupManager.playerModal.redCards10min}
              type="number"
              value={formData.red_cards_10min?.toString() || '0'}
              onChange={(e) => updateField('red_cards_10min', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label={t.lineupManager.playerModal.redCardsPersonal}
              type="number"
              value={formData.red_cards_personal?.toString() || '0'}
              onChange={(e) => updateField('red_cards_personal', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
}
