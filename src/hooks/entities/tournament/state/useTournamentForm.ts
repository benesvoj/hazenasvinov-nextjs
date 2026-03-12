'use client';

import {useState} from 'react';

import {createFormHook} from '@/hooks/factories';

import {translations} from '@/lib/translations';

import {ModalMode, TournamentStatuses} from '@/enums';
import {useTournaments} from '@/hooks';
import {Tournament, TournamentFormData} from '@/types';

const InitialState: TournamentFormData = {
  name: '',
  slug: '',
  category_id: '',
  season_id: '',
  start_date: '',
  end_date: null,
  venue: null,
  description: null,
  post_id: null,
  image_url: null,
  created_by: null,
  updated_by: null,
  status: TournamentStatuses.DRAFT,
};

export const useTournamentForm = () => {
  const form = createFormHook<Tournament, TournamentFormData>({
    initialFormData: InitialState,
    validationRules: [
      {field: 'name', message: translations.tournaments.validation.nameRequired},
      {field: 'category_id', message: translations.tournaments.validation.categoryRequired},
      {field: 'season_id', message: translations.tournaments.validation.seasonRequired},
      {field: 'start_date', message: translations.tournaments.validation.startDateRequired},
    ],
  })();

  const {updateTournament, createTournament} = useTournaments();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const valid = form.validateForm();

    if (!valid) return;

    setIsLoading(true);

    try {
      return form.modalMode === ModalMode.ADD
        ? await createTournament(form.formData)
        : await updateTournament(form.selectedItem!.id, {
            id: form.selectedItem!.id,
            ...form.formData,
          });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...form,
    isLoading,
    handleSubmit,
  };
};
