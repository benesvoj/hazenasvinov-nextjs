'use client';

import {useEffect} from 'react';

import {Button} from '@heroui/button';
import {Input, Textarea} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, Grid, GridItem, HStack} from '@/components';
import {getTournamentStatusOptions, TournamentStatuses} from '@/enums';
import {useFetchCategories, useFetchSeasons, useTournamentForm, useTournaments} from '@/hooks';
import {Tournament} from '@/types';

interface MetadataTabProps {
  tournamentId: string;
  tournament: Tournament;
  loading: boolean;
  refetch: () => void;
}

export const MetadataTab = ({tournamentId, tournament, loading, refetch}: MetadataTabProps) => {
  const {data: categories} = useFetchCategories();
  const {data: seasons} = useFetchSeasons();
  const {updateTournament} = useTournaments();
  const {formData, setFormData, updateFormData, validateForm} = useTournamentForm();

  useEffect(() => {
    setFormData({
      name: tournament?.name || '',
      slug: tournament?.slug || '',
      description: tournament?.description || '',
      category_id: tournament?.category_id || '',
      season_id: tournament?.season_id || '',
      start_date: tournament?.start_date || '',
      end_date: tournament?.end_date || null,
      venue: tournament?.venue || null,
      status: tournament?.status || TournamentStatuses.DRAFT,
      image_url: tournament?.image_url || '',
      created_by: null,
      updated_by: null,
      post_id: null,
    });
  }, [tournament]);

  const categoriesOptions =
    categories?.map((category) => ({
      key: category.id,
      label: category.name,
    })) || [];
  const seasonsOptions =
    seasons?.map((season) => ({
      key: season.id,
      label: season.name,
    })) || [];
  const statusOptions = getTournamentStatusOptions().map((status) => ({
    key: status.value,
    label: status.label,
  }));

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormData({[field]: value} as Partial<typeof formData>);
  };

  const handleNameChange = (value: string) => {
    updateFormData({
      name: value,
      slug: generateSlug(value),
    });
  };

  const handleSave = async () => {
    const valid = validateForm();
    if (!valid) return;

    await updateTournament(tournamentId, {id: tournamentId, ...formData});

    refetch();
  };

  const footer = (
    <HStack justify={'end'} className={'w-full'}>
      <Button color={'primary'} onPress={handleSave}>
        {translations.common.actions.save}
      </Button>
    </HStack>
  );

  return (
    <ContentCard footer={footer} isLoading={!tournament || !categories.length || !seasons.length}>
      <Grid columns={2} gap={'md'}>
        <Input
          label={translations.tournaments.labels.name}
          placeholder={translations.tournaments.placeholders.name}
          value={formData.name}
          onValueChange={handleNameChange}
          size={'sm'}
        />
        <Input
          label={translations.tournaments.labels.slug}
          description={translations.tournaments.placeholders.slug}
          value={formData.slug}
          onValueChange={(value) => handleInputChange('slug', value)}
          size={'sm'}
        />
        <GridItem span={2}>
          <Textarea
            label={translations.tournaments.labels.description}
            placeholder={translations.tournaments.placeholders.description}
            rows={4}
            value={formData.description || ''}
            onValueChange={(value) => handleInputChange('description', value)}
            size={'sm'}
          />
        </GridItem>
        <Choice
          label={translations.tournaments.labels.category}
          placeholder={translations.tournaments.placeholders.category}
          items={categoriesOptions}
          value={formData.category_id || null}
          onChange={(value) => handleInputChange('category_id', value || '')}
        />
        <Choice
          label={translations.tournaments.labels.season}
          placeholder={translations.tournaments.placeholders.season}
          items={seasonsOptions}
          value={formData.season_id || null}
          onChange={(value) => handleInputChange('season_id', value || '')}
        />
        <Input
          type={'date'}
          label={translations.tournaments.labels.startDate}
          value={formData.start_date}
          onValueChange={(value) => handleInputChange('start_date', value)}
          size={'sm'}
        />
        <Input
          type={'date'}
          label={translations.tournaments.labels.endDate}
          value={formData.end_date || undefined}
          onValueChange={(value) => handleInputChange('end_date', value)}
          size={'sm'}
        />
        <Input
          label={translations.tournaments.labels.venue}
          placeholder={translations.tournaments.placeholders.venue}
          value={formData.venue || ''}
          onValueChange={(value) => handleInputChange('venue', value)}
          size={'sm'}
        />
        <Choice
          label={translations.tournaments.labels.status}
          items={statusOptions}
          value={formData.status || TournamentStatuses.DRAFT}
          onChange={(value) => handleInputChange('status', value || TournamentStatuses.DRAFT)}
        />
        <div>image placeholder</div>
      </Grid>
    </ContentCard>
  );
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
