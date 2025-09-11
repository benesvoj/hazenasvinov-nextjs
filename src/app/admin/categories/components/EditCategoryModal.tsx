import React from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {Badge} from '@heroui/badge';
import {Tabs, Tab} from '@heroui/tabs';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from '@heroui/react';
import {PlusIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

interface CategorySeason {
  id: string;
  category_id: string;
  season_id: string;
  matchweek_count: number;
  competition_type: 'league' | 'league_playoff' | 'tournament';
  team_count: number;
  allow_team_duplicates: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  season?: {
    id: string;
    name: string;
  };
}

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: () => void;
  onAddSeason: () => void;
  onEditSeason: (categorySeason: CategorySeason) => void;
  onRemoveSeason: (seasonId: string) => void;
  formData: {
    name: string;
    description: string;
    age_group: string;
    gender: string;
    is_active: boolean;
    sort_order: number;
  };
  setFormData: (data: any) => void;
  categorySeasons: CategorySeason[];
  ageGroups: Record<string, string>;
  genders: Record<string, string>;
  competitionTypes: Record<string, string>;
}

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
  ageGroups,
  genders,
  competitionTypes,
}: EditCategoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>Upravit kategorii</ModalHeader>
        <ModalBody>
          <Tabs aria-label="Category edit tabs" className="w-full">
            <Tab key="basic" title="Základní údaje">
              <div className="space-y-4 pt-4">
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
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={formData.age_group}
                  onChange={(e) => setFormData({...formData, age_group: e.target.value})}
                >
                  <option value="">Vyberte věkovou skupinu</option>
                  {Object.entries(ageGroups).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Vyberte pohlaví</option>
                  {Object.entries(genders).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <Input
                  label="Pořadí"
                  type="number"
                  value={formData.sort_order.toString()}
                  onChange={(e) =>
                    setFormData({...formData, sort_order: parseInt(e.target.value) || 0})
                  }
                  placeholder="0"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
                </label>
              </div>
            </Tab>

            <Tab key="seasons" title="Sezóny">
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Zde můžete spravovat sezóny pro tuto kategorii. Každá kategorie může být použita
                    v několika sezónách s různými nastaveními.
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
                            <Badge color="primary" variant="flat" size="sm">
                              {competitionTypes[categorySeason.competition_type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {categorySeason.matchweek_count}
                          </TableCell>
                          <TableCell className="text-sm">{categorySeason.team_count}</TableCell>
                          <TableCell className="text-sm">
                            {categorySeason.allow_team_duplicates ? 'Ano' : 'Ne'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={categorySeason.is_active ? 'success' : 'danger'}
                              variant="flat"
                              size="sm"
                            >
                              {categorySeason.is_active ? 'Aktivní' : 'Neaktivní'}
                            </Badge>
                          </TableCell>
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
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={onUpdateCategory}>
            Uložit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
