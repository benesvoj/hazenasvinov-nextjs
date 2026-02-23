import {useEffect, useRef, useState} from 'react';

import {Button, Input, Textarea} from '@heroui/react';

import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

import Logo from '@/components/ui/layout/Logo';

import {translations} from '@/lib/translations/index';

import {deleteClubAsset, uploadClubAsset} from '@/utils/supabase/storage';

import {Heading, showToast, UnifiedCard} from '@/components';
import {ACTION_TYPE_LABELS, ActionTypes} from '@/enums';
import {useClubConfig, useFetchClubConfig} from '@/hooks';

const INITIAL_STATE = {
  club_name: '',
  club_logo_path: '',
  club_logo_url: '',
  hero_image_path: '',
  hero_image_url: '',
  hero_title: '',
  hero_subtitle: '',
  hero_button_text: '',
  hero_button_link: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  website_url: '',
  founded_year: 1920,
  description: '',
  bank_number: '',
  bank_name: '',
  identity_number: '',
};

export default function ClubConfigCard() {
  const {data: clubConfig, loading} = useFetchClubConfig();
  const {updateClubConfig, loading: updateLoading} = useClubConfig();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when clubConfig is loaded
  useEffect(() => {
    if (clubConfig) {
      setFormData({
        club_name: clubConfig.club_name || '',
        club_logo_path: clubConfig.club_logo_path || '',
        club_logo_url: clubConfig.club_logo_url || '',
        hero_image_path: clubConfig.hero_image_path || '',
        hero_image_url: clubConfig.hero_image_url || '',
        hero_title: clubConfig.hero_title || '',
        hero_subtitle: clubConfig.hero_subtitle || '',
        hero_button_text: clubConfig.hero_button_text || '',
        hero_button_link: clubConfig.hero_button_link || '',
        contact_email: clubConfig.contact_email || '',
        contact_phone: clubConfig.contact_phone || '',
        address: clubConfig.address || '',
        facebook_url: clubConfig.facebook_url || '',
        instagram_url: clubConfig.instagram_url || '',
        website_url: clubConfig.website_url || '',
        founded_year: clubConfig.founded_year || 1920,
        description: clubConfig.description || '',
        bank_name: clubConfig.bank_name || '',
        bank_number: clubConfig.bank_number || '',
        identity_number: clubConfig.identity_number || '',
      });
    }
  }, [clubConfig]);

  const handleSubmitChanges = async (id: string) => {
    try {
      await updateClubConfig(id, formData);
    } catch (error) {
      console.error('Error saving club config:', error);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const path = `club-assets/logo-${timestamp}.${extension}`;

      const result = await uploadClubAsset(file, path);

      if (result.error) {
        showToast.danger(`Chyba při nahrávání loga: ${result.error}`);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        club_logo_path: result.path,
        club_logo_url: result.url,
      }));

      if (formData.club_logo_path && formData.club_logo_path !== result.path) {
        await deleteClubAsset(formData.club_logo_path);
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
      alert('Chyba při nahrávání loga');
    } finally {
      setUploadingLogo(false);
    }
  };

  const footer = (
    <div className={'w-full flex justify-end'}>
      <Button
        color={'primary'}
        aria-label={ACTION_TYPE_LABELS[ActionTypes.SAVE]}
        type={'submit'}
        onPress={() => handleSubmitChanges(clubConfig!.id)}
        isLoading={updateLoading}
      >
        {ACTION_TYPE_LABELS[ActionTypes.SAVE]}
      </Button>
    </div>
  );

  return (
    <UnifiedCard isLoading={loading} footer={footer}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Heading size={3}>
            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
            {translations.clubConfig.editor.sections.basic}
          </Heading>

          <Input
            label={translations.clubConfig.editor.fields.name}
            value={formData.club_name}
            onChange={(e) => setFormData((prev) => ({...prev, club_name: e.target.value}))}
            placeholder={translations.clubConfig.editor.fields.name}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations.clubConfig.editor.fields.logo}
            </label>
            <div className="flex items-center gap-3">
              {formData.club_logo_url ? (
                <Logo size="md" className="rounded-lg" fallbackSrc={formData.club_logo_url} />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <Button
                size="sm"
                variant="bordered"
                onPress={() => logoInputRef.current?.click()}
                isDisabled={uploadingLogo}
                isLoading={uploadingLogo}
              >
                {translations.clubConfig.editor.upload.logo}
              </Button>
              <Input
                ref={logoInputRef}
                type={'file'}
                accept={'image/*'}
                className={'hidden'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
            </div>
          </div>

          <Input
            label={translations.clubConfig.editor.fields.foundedYear}
            type="number"
            value={formData.founded_year.toString()}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                founded_year: parseInt(e.target.value) || 1920,
              }))
            }
            placeholder={translations.clubConfig.editor.placeholders.foundedYear}
          />

          <Textarea
            label={translations.clubConfig.editor.fields.description}
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.description}
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <Heading size={3}>
            <EnvelopeIcon className="w-5 h-5 text-blue-600" />
            {translations.clubConfig.editor.sections.contact}
          </Heading>

          <Input
            label={translations.clubConfig.editor.fields.contactEmail}
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData((prev) => ({...prev, contact_email: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.contactEmail}
            startContent={<EnvelopeIcon className="w-4 h-4 text-gray-400" />}
          />

          <Input
            label={translations.clubConfig.editor.fields.contactPhone}
            value={formData.contact_phone}
            onChange={(e) => setFormData((prev) => ({...prev, contact_phone: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.contactPhone}
            startContent={<PhoneIcon className="w-4 h-4 text-gray-400" />}
          />

          <Textarea
            label={translations.clubConfig.editor.fields.address}
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({...prev, address: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.address}
            rows={2}
            startContent={<MapPinIcon className="w-4 h-4 text-gray-400" />}
          />

          <Input
            type="text"
            label={translations.clubConfig.editor.fields.identityNumber}
            placeholder={translations.clubConfig.editor.placeholders.identityNumber}
            value={formData.identity_number}
            onChange={(e) => setFormData((prev) => ({...prev, identity_number: e.target.value}))}
          />

          <Input
            type="text"
            label={translations.clubConfig.editor.fields.bankName}
            placeholder={translations.clubConfig.editor.placeholders.bankName}
            value={formData.bank_name}
            onChange={(e) => setFormData((prev) => ({...prev, bank_name: e.target.value}))}
          />

          <Input
            type="text"
            label={translations.clubConfig.editor.fields.bankNumber}
            placeholder={translations.clubConfig.editor.placeholders.bankNumber}
            value={formData.bank_number}
            onChange={(e) => setFormData((prev) => ({...prev, bank_number: e.target.value}))}
          />
        </div>

        <div className="space-y-4">
          <Heading size={3}>
            <GlobeAltIcon className="w-5 h-5 text-blue-600" />
            {translations.clubConfig.editor.sections.social}
          </Heading>

          <Input
            type="url"
            label={translations.clubConfig.editor.fields.website}
            value={formData.website_url}
            onChange={(e) => setFormData((prev) => ({...prev, website_url: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.website}
            startContent={<GlobeAltIcon className="w-4 h-4 text-gray-400" />}
          />

          <Input
            type="url"
            label={translations.clubConfig.editor.fields.facebook}
            value={formData.facebook_url}
            onChange={(e) => setFormData((prev) => ({...prev, facebook_url: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.facebook}
          />

          <Input
            type="url"
            label={translations.clubConfig.editor.fields.instagram}
            value={formData.instagram_url}
            onChange={(e) => setFormData((prev) => ({...prev, instagram_url: e.target.value}))}
            placeholder={translations.clubConfig.editor.placeholders.instagram}
          />
        </div>
      </div>
    </UnifiedCard>
  );
}
