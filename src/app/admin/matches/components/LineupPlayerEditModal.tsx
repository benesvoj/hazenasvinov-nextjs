'use client';

import {useState, useEffect} from 'react';
import {UnifiedModal} from '@/components';
import {Input, Checkbox} from '@heroui/react';
import {LineupPlayerFormData} from '@/types';

interface LineupPlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: LineupPlayerFormData) => void;
  player: LineupPlayerFormData | null;
  playerIndex: number;
  isOwnClub: boolean;
}

export default function LineupPlayerEditModal({
  isOpen,
  onClose,
  onSave,
  player,
  playerIndex,
  isOwnClub,
}: LineupPlayerEditModalProps) {
  const [formData, setFormData] = useState<LineupPlayerFormData>({
    is_external: false,
    position: 'field_player',
    role: 'player',
    jersey_number: undefined,
    goals: 0,
    yellow_cards: 0,
    red_cards_5min: 0,
    red_cards_10min: 0,
    red_cards_personal: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const getPlayerName = () => {
    if (isOwnClub && player?.member_id) {
      // For internal players, we'd need to get the member name from props or context
      return `Hráč ${playerIndex + 1}`;
    } else {
      return (
        `${player?.external_surname || ''} ${player?.external_name || ''}`.trim() ||
        `Externí hráč ${playerIndex + 1}`
      );
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upravit hráče: ${getPlayerName()}`}
      size="lg"
      isFooterWithActions
      isLoading={isLoading}
      onPress={handleSave}
    >
      <div className="space-y-6">
        {/* Jersey Number */}
        <Input
          label="Číslo dresu"
          type="number"
          value={formData.jersey_number?.toString() || ''}
          onChange={(e) =>
            updateField('jersey_number', e.target.value ? parseInt(e.target.value) : undefined)
          }
          min="1"
          max="99"
          placeholder="1-99"
        />

        {/* Position */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Pozice</label>
          <div className="flex items-center space-x-4">
            <Checkbox
              isSelected={formData.position === 'goalkeeper'}
              onValueChange={(isSelected) =>
                updateField('position', isSelected ? 'goalkeeper' : 'field_player')
              }
            >
              Brankář
            </Checkbox>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Funkce</label>
          <div className="flex items-center space-x-4">
            <Checkbox
              isSelected={formData.role === 'captain'}
              onValueChange={(isSelected) => updateField('role', isSelected ? 'captain' : 'player')}
            >
              Kapitán
            </Checkbox>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Statistiky</h4>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Góly"
              type="number"
              value={formData.goals?.toString() || '0'}
              onChange={(e) => updateField('goals', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label="Žluté karty"
              type="number"
              value={formData.yellow_cards?.toString() || '0'}
              onChange={(e) => updateField('yellow_cards', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label="Červené karty (5 min)"
              type="number"
              value={formData.red_cards_5min?.toString() || '0'}
              onChange={(e) => updateField('red_cards_5min', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label="Červené karty (10 min)"
              type="number"
              value={formData.red_cards_10min?.toString() || '0'}
              onChange={(e) => updateField('red_cards_10min', parseInt(e.target.value) || 0)}
              min="0"
            />
            <Input
              label="Červené karty (OT)"
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
