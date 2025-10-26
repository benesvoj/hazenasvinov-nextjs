'use client';

import {useState, useEffect} from 'react';

import {Input, Select, SelectItem, Button, Textarea} from '@heroui/react';

import {CreatePlayerLoanData} from '@/types/entities/member/business/playerLoan';

import {useFetchClubs} from '@/hooks/entities/club/data/useFetchClubs';
import {usePlayerLoans} from '@/hooks/entities/player/usePlayerLoans';

import {UnifiedModal} from '@/components';

interface PlayerLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId?: string;
  onLoanCreated?: () => void;
}

export default function PlayerLoanModal({
  isOpen,
  onClose,
  playerId,
  onLoanCreated,
}: PlayerLoanModalProps) {
  const {data: clubs, loading: clubsLoading} = useFetchClubs();
  const {createLoan, loading: loanLoading, error: loanError} = usePlayerLoans();

  const [formData, setFormData] = useState<CreatePlayerLoanData>({
    player_id: playerId || '',
    to_club_id: '',
    loan_start_date: '',
    loan_end_date: '',
    loan_type: 'temporary',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && playerId) {
      setFormData({
        player_id: playerId,
        to_club_id: '',
        loan_start_date: '',
        loan_end_date: '',
        loan_type: 'temporary',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen, playerId]);

  const updateField = (field: keyof CreatePlayerLoanData, value: string) => {
    setFormData((prev) => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({...prev, [field]: ''}));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.player_id) {
      newErrors.player_id = 'Hráč je povinný';
    }
    if (!formData.to_club_id) {
      newErrors.to_club_id = 'Cílový klub je povinný';
    }
    if (!formData.loan_start_date) {
      newErrors.loan_start_date = 'Datum začátku je povinné';
    }
    if (!formData.loan_type) {
      newErrors.loan_type = 'Typ půjčky je povinný';
    }

    // Validate dates
    if (formData.loan_start_date && formData.loan_end_date) {
      const startDate = new Date(formData.loan_start_date);
      const endDate = new Date(formData.loan_end_date);
      if (endDate <= startDate) {
        newErrors.loan_end_date = 'Datum konce musí být po datu začátku';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createLoan(formData);
      if (result) {
        onLoanCreated?.();
        onClose();
      }
    } catch (error) {
      console.error('Error creating loan:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      player_id: playerId || '',
      to_club_id: '',
      loan_start_date: '',
      loan_end_date: '',
      loan_type: 'temporary',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Vytvořit půjčku hráče"
      size="md"
      isFooterWithActions
      isLoading={loanLoading}
      onPress={handleSubmit}
      isDisabled={
        !formData.player_id ||
        !formData.to_club_id ||
        !formData.loan_start_date ||
        !formData.loan_type
      }
    >
      <div className="space-y-6">
        {/* Target Club Selection */}
        <Select
          label="Cílový klub"
          placeholder="Vyberte klub"
          selectedKeys={formData.to_club_id ? [formData.to_club_id] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            updateField('to_club_id', selectedKey);
          }}
          isRequired
          errorMessage={errors.to_club_id}
          isInvalid={!!errors.to_club_id}
          isLoading={clubsLoading}
        >
          {clubs.map((club) => (
            <SelectItem key={club.id}>{club.name}</SelectItem>
          ))}
        </Select>

        {/* Loan Type */}
        <Select
          label="Typ půjčky"
          placeholder="Vyberte typ"
          selectedKeys={formData.loan_type ? [formData.loan_type] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            updateField('loan_type', selectedKey as 'temporary' | 'permanent' | 'youth');
          }}
          isRequired
          errorMessage={errors.loan_type}
          isInvalid={!!errors.loan_type}
        >
          <SelectItem key="temporary">Dočasná</SelectItem>
          <SelectItem key="permanent">Trvalá</SelectItem>
          <SelectItem key="youth">Mládežnická</SelectItem>
        </Select>

        {/* Start Date */}
        <Input
          type="date"
          label="Datum začátku"
          value={formData.loan_start_date}
          onValueChange={(value) => updateField('loan_start_date', value)}
          isRequired
          errorMessage={errors.loan_start_date}
          isInvalid={!!errors.loan_start_date}
        />

        {/* End Date */}
        <Input
          type="date"
          label="Datum konce"
          value={formData.loan_end_date}
          onValueChange={(value) => updateField('loan_end_date', value)}
          errorMessage={errors.loan_end_date}
          isInvalid={!!errors.loan_end_date}
        />

        {/* Notes */}
        <Textarea
          label="Poznámky"
          placeholder="Volitelné poznámky k půjčce..."
          value={formData.notes}
          onValueChange={(value) => updateField('notes', value)}
          minRows={2}
        />

        {/* Error Display */}
        {loanError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">Chyba při vytváření půjčky: {loanError}</div>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
}
