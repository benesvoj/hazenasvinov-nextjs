'use client';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {useAppData} from '@/contexts';
import {PlusIcon} from '@/lib';
import {AppPageLayout, FloatingActions} from '@/shared/components';
import {commonCopy} from '@/shared/copy';

import {RecordingFilters, RecordingFormModal, RecordingsView} from '../components';
import {useAdminRecordingsPageLogic} from '../hooks';

export function AdminRecordingsContainer() {
  const state = useAdminRecordingsPageLogic();

  const {
    categories: {data: categories},
    clubs: {data: clubs},
    seasons: {data: seasons},
  } = useAppData();

  return (
    <>
      <AppPageLayout
        isLoading={state.loading}
        filters={
          <RecordingFilters
            filters={state.filters.filters}
            categories={categories}
            clubs={clubs}
            seasons={seasons}
            onFiltersChange={state.handleFiltersChange}
          />
        }
        floatingActions={
          <FloatingActions
            actions={[
              {
                label: commonCopy.actions.add,
                icon: <PlusIcon className="w-4 h-4" />,
                onClick: state.handleAdd,
              },
            ]}
          />
        }
      >
        <RecordingsView
          recordings={state.filters.paginatedRecordings}
          loading={state.loading}
          categories={categories}
          clubs={clubs}
          seasons={seasons}
          currentPage={state.currentPage}
          totalPages={state.filters.totalPages}
          totalCount={state.filters.totalCount}
          itemsPerPage={20}
          onEdit={state.handleEdit}
          onDelete={state.handleDeleteClick}
          onPageChange={state.setCurrentPage}
        />
      </AppPageLayout>

      <RecordingFormModal
        isOpen={state.formModal.isOpen}
        onClose={state.formModal.closeAndClear}
        onSubmit={state.handleFormSubmit}
        formData={state.form.formData}
        setFormData={state.form.setFormData}
        mode={state.form.modalMode}
        clubs={clubs}
        seasons={seasons}
        categories={categories}
        isLoading={state.crudLoading}
      />
      <Dialog
        isOpen={state.deleteModal.isOpen}
        onClose={state.deleteModal.closeAndClear}
        title={translations.matchRecordings.deleteModal.title}
        dangerAction
        submitButtonLabel={commonCopy.actions.delete}
        size={'sm'}
        onSubmit={state.handleDelete}
        isLoading={state.crudLoading}
      >
        {translations.matchRecordings.deleteModal.description}
      </Dialog>
    </>
  );
}
