import {Button} from '@heroui/button';
import {Card, CardBody} from '@heroui/card';
import {Checkbox} from '@heroui/checkbox';
import {Input} from '@heroui/input';
import {Select, SelectItem} from '@heroui/select';

import {TrashIcon} from '@heroicons/react/24/outline';

import {LineupPlayerFormData, Member} from '@/types';

interface LineupManagerPlayerCardProps {
  index: number;
  player: LineupPlayerFormData;
  isOwnClub: boolean;
  filteredMembers: Member[];
  updatePlayer: (index: number, field: keyof LineupPlayerFormData, value: any) => void;
  removePlayer: (index: number) => void;
}

export default function LineupManagerPlayerCard({
  index,
  player,
  isOwnClub,
  filteredMembers,
  updatePlayer,
  removePlayer,
}: LineupManagerPlayerCardProps) {
  return (
    <Card key={index} className="border border-gray-200">
      <CardBody className="p-4">
        <div className="space-y-4">
          {/* Player Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                Hráč {index + 1} {player.display_name}
              </span>
            </div>
            <Button
              size="sm"
              color="danger"
              variant="light"
              isIconOnly
              onPress={() => removePlayer(index)}
              className="min-w-8 w-8 h-8"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Player Form */}
          <div className="space-y-3">
            {isOwnClub ? (
              // Internal player form (own club)
              <>
                <Select
                  label="Hráč"
                  selectedKeys={player.member_id ? [player.member_id] : []}
                  onSelectionChange={(keys: any) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    updatePlayer(index, 'member_id', selectedKey);
                  }}
                  placeholder="Vyberte hráče"
                  isRequired
                  classNames={{
                    trigger: 'min-h-12',
                  }}
                >
                  {filteredMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      textValue={`${member.surname} ${member.name} (${member.registration_number})`}
                    >
                      {member.surname} {member.name} ({member.registration_number})
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="number"
                  label="Číslo dresu"
                  value={player.jersey_number?.toString() || ''}
                  onValueChange={(value) => {
                    const num = value ? parseInt(value) : undefined;
                    const valid = typeof num === 'number' && !isNaN(num) && num >= 1 && num <= 99;
                    updatePlayer(index, 'jersey_number', valid ? num : undefined);
                  }}
                  min="1"
                  max="99"
                  placeholder="1-99"
                  classNames={{
                    input: 'text-center',
                  }}
                />

                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      isSelected={player.position === 'goalkeeper'}
                      onValueChange={(isSelected) => {
                        updatePlayer(index, 'position', isSelected ? 'goalkeeper' : 'field_player');
                      }}
                    >
                      Brankář
                    </Checkbox>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Checkbox
                      isSelected={player.is_captain}
                      onValueChange={() => {
                        updatePlayer(index, 'is_captain', !player.is_captain);
                      }}
                    >
                      Kapitán
                    </Checkbox>
                  </div>

                  {/* Goal and Card Tracking */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      label="Góly"
                      value={player.goals?.toString() || '0'}
                      onValueChange={(value) => updatePlayer(index, 'goals', parseInt(value) || 0)}
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Žluté karty"
                      value={player.yellow_cards?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'yellow_cards', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (5 min)"
                      value={player.red_cards_5min?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_5min', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (10 min)"
                      value={player.red_cards_10min?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_10min', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (OT)"
                      value={player.red_cards_personal?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_personal', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              // External player form (other club)
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Registrační číslo"
                    placeholder="Reg. číslo"
                    value={player.registration_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updatePlayer(index, 'registration_number', e.target.value)
                    }
                  />
                  <Input
                    label="Jméno"
                    placeholder="Jméno"
                    value={player.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updatePlayer(index, 'name', e.target.value)
                    }
                  />
                </div>
                <Input
                  label="Příjmení"
                  placeholder="Příjmení"
                  value={player.surname || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updatePlayer(index, 'surname', e.target.value)
                  }
                />

                <Input
                  type="number"
                  label="Číslo dresu"
                  value={player.jersey_number?.toString() || ''}
                  onValueChange={(value) =>
                    updatePlayer(index, 'jersey_number', value ? parseInt(value) : undefined)
                  }
                  min="1"
                  max="99"
                  placeholder="1-99"
                  classNames={{
                    input: 'text-center',
                  }}
                />
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      isSelected={player.position === 'goalkeeper'}
                      onValueChange={(isSelected) => {
                        updatePlayer(index, 'position', isSelected ? 'goalkeeper' : 'field_player');
                      }}
                    >
                      Brankář
                    </Checkbox>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Checkbox
                      isSelected={player.is_captain}
                      onValueChange={(isSelected) => {
                        updatePlayer(index, 'is_captain', !player.is_captain);
                      }}
                    >
                      Kapitán
                    </Checkbox>
                  </div>

                  {/* Goal and Card Tracking */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      label="Góly"
                      value={player.goals?.toString() || '0'}
                      onValueChange={(value) => updatePlayer(index, 'goals', parseInt(value) || 0)}
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Žluté karty"
                      value={player.yellow_cards?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'yellow_cards', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (5 min)"
                      value={player.red_cards_5min?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_5min', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (10 min)"
                      value={player.red_cards_10min?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_10min', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                    <Input
                      type="number"
                      label="Červené karty (OT)"
                      value={player.red_cards_personal?.toString() || '0'}
                      onValueChange={(value) =>
                        updatePlayer(index, 'red_cards_personal', parseInt(value) || 0)
                      }
                      min="0"
                      classNames={{
                        input: 'text-center',
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
