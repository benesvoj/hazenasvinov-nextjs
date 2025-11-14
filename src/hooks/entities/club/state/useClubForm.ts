'use client';
import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {Club, ClubFormData} from '@/types';
import {createFormHook} from "@/hooks";
import {translations} from "@/lib";

const t = translations.admin.clubs.responseMessages;
const initialFormData: ClubFormData = {
  name: '',
  short_name: '',
  city: '',
  founded_year: null,
  logo_url: '',
  venue: '',
  web: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  contact_person: '',
  is_own_club: false,
  is_active: true,
};

export const useClubForm = createFormHook<Club, ClubFormData>({
    initialFormData,
    validationRules: [
        {field: 'name', message: t.mandatoryName},
        ],
});
//
// export function useClubForm() {
//   const [formData, setFormData] = useState<ClubFormData>(initialFormData);
//   const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
//   const [selectedClub, setSelectedClub] = useState<Club | null>(null);
//
//   const openAddMode = useCallback(() => {
//     setModalMode(ModalMode.ADD);
//     setSelectedClub(null);
//     setFormData(initialFormData);
//   }, []);
//
//   const openEditMode = useCallback((club: Club) => {
//     setModalMode(ModalMode.EDIT);
//     setSelectedClub(club);
//     const {id, created_at, updated_at, ...editableFields} = club;
//     setFormData(editableFields);
//   }, []);
//
//   const resetForm = useCallback(() => {
//     setFormData(initialFormData);
//     setSelectedClub(null);
//     setModalMode(ModalMode.ADD);
//   }, []);
//
//   const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
//     const errors: string[] = [];
//
//     if (!formData.name?.trim()) {
//       errors.push('name is required');
//     }
//
//     return {
//       valid: errors.length === 0,
//       errors,
//     };
//   }, [formData]);
//
//   return {
//     // State
//     formData,
//     selectedClub,
//     modalMode,
//
//     // Actions
//     openAddMode,
//     openEditMode,
//     resetForm,
//     validateForm,
//
//     // Setters
//     setFormData,
//   };
// }
