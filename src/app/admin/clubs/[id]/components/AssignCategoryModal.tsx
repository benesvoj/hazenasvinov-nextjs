// TODO: extract supabase into API calls

'use client';

import React, {useCallback, useEffect, useState} from 'react';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';

import {isEmpty} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {LoadingSpinner} from '@/components';
import {useSupabaseClient} from '@/hooks';
import {Category, Season} from '@/types';

interface AssignCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignCategory: (formData: {
    category_id: string;
    season_id: string;
    max_teams: number;
  }) => Promise<void>;
  clubId: string;
  assignedCategoryIds: string[];
  selectedSeasonId?: string;
}

export default function AssignCategoryModal({
  isOpen,
  onClose,
  onAssignCategory,
  clubId,
}: AssignCategoryModalProps) {
  const [formData, setFormData] = useState({
    category_id: '',
    season_id: '',
    max_teams: 1,
  });
  const [assignedCategoriesForSeason, setAssignedCategoriesForSeason] = useState<string[]>([]);

  // Use AppDataContext for data fetching
  const {
    categories: {data: categories, refetch: refreshCategories},
    seasons: {data: seasons, activeSeason, refetch: refreshSeasons},
    loading: appDataLoading,
  } = useAppData();

  const loading = appDataLoading;
  const supabase = useSupabaseClient();

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshCategories();
      refreshSeasons();
    }
  }, [isOpen, refreshCategories, refreshSeasons]);

  // Auto-select active season when it becomes available
  useEffect(() => {
    if (activeSeason && !formData.season_id) {
      setFormData((prev) => ({
        ...prev,
        season_id: activeSeason.id,
      }));
    }
  }, [activeSeason, formData.season_id]);

  // Fetch assigned category for the selected season
  const fetchAssignedCategoriesForSeason = useCallback(
    async (seasonId: string) => {
      if (!seasonId || !clubId) return;

      try {
        const {data, error} = await supabase
          .from('club_categories')
          .select('category_id')
          .eq('club_id', clubId)
          .eq('season_id', seasonId)
          .eq('is_active', true);

        if (error) throw error;

        const categoryIds = data?.map((item: any) => item.category_id) || [];
        setAssignedCategoriesForSeason(categoryIds);
      } catch (error) {
        console.error('Error fetching assigned category for season:', error);
        setAssignedCategoriesForSeason([]);
      }
    },
    [clubId, supabase]
  );

  // Update assigned category when season changes
  useEffect(() => {
    if (formData.season_id) {
      fetchAssignedCategoriesForSeason(formData.season_id);
      // Clear selected category when season changes since available category will change
      setFormData((prev) => ({...prev, category_id: ''}));
    } else {
      setAssignedCategoriesForSeason([]);
    }
  }, [formData.season_id, clubId, fetchAssignedCategoriesForSeason]);

  const handleSubmit = async () => {
    try {
      await onAssignCategory(formData);
      // Reset form
      setFormData({
        category_id: '',
        season_id: formData.season_id, // Keep the selected season
        max_teams: 1,
      });
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in AssignCategoryModal:', error);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      category_id: '',
      season_id: formData.season_id, // Keep the selected season
      max_teams: 1,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader>Přiřadit klub ke kategorii</ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Sezóna"
                placeholder="Vyberte sezónu"
                selectedKeys={formData.season_id ? [formData.season_id] : []}
                onSelectionChange={(keys) => {
                  const seasonId = Array.from(keys)[0] as string;
                  setFormData((prev) => ({...prev, season_id: seasonId}));
                }}
                isRequired
              >
                {seasons.map((season: Season) => (
                  <SelectItem key={season.id} textValue={season.name}>
                    {season.name} {season.is_active ? '(Aktivní)' : ''}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Kategorie"
                placeholder="Vyberte kategorii"
                selectedKeys={formData.category_id ? [formData.category_id] : []}
                onSelectionChange={(keys) => {
                  const categoryId = Array.from(keys)[0] as string;
                  setFormData((prev) => ({...prev, category_id: categoryId}));
                }}
                isRequired
              >
                {(() => {
                  // Filter category based on the selected season
                  // Only show category that are NOT already assigned to this club in the selected season
                  const availableCategories = categories.filter((category) => {
                    // If no season is selected yet, show all category
                    if (!formData.season_id) {
                      return true;
                    }
                    // Check if this category is already assigned to this club in the selected season
                    return !assignedCategoriesForSeason.includes(category.id);
                  });

                  if (isEmpty(availableCategories)) {
                    return (
                      <SelectItem
                        key="no-categories"
                        textValue="Všechny kategorie jsou již přiřazeny pro tuto sezónu"
                      >
                        Všechny kategorie jsou již přiřazeny pro tuto sezónu
                      </SelectItem>
                    );
                  }
                  return availableCategories.map((category: Category) => (
                    <SelectItem key={category.id} textValue={category.name}>
                      {category.name}
                    </SelectItem>
                  ));
                })()}
              </Select>

              <Input
                label="Maximální počet týmů"
                type="number"
                min="1"
                max="10"
                value={formData.max_teams.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_teams: parseInt(e.target.value) || 1,
                  })
                }
                description="Kolik týmů (A, B, C, ...) má být vygenerováno pro tuto kategorii"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="flat"
            onPress={handleClose}
            aria-label="Zrušit přiřazení kategorie"
          >
            {loading ? 'Načítání...' : 'Zrušit'}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!formData.category_id || !formData.season_id || loading}
            aria-label="Přiřadit klub ke kategorii"
          >
            {loading ? 'Přiřazuji...' : 'Přiřadit'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
