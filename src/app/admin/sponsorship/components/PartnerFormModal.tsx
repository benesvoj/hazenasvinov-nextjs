'use client';

import {useEffect, useState} from 'react';

import {Button} from '@heroui/button';
import {Input, Textarea} from '@heroui/input';
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from '@heroui/modal';
import {Select, SelectItem} from '@heroui/select';

import {translations} from '@/lib/translations';

interface PartnerFormData {
  name: string;
  description: string;
  website_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  level: string;
  start_date: string;
  end_date: string; // Required for main partners, optional for others
  status: string;
}

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PartnerFormData) => Promise<void>;
  initialData?: Partial<PartnerFormData>;
  mode: 'add' | 'edit';
  partnerType: 'main' | 'business' | 'media';
}

export const PartnerFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  partnerType,
}: PartnerFormModalProps) => {
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    description: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    level: 'silver',
    start_date: new Date().toISOString().split('T')[0],
    end_date:
      partnerType === 'main'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({...prev, ...initialData}));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean up the data before sending - remove empty strings for optional fields
      const cleanData = {
        ...formData,
        website_url: formData.website_url || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        end_date:
          formData.end_date ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      await onSubmit(cleanData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
      // Always reset the form, regardless of success or failure
      setFormData({
        name: '',
        description: '',
        website_url: '',
        contact_email: '',
        contact_phone: '',
        level: 'silver',
        start_date: new Date().toISOString().split('T')[0],
        end_date:
          partnerType === 'main'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : '',
        status: 'active',
      });
    }
  };

  const getLevelOptions = () => {
    switch (partnerType) {
      case 'main':
        return [
          {value: 'platinum', label: translations.sponsorship.levels.platinum},
          {value: 'gold', label: translations.sponsorship.levels.gold},
        ];
      case 'business':
        return [
          {value: 'silver', label: translations.sponsorship.levels.silver},
          {value: 'bronze', label: translations.sponsorship.levels.bronze},
        ];
      case 'media':
        return [
          {value: 'local', label: 'Místní'},
          {value: 'regional', label: 'Regionální'},
          {value: 'national', label: 'Národní'},
        ];
      default:
        return [];
    }
  };

  const getTitle = () => {
    const action = mode === 'add' ? 'Přidat' : 'Upravit';
    const type =
      partnerType === 'main'
        ? 'hlavního partnera'
        : partnerType === 'business'
          ? 'obchodního partnera'
          : 'mediálního partnera';
    return `${action} ${type}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <h3 className="text-lg font-semibold">{getTitle()}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Název partnera"
                  placeholder="Zadejte název"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({...prev, name: e.target.value}))}
                  required
                />
                <Select
                  label="Úroveň"
                  placeholder="Vyberte úroveň"
                  selectedKeys={[formData.level]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({...prev, level: selected}));
                  }}
                  required
                >
                  {getLevelOptions().map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Popis"
                placeholder="Zadejte popis partnera"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Webové stránky"
                  placeholder="https://example.com"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData((prev) => ({...prev, website_url: e.target.value}))}
                  type="url"
                />
                <Input
                  label="Email"
                  placeholder="info@example.com"
                  value={formData.contact_email || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({...prev, contact_email: e.target.value}))
                  }
                  type="email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Telefon"
                  placeholder="+420 123 456 789"
                  value={formData.contact_phone || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({...prev, contact_phone: e.target.value}))
                  }
                />
                <Input
                  label="Datum začátku"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({...prev, start_date: e.target.value}))}
                  required
                />
              </div>

              {partnerType === 'main' && (
                <Input
                  label="Datum konce"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData((prev) => ({...prev, end_date: e.target.value}))}
                  required
                />
              )}

              <Select
                label="Status"
                placeholder="Vyberte status"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData((prev) => ({...prev, status: selected}));
                }}
                required
              >
                <SelectItem key="active">{translations.sponsorship.status.active}</SelectItem>
                <SelectItem key="inactive">{translations.sponsorship.status.inactive}</SelectItem>
                <SelectItem key="pending">{translations.sponsorship.status.pending}</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" variant="bordered" onPress={onClose}>
              {translations.sponsorship.button.cancel}
            </Button>
            <Button color="primary" type="submit" isLoading={loading}>
              {mode === 'add'
                ? translations.sponsorship.button.addPartner
                : translations.sponsorship.button.save}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
