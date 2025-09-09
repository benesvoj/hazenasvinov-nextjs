'use client';

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem, Image } from "@heroui/react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CategoryNew } from "@/types";
import { postStatuses } from "@/constants";
import { generateSlug } from "@/utils/slugGenerator";

interface User {
  id: string;
  email: string;
}

// TODO: remove any
interface AddPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any, imageFile: File | null) => Promise<void>;
  users: User[];
  categories: CategoryNew[];
  categoriesLoading: boolean;
}

export default function AddPostModal({
  isOpen,
  onClose,
  onSubmit,
  users,
  categories,
  categoriesLoading
}: AddPostModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    author_id: "",
    status: postStatuses.draft,
    image_url: "",
    category_id: "",
    created_at: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Generate slug from title using the utility function
  const generateSlugFromTitle = (title: string) => {
    return generateSlug(title);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-generate slug when title changes
    if (field === 'title') {
      setFormData(prev => ({ ...prev, slug: generateSlugFromTitle(value) }));
    }
  };


  // Handle image file selection
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      author_id: "default-user",
      status: postStatuses.draft,
      image_url: "",
      category_id: "",
      created_at: ""
    });
    setImageFile(null);
    setImagePreview("");
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle form submission
  const handleSubmit = async () => {
    await onSubmit(formData, imageFile);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Nový článek</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Název článku"
                placeholder="Zadejte název článku"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                isRequired
              />
              <Input
                label="Slug (URL)"
                placeholder="automaticky generováno"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                isRequired
              />
              <Select
                label="Autor"
                placeholder="Vyberte autora"
                selectedKeys={formData.author_id ? [formData.author_id] : []}
                onSelectionChange={(keys) => handleInputChange('author_id', Array.from(keys)[0] as string)}
                isRequired
              >
                {users.map((user) => (
                  <SelectItem key={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Stav"
                placeholder="Vyberte stav"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0] as string)}
                isRequired
              >
                {Object.values(postStatuses).map((status) => (
                  <SelectItem key={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                ))}
              </Select>
              
              <Input
                label="Datum vytvoření"
                type="datetime-local"
                value={formData.created_at}
                onChange={(e) => handleInputChange('created_at', e.target.value)}
                description="Nechte prázdné pro aktuální datum"
              />
              
              {/* Category Selection */}
              <Select
                label="Kategorie"
                placeholder="Vyberte kategorii"
                selectedKeys={formData.category_id ? [formData.category_id] : []}
                onSelectionChange={(keys) => handleInputChange('category_id', Array.from(keys)[0] as string)}
                isDisabled={categoriesLoading}
                isRequired
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-categories" isDisabled>
                    {categoriesLoading ? 'Načítání kategorií...' : 'Žádné kategorie'}
                  </SelectItem>
                )}
              </Select>
              

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obrázek článku
                </label>
                
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="object-cover"
                      />
                      <Button
                        onPress={handleRemoveImage}
                        className="absolute top-2 right-2"
                        title="Odstranit obrázek"
                        radius="full"
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        aria-label="Odstranit obrázek"
                        startContent={<XMarkIcon className="h-4 w-4" />}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Obrázek bude nahrán při uložení článku
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Nahrajte obrázek
                          </span>
                          <span className="text-gray-500"> nebo přetáhněte</span>
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF do 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obsah článku <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Zde napište obsah článku..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            Vytvořit článek
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}