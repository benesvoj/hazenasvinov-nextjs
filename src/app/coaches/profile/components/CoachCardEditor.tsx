'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Chip,
  Input,
  Skeleton,
  Textarea,
} from '@heroui/react';

import {CameraIcon, GlobeAltIcon, TrashIcon, UserCircleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {useUser} from '@/contexts/UserContext';

import {LoadingSpinner, showToast} from '@/components';
import {useCoachCard, useCoachCardPhoto, useFetchCategories, useFetchCoachCard} from '@/hooks';
import {Category, CoachCardFormData} from '@/types';

interface CoachCardEditorProps {
  onSaveSuccess?: () => void;
}

const INITIAL_FORM_DATA: CoachCardFormData = {
  name: '',
  surname: '',
  email: '',
  phone: '',
  note: '',
  published_categories: [], // Empty array = not published anywhere
};

export default function CoachCardEditor({onSaveSuccess}: CoachCardEditorProps) {
  const {user, userProfile} = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing card using factory-based hook
  const {data: existingCard, loading: fetchLoading, refetch} = useFetchCoachCard();

  // Fetch all categories to display names (user's assigned categories come from profile)
  const {data: allCategories, loading: categoriesLoading} = useFetchCategories();

  // CRUD operations using factory-based hook
  const {loading: mutationLoading, createCoachCard, updateCoachCard} = useCoachCard();

  // Photo operations (separate hook for storage)
  const {loading: photoLoading, uploadPhoto, deletePhoto} = useCoachCardPhoto();

  const [formData, setFormData] = useState<CoachCardFormData>(INITIAL_FORM_DATA);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get the categories the coach is assigned to (can publish to these)
  const assignedCategoryIds = useMemo(() => {
    return userProfile?.assigned_categories ?? [];
  }, [userProfile]);

  // Map assigned category IDs to full category objects for display
  const assignedCategories = useMemo(() => {
    if (!allCategories || assignedCategoryIds.length === 0) return [];
    return allCategories.filter((cat: Category) => assignedCategoryIds.includes(cat.id));
  }, [allCategories, assignedCategoryIds]);

  // Populate form when existing card is loaded
  useEffect(() => {
    if (existingCard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: existingCard.name,
        surname: existingCard.surname,
        email: existingCard.email ?? '',
        phone: existingCard.phone ?? '',
        note: existingCard.note ?? '',
        published_categories: existingCard.published_categories ?? [],
      });
      setPhotoUrl(existingCard.photo_url);
      setPhotoPath(existingCard.photo_path);
    }
  }, [existingCard]);

  const handleInputChange = (field: keyof CoachCardFormData, value: string | boolean) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showToast.warning(translations.coachCards.validation.invalidImageType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showToast.warning(translations.coachCards.validation.imageTooLarge);
      return;
    }

    setIsUploading(true);

    // Delete old photo if exists
    if (photoPath) {
      await deletePhoto(photoPath);
    }

    const result = await uploadPhoto(file, user.id);
    if (result) {
      setPhotoUrl(result.url);
      setPhotoPath(result.path);
    }

    setIsUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (!photoPath) return;

    const success = await deletePhoto(photoPath);
    if (success) {
      setPhotoUrl(null);
      setPhotoPath(null);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validation
    if (!formData.name.trim() || !formData.surname.trim()) {
      showToast.warning(translations.coachCards.validation.nameRequired);
      return;
    }

    const cardData = {
      ...formData,
      photo_url: photoUrl,
      photo_path: photoPath,
    };

    let success: boolean;

    if (existingCard) {
      const result = await updateCoachCard(existingCard.id, cardData);
      success = result !== null;
    } else {
      const result = await createCoachCard({
        user_id: user.id,
        ...cardData,
      });
      success = result !== null;
    }

    if (success) {
      await refetch();
      onSaveSuccess?.();
    }
  };

  /**
   * Handle toggling category visibility for the coach card.
   * Updates the published_categories array when checkboxes change.
   */
  const handleCategorySelectionChange = (selectedCategories: string[]) => {
    // Ensure only valid assigned categories are included
    const validCategories = selectedCategories.filter((catId) =>
      assignedCategoryIds.includes(catId)
    );
    setFormData((prev) => ({...prev, published_categories: validCategories}));
  };

  /**
   * Quick action to publish to all assigned categories
   */
  const handlePublishToAll = () => {
    setFormData((prev) => ({...prev, published_categories: [...assignedCategoryIds]}));
  };

  /**
   * Quick action to unpublish from all categories (make private)
   */
  const handleUnpublishAll = () => {
    setFormData((prev) => ({...prev, published_categories: []}));
  };

  // Computed: is the card currently visible anywhere?
  const isPublishedAnywhere = formData.published_categories.length > 0;

  if (fetchLoading) {
    return (
      <Card>
        <CardBody>
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  const loading = mutationLoading || photoLoading || isUploading;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-6 h-6" />
          <h3 className="text-xl font-semibold">{translations.coachCards.editor.title}</h3>
        </div>
        {/* Show publish status indicator */}
        <Chip
          color={isPublishedAnywhere ? 'success' : 'default'}
          variant="flat"
          startContent={<GlobeAltIcon className="w-4 h-4" />}
        >
          {isPublishedAnywhere
            ? translations.coachCards.editor.publishedStatus.replace(
                '{count}',
                String(formData.published_categories.length)
              )
            : translations.coachCards.editor.privateStatus}
        </Chip>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar
                src={photoUrl ?? undefined}
                name={`${formData.name} ${formData.surname}`}
                size="lg"
                className="w-24 h-24"
                isBordered
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="bordered"
                startContent={<CameraIcon className="w-4 h-4" />}
                onPress={() => fileInputRef.current?.click()}
                isDisabled={loading}
              >
                {translations.coachCards.editor.uploadPhoto}
              </Button>
              {photoUrl && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={handleRemovePhoto}
                  isDisabled={loading}
                >
                  {translations.coachCards.editor.removePhoto}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={translations.coachCards.fields.name}
              placeholder={translations.coachCards.placeholders.name}
              value={formData.name}
              onValueChange={(value) => handleInputChange('name', value)}
              isRequired
              isDisabled={loading}
            />
            <Input
              label={translations.coachCards.fields.surname}
              placeholder={translations.coachCards.placeholders.surname}
              value={formData.surname}
              onValueChange={(value) => handleInputChange('surname', value)}
              isRequired
              isDisabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={translations.coachCards.fields.email}
              placeholder={translations.coachCards.placeholders.email}
              type="email"
              value={formData.email}
              onValueChange={(value) => handleInputChange('email', value)}
              isDisabled={loading}
            />
            <Input
              label={translations.coachCards.fields.phone}
              placeholder={translations.coachCards.placeholders.phone}
              type="tel"
              value={formData.phone}
              onValueChange={(value) => handleInputChange('phone', value)}
              isDisabled={loading}
            />
          </div>

          <Textarea
            label={translations.coachCards.fields.note}
            placeholder={translations.coachCards.placeholders.note}
            value={formData.note}
            onValueChange={(value) => handleInputChange('note', value)}
            minRows={3}
            maxRows={6}
            isDisabled={loading}
          />

          {/* Category Visibility Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5" />
                {translations.coachCards.editor.categoryVisibilityTitle}
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="success"
                  onPress={handlePublishToAll}
                  isDisabled={loading || assignedCategories.length === 0}
                >
                  {translations.coachCards.editor.publishToAll}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={handleUnpublishAll}
                  isDisabled={loading || formData.published_categories.length === 0}
                >
                  {translations.coachCards.editor.unpublishAll}
                </Button>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ) : assignedCategories.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  {translations.coachCards.editor.noAssignedCategories}
                </p>
              </div>
            ) : (
              <CheckboxGroup
                label={translations.coachCards.editor.selectCategoriesLabel}
                value={formData.published_categories}
                onValueChange={handleCategorySelectionChange}
                orientation="horizontal"
                isDisabled={loading}
              >
                {assignedCategories.map((category: Category) => (
                  <Checkbox
                    key={category.id}
                    value={category.id}
                    classNames={{
                      base: 'border rounded-lg px-3 py-2 hover:bg-gray-50 data-[selected=true]:bg-success-50 data-[selected=true]:border-success',
                      label: 'text-sm',
                    }}
                  >
                    {category.name}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            )}

            {/* Privacy Notice */}
            <div
              className={`border rounded-lg p-4 ${
                isPublishedAnywhere ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <p className={`text-sm ${isPublishedAnywhere ? 'text-green-800' : 'text-gray-600'}`}>
                {isPublishedAnywhere
                  ? translations.coachCards.editor.publishedNotice.replace(
                      '{categories}',
                      assignedCategories
                        .filter((cat: Category) => formData.published_categories.includes(cat.id))
                        .map((cat: Category) => cat.name)
                        .join(', ')
                    )
                  : translations.coachCards.editor.unpublishedNotice}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button color="primary" onPress={handleSubmit} isLoading={loading}>
              {existingCard ? translations.common.actions.save : translations.common.actions.create}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
