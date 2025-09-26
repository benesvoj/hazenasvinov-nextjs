import React from 'react';
import {
  Button,
  Input,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Checkbox,
} from '@heroui/react';
import {PlusIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline';
import {EditCategoryModalProps} from '@/types';
import {UnifiedModal} from '@/components';
import {
  getAgeGroupsOptions,
  getGenderOptions,
  Genders,
  AgeGroups,
  COMPETITION_TYPES,
} from '@/enums';

export default function EditCategoryModal({
  isOpen,
  onClose,
  onUpdateCategory,
  onAddSeason,
  onEditSeason,
  onRemoveSeason,
  formData,
  setFormData,
  categorySeasons,
}: EditCategoryModalProps) {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upravit kategorii"
      size="3xl"
      onPress={onUpdateCategory}
      isFooterWithActions
    >
      <Tabs aria-label="Category edit tabs" className="w-full">
        <Tab key="basic" title="Základní údaje">
          <div className="space-y-4 pt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Název"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              isRequired
              placeholder="např. Muži, Ženy, Dorostenci"
            />
            <Input
              label="Popis"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Volitelný popis kategorie"
            />
            <Select
              label="Věková skupina"
              placeholder="Vyberte věkovou skupinu"
              selectedKeys={formData.age_group ? [formData.age_group] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as AgeGroups;
                setFormData({...formData, age_group: selectedKey});
              }}
            >
              {getAgeGroupsOptions().map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
            <Select
              label="Pohlaví"
              placeholder="Vyberte pohlaví"
              selectedKeys={formData.gender ? [formData.gender] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as Genders;
                setFormData({...formData, gender: selectedKey});
              }}
              description="Smíšené týmy mohou být pouze pro mládežnické kategorie"
            >
              {getGenderOptions().map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
            <Input
              label="Pořadí"
              type="number"
              value={formData.sort_order?.toString() || '0'}
              onChange={(e) =>
                setFormData({...formData, sort_order: parseInt(e.target.value) || 0})
              }
              placeholder="0"
              description="Nižší číslo = vyšší priorita v seznamu"
            />
            <div className="col-span-2">
              <Checkbox
                isSelected={formData.is_active}
                onValueChange={(checked) => setFormData({...formData, is_active: checked})}
              >
                Aktivní
              </Checkbox>
            </div>
          </div>
        </Tab>

        <Tab key="seasons" title="Sezóny">
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Zde můžete spravovat sezóny pro tuto kategorii. Každá kategorie může být použita v
                několika sezónách s různými nastaveními.
              </p>
            </div>

            {/* Add Season Button */}
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Přiřazené sezóny ({categorySeasons.length})
              </h4>
              <Button
                color="primary"
                size="sm"
                onPress={onAddSeason}
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                Přidat sezónu
              </Button>
            </div>

            {/* Seasons Table */}
            {categorySeasons.length > 0 ? (
              <Table aria-label="Category seasons table">
                <TableHeader>
                  <TableColumn>SEZÓNA</TableColumn>
                  <TableColumn>TYP SOUTĚŽE</TableColumn>
                  <TableColumn>POČET KOL</TableColumn>
                  <TableColumn>POČET TÝMŮ</TableColumn>
                  <TableColumn>A/B TÝMY</TableColumn>
                  <TableColumn>STAV</TableColumn>
                  <TableColumn>AKCE</TableColumn>
                </TableHeader>
                <TableBody>
                  {categorySeasons.map((categorySeason) => (
                    <TableRow key={categorySeason.id}>
                      <TableCell className="text-sm">
                        {categorySeason.season?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {COMPETITION_TYPES[categorySeason.competition_type] ||
                          categorySeason.competition_type}
                      </TableCell>
                      <TableCell className="text-sm">{categorySeason.matchweek_count}</TableCell>
                      <TableCell className="text-sm">{categorySeason.team_count}</TableCell>
                      <TableCell className="text-sm">
                        {categorySeason.allow_team_duplicates ? 'Ano' : 'Ne'}
                      </TableCell>
                      <TableCell>{categorySeason.is_active ? 'Aktivní' : 'Neaktivní'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            color="primary"
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => onEditSeason(categorySeason)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => onRemoveSeason(categorySeason.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Žádné sezóny nejsou přiřazeny k této kategorii.</p>
                <p className="text-sm mt-2">
                  Klikněte na &quot;Přidat sezónu&quot; pro přiřazení první sezóny.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </UnifiedModal>
  );
}
