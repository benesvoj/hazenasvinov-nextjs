"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { Category } from "@/types/types";
import { Season } from "@/types";

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
}

export default function AssignCategoryModal({
  isOpen,
  onClose,
  onAssignCategory,
  clubId,
  assignedCategoryIds,
}: AssignCategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    season_id: "",
    max_teams: 1,
  });

  const supabase = createClient();

  // Fetch categories and seasons
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndSeasons();
    }
  }, [isOpen]);

  const fetchCategoriesAndSeasons = async () => {
    try {
      setLoading(true);

      const [categoriesResult, seasonsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("seasons")
          .select("*")
          .order("name", { ascending: false }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (seasonsResult.error) throw seasonsResult.error;

      setCategories(categoriesResult.data || []);
      setSeasons(seasonsResult.data || []);

      // Auto-select active season
      const activeSeason = seasonsResult.data?.find(
        (season: any) => season.is_active
      );
      if (activeSeason) {
        setFormData((prev) => ({
          ...prev,
          season_id: activeSeason.id,
        }));
      }
    } catch (error) {
      console.error("Error fetching categories and seasons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await onAssignCategory(formData);
      // Reset form
      setFormData({
        category_id: "",
        season_id: formData.season_id, // Keep the selected season
        max_teams: 1,
      });
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error in AssignCategoryModal:", error);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      category_id: "",
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Načítání...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: select component doesn't show label of the selected season */}
              <Select
                label="Sezóna"
                placeholder="Vyberte sezónu"
                defaultSelectedKeys={
                  formData.season_id ? [formData.season_id] : []
                }
                onSelectionChange={(keys) => {
                  const seasonId = Array.from(keys)[0] as string;
                  setFormData((prev) => ({ ...prev, season_id: seasonId }));
                }}
                isRequired
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>
                    {season.name} {season.is_active ? "(Aktivní)" : ""}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Kategorie"
                placeholder="Vyberte kategorii"
                value={formData.category_id}
                onSelectionChange={(keys) => {
                  const categoryId = Array.from(keys)[0] as string;
                  setFormData((prev) => ({ ...prev, category_id: categoryId }));
                }}
                isRequired
              >
                {(() => {
                  const availableCategories = categories.filter(category => !assignedCategoryIds.includes(category.id));
                  if (availableCategories.length === 0) {
                    return (
                      <SelectItem key="no-categories" isDisabled>
                        Všechny kategorie jsou již přiřazeny
                      </SelectItem>
                    );
                  }
                  return availableCategories.map((category) => (
                    <SelectItem key={category.id}>{category.name}</SelectItem>
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
          <Button color="danger" variant="flat" onPress={handleClose} aria-label="Zrušit přiřazení kategorie">
            {loading ? "Načítání..." : "Zrušit"}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!formData.category_id || !formData.season_id || loading}
            aria-label="Přiřadit klub ke kategorii"
          >
            {loading ? "Přiřazuji..." : "Přiřadit"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
