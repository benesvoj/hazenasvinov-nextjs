'use client';

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { TrashIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { translations } from "@/lib/translations";

interface CategoriesTabProps {
  clubCategories: any[];
  categories: any[];
  onAssignCategory: () => void;
  onGenerateTeams: (clubCategoryId: string) => void;
  onDeleteClubCategory: (clubCategoryId: string) => void;
}

export default function CategoriesTab({ 
  clubCategories, 
  categories, 
  onAssignCategory, 
  onGenerateTeams, 
  onDeleteClubCategory 
}: CategoriesTabProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h3 className="text-lg font-semibold">Přiřazené kategorie</h3>
        <Button 
          color="primary" 
          onPress={onAssignCategory}
          size="sm"
          isDisabled={categories.filter(cat => !clubCategories.some(cc => cc.category_id === cat.id)).length === 0}
          startContent={<PlusCircleIcon className="w-4 h-4" />}
        >
          {translations.button.assign}
        </Button>
      </CardHeader>
      <CardBody>
        {clubCategories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <TrophyIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">Žádné kategorie</h4>
            <p className="text-gray-500">Začněte přiřazením klubu ke kategorii</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clubCategories.map((clubCategory: any) => (
              <div key={clubCategory.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {clubCategory.category?.name || 'Neznámá kategorie'}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Sezóna: {clubCategory.season?.name || 'Neznámá'}</p>
                      <p>Maximální počet týmů: {clubCategory.max_teams}</p>
                      <p>Aktuální týmy: {clubCategory.team_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {clubCategory.team_count < clubCategory.max_teams && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="light"
                        onPress={() => onGenerateTeams(clubCategory.id)}
                      >
                        {translations.button.generate}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      startContent={<TrashIcon className="w-4 h-4" />}
                      onPress={() => onDeleteClubCategory(clubCategory.id)}
                    >
                      {translations.button.delete}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
