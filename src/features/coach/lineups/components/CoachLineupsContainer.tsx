'use client';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, DeleteDialog, Grid, GridItem, Show} from '@/components';
import {AppPageLayout} from '@/shared/components';
import {hasMoreThanOne} from '@/utils';

import {useCoachLineupsPageLogic} from '../hooks/useCoachLineupsPageLogic';

import {LineupMembers, LineupModal, LineupsList} from '.';

const t = translations.lineups;

export default function CoachLineupsContainer() {
  const state = useCoachLineupsPageLogic();

  return (
    <>
      <AppPageLayout
        header={
          <Show when={hasMoreThanOne(state.availableCategories)}>
            <ContentCard padding="none">
              <Choice
                value={state.selectedCategory}
                onChange={(id) => state.setSelectedCategory(id)}
                items={state.availableCategories.map((c) => ({key: c.id, label: c.name}))}
                label={translations.members.table.columns.category}
                size="sm"
                className="md:w-1/4"
                disallowEmptySelection={true}
              />
            </ContentCard>
          </Show>
        }
      >
        <Grid columns={3}>
          <GridItem span={1}>
            <LineupsList
              selectedCategory={state.selectedCategory}
              selectedSeason={state.selectedSeason}
              selectedLineupId={state.selectedLineup?.id ?? ''}
              setSelectedLineup={state.setSelectedLineup}
              loading={state.loadingLineups}
              lineupsList={state.lineups}
              onAddLineup={state.handleAddLineup}
              onEditLineup={state.handleEditLineup}
              onDeleteLineup={state.handleDeleteLineup}
            />
          </GridItem>
          <GridItem span={2}>
            <LineupMembers
              lineupId={state.selectedLineup?.id ?? ''}
              categoryId={state.selectedCategory}
            />
          </GridItem>
        </Grid>
      </AppPageLayout>

      <LineupModal
        isOpen={state.lineupModal.isOpen}
        onClose={state.lineupModal.closeAndClear}
        formData={state.formData}
        setFormData={state.setFormData}
        onSubmit={state.handleSubmitLineup}
        mode={state.modalMode}
        isLoading={state.crudLoading}
      />

      <DeleteDialog
        isOpen={state.deleteModal.isOpen}
        onClose={state.deleteModal.closeAndClear}
        onSubmit={state.handleConfirmDelete}
        title={t.titles.delete}
        message={t.deleteLineupMessage}
        isLoading={state.crudLoading}
      />
    </>
  );
}
