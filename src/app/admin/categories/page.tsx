'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  age_group?: string;
  gender?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const ageGroups = {
  adults: "Dospělí",
  juniors: "Junioři",
  youth: "Mládež",
  kids: "Děti"
};

const genders = {
  male: "Muži",
  female: "Ženy",
  mixed: "Smíšené"
};

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddCategoryOpen, onOpen: onAddCategoryOpen, onClose: onAddCategoryClose } = useDisclosure();
  const { isOpen: isEditCategoryOpen, onOpen: onEditCategoryOpen, onClose: onEditCategoryClose } = useDisclosure();
  const { isOpen: isDeleteCategoryOpen, onOpen: onDeleteCategoryOpen, onClose: onDeleteCategoryClose } = useDisclosure();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    age_group: '',
    gender: '',
    is_active: true,
    sort_order: 0
  });

  const supabase = createClient();

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Add new category
  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        });

      if (error) throw error;
      
      onAddCategoryClose();
      setFormData({
        code: '',
        name: '',
        description: '',
        age_group: '',
        gender: '',
        is_active: true,
        sort_order: 0
      });
      fetchCategories();
    } catch (error) {
      setError('Chyba při přidávání kategorie');
      console.error('Error adding category:', error);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onEditCategoryClose();
      setSelectedCategory(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        age_group: '',
        gender: '',
        is_active: true,
        sort_order: 0
      });
      fetchCategories();
    } catch (error) {
      setError('Chyba při aktualizaci kategorie');
      console.error('Error updating category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onDeleteCategoryClose();
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      setError('Chyba při mazání kategorie');
      console.error('Error deleting category:', error);
    }
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      age_group: category.age_group || '',
      gender: category.gender || '',
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    onEditCategoryOpen();
  };

  // Open delete modal
  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    onDeleteCategoryOpen();
  };

  // Get age group badge color
  const getAgeGroupBadgeColor = (ageGroup: string) => {
    switch (ageGroup) {
      case 'adults': return 'primary';
      case 'juniors': return 'secondary';
      case 'youth': return 'success';
      case 'kids': return 'warning';
      default: return 'default';
    }
  };

  // Get gender badge color
  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'primary';
      case 'female': return 'secondary';
      case 'mixed': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Seznam kategorií</h2>
          </div>
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onAddCategoryOpen}
          >
            Přidat kategorii
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Kód</th>
                    <th className="text-left py-3 px-4">Název</th>
                    <th className="text-left py-3 px-4">Popis</th>
                    <th className="text-left py-3 px-4">Věková skupina</th>
                    <th className="text-left py-3 px-4">Pohlaví</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Pořadí</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-mono text-sm">{category.code}</td>
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {category.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {category.age_group ? (
                          <Badge color={getAgeGroupBadgeColor(category.age_group)} variant="flat" size="sm">
                            {ageGroups[category.age_group as keyof typeof ageGroups]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {category.gender ? (
                          <Badge color={getGenderBadgeColor(category.gender)} variant="flat" size="sm">
                            {genders[category.gender as keyof typeof genders]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={category.is_active ? 'success' : 'default'} variant="flat" size="sm">
                          {category.is_active ? 'Aktivní' : 'Neaktivní'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{category.sort_order}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => openEditModal(category)}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => openDeleteModal(category)}
                          >
                            Smazat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádné kategorie nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Category Modal */}
      <Modal isOpen={isAddCategoryOpen} onClose={onAddCategoryClose}>
        <ModalContent>
          <ModalHeader>Přidat kategorii</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Kód"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                isRequired
                placeholder="např. men, women, juniorBoys"
              />
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                placeholder="např. Muži, Ženy, Dorostenci"
              />
              <Input
                label="Popis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis kategorie"
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              >
                <option value="">Vyberte věkovou skupinu</option>
                {Object.entries(ageGroups).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Vyberte pohlaví</option>
                {Object.entries(genders).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddCategoryClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddCategory}>
              Přidat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={isEditCategoryOpen} onClose={onEditCategoryClose}>
        <ModalContent>
          <ModalHeader>Upravit kategorii</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Kód"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                isRequired
                placeholder="např. men, women, juniorBoys"
              />
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                placeholder="např. Muži, Ženy, Dorostenci"
              />
              <Input
                label="Popis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis kategorie"
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              >
                <option value="">Vyberte věkovou skupinu</option>
                {Object.entries(ageGroups).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Vyberte pohlaví</option>
                {Object.entries(genders).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditCategoryClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateCategory}>
              Uložit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Category Modal */}
      <Modal isOpen={isDeleteCategoryOpen} onClose={onDeleteCategoryClose}>
        <ModalContent>
          <ModalHeader>Smazat kategorii</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat kategorii <strong>{selectedCategory?.name}</strong>?
              Tato akce je nevratná a může ovlivnit data v celém systému.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteCategoryClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteCategory}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
