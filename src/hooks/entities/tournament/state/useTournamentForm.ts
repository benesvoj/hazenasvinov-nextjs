'use client';

import {useState} from 'react';

import {createFormHook} from '@/hooks/factories';

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
      {field: 'name', message: 'Name is required'},
      {field: 'category_id', message: 'Category is required'},
      {field: 'season_id', message: 'Season is required'},
      {field: 'start_date', message: 'Start date is required'},
      {field: 'end_date', message: 'End date is required'},
    ],
  })();

  const {updateTournament, createTournament} = useTournaments();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const valid = form.validateForm();

    if (!valid) return;

    setIsLoading(true);

    try {
      const tournamentData =
        form.modalMode === ModalMode.ADD
          ? await createTournament(form.formData)
          : await updateTournament(form.selectedItem!.id, {
              id: form.selectedItem!.id,
              ...form.formData,
            });
      return tournamentData;
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
