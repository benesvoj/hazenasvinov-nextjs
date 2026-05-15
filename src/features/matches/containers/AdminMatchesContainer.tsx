'use client';

import React from 'react';

import {Alert, Card, CardBody, Select, SelectItem, Tab, Tabs} from '@heroui/react';

import {translations} from '@/lib/translations';

import {isEmpty} from '@/utils/arrayHelper';
import {testMaterializedViewRefresh} from '@/utils/testMaterializedView';

import {getCategoryInfo} from '@/helpers/getCategoryInfo';

import {
  AdminContainer,
  DeleteConfirmationModal,
  LoadingSpinner,
  UnifiedStandingTable,
} from '@/components';
import {ActionTypes} from '@/enums';
import {LineupManagerModal} from '@/features/lineupManager';

import {
  AddMatchModal,
  AddResultModal,
  BulkUpdateMatchweekModal,
  CategoryMatches,
  EditMatchModal,
  ExcelImportModal,
  MatchActionsModal,
  MatchProcessWizardModal,
} from '../components';
import {getMatchweekOptions} from '../helpers';
import {useMatchesPageLogic} from '../hooks';

export function AdminMatchesContainer() {
  const {
    selectedMatch,
    setSelectedMatch,
    formData,
    setFormData,
    editData,
    setEditData,
    resultData,
    setResultData,
    bulkUpdateData,
    setBulkUpdateData,
    loading,
    isSeasonClosed,
    filters,
    modal,
    deleteConfirm,
    matchActions,
    categories,
    sortedSeasons,
    members,
    filteredTeams,
    matches,
    seasonalMatches,
    selectedCategoryId,
    matchesError,
    standingsApi,
    refereesByMatchId,
    toggleMatchweek,
    isMatchweekExpanded,
    expandedMatchweeks,
    handleAddMatch,
    handleUpdateResult,
    handleEditMatch,
    handleUpdateMatch,
    handleDeleteMatch,
    handleDeleteAllMatches,
    handleBulkUpdateMatchweek,
    handleExcelImport,
  } = useMatchesPageLogic();

  const {selectedCategory, setSelectedCategory, selectedSeasonId, setSelectedSeasonId} = filters;
  const {
    standings,
    standingsLoading,
    hasStandings,
    error,
    handleResetAndRecalculate,
    handleStandingsAction,
  } = standingsApi;

  const generateStandingsLabel = hasStandings
    ? translations.matches.actions.recalculateStandings
    : translations.matches.actions.generateStandings;

  return (
    <AdminContainer
      actions={[
        {
          label: translations.matches.actions.addMatch,
          onClick: modal.addMatch.onOpen,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
          isDisabled: isSeasonClosed,
          priority: 'primary',
        },
        {
          label: translations.matches.actions.bulkUpdateMatchweek,
          onClick: modal.bulkUpdate.onOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary',
        },
        {
          label: generateStandingsLabel,
          onClick: () => handleStandingsAction(isSeasonClosed),
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary',
        },
        {
          label: translations.matches.actions.resetAndRecalculateStandings,
          onClick: () => handleResetAndRecalculate(isSeasonClosed),
          buttonType: ActionTypes.DELETE,
          color: 'warning',
          isDisabled: isSeasonClosed,
          priority: 'secondary',
        },
        {
          label: translations.matches.actions.import,
          onClick: modal.excelImport.onOpen,
          buttonType: ActionTypes.UPDATE,
          color: 'secondary',
          isDisabled: isSeasonClosed,
          priority: 'secondary',
        },
        {
          label: translations.matches.actions.testMaterializedViewRefresh,
          onClick: testMaterializedViewRefresh,
          color: 'secondary',
          buttonType: ActionTypes.UPDATE,
          isDisabled: isSeasonClosed,
          priority: 'secondary',
        },
        {
          label: translations.matches.actions.deleteAllMatches,
          onClick: modal.deleteAllConfirm.onOpen,
          buttonType: ActionTypes.DELETE,
          color: 'danger',
          isDisabled: isSeasonClosed || !selectedSeasonId,
          priority: 'secondary',
        },
      ]}
      filters={
        <div className="w-full">
          {isEmpty(sortedSeasons) ? (
            <div className="w-full flex justify-center items-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <Select
                label={translations.seasons.page.title}
                placeholder={translations.seasons.selectSeason}
                selectedKeys={selectedSeasonId ? [selectedSeasonId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setSelectedSeasonId(selectedKey || '');
                }}
                className="w-full"
              >
                {sortedSeasons.map((season) => (
                  <SelectItem key={season.id} textValue={season.name}>
                    {season.name}{' '}
                    {season.is_closed ? `(${translations.seasons.labels.closed})` : ''}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>
      }
    >
      {selectedSeasonId && isSeasonClosed && (
        <Alert
          color="warning"
          title={translations.common.alerts.warning}
          description={translations.seasons.alerts.warning.closedSeasonMessage}
        />
      )}

      {error && (
        <Alert color="danger" description={error} title={translations.common.alerts.error} />
      )}

      {selectedSeasonId && (
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">{translations.common.loading}</div>
            ) : (
              <Tabs
                aria-label="Categories"
                selectedKey={selectedCategory}
                onSelectionChange={(key) => setSelectedCategory(key as string)}
              >
                {categories.map((category) => (
                  <Tab key={category.id} title={category.name}>
                    <div className="mt-4 space-y-4">
                      <h3 className="text-lg font-semibold mb-4">
                        {category.name} - {getCategoryInfo(category.id, categories).competition}
                      </h3>

                      {!selectedCategoryId && (
                        <div className="text-center py-8 text-gray-500">
                          {isEmpty(categories)
                            ? 'Načítání kategorií...'
                            : 'Vyberte kategorii pro zobrazení zápasů'}
                        </div>
                      )}

                      {selectedCategoryId && matchesError && (
                        <Alert
                          color="danger"
                          description={matchesError.message}
                          title={translations.matches.alerts.danger.matchesFetchingErrorTitle}
                        />
                      )}

                      {selectedCategoryId && !matchesError && (
                        <CategoryMatches
                          matches={matches}
                          category={category}
                          expandedMatchweeks={expandedMatchweeks}
                          toggleMatchweek={toggleMatchweek}
                          isMatchweekExpanded={isMatchweekExpanded}
                          onAddResult={(match) => {
                            setSelectedMatch(match);
                            modal.addResult.onOpen();
                          }}
                          onEditMatch={handleEditMatch}
                          onLineupModalOpen={(match) => {
                            setSelectedMatch(match);
                            modal.lineup.onOpen();
                          }}
                          onDeleteClick={(match) => deleteConfirm.openWith(match)}
                          onMatchActionsOpen={(match) => {
                            setSelectedMatch(match);
                            matchActions.openWith(match);
                          }}
                          isSeasonClosed={isSeasonClosed}
                          refereesByMatchId={refereesByMatchId}
                        />
                      )}

                      <UnifiedStandingTable standings={standings} loading={standingsLoading} />
                    </div>
                  </Tab>
                ))}
              </Tabs>
            )}
          </CardBody>
        </Card>
      )}

      <AddMatchModal
        isOpen={modal.addMatch.isOpen}
        onClose={modal.addMatch.onClose}
        onAddMatch={handleAddMatch}
        formData={formData}
        setFormData={setFormData}
        filteredTeams={filteredTeams}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeasonId}
        getMatchweekOptions={getMatchweekOptions}
      />

      <AddResultModal
        isOpen={modal.addResult.isOpen}
        onClose={modal.addResult.onClose}
        selectedMatch={selectedMatch}
        resultData={resultData}
        onResultDataChange={setResultData}
        onUpdateResult={handleUpdateResult}
        isSeasonClosed={isSeasonClosed}
      />

      <EditMatchModal
        isOpen={modal.editMatch.isOpen}
        onClose={modal.editMatch.onClose}
        selectedMatch={selectedMatch}
        editData={editData}
        onEditDataChange={setEditData}
        onUpdateMatch={handleUpdateMatch}
        teams={filteredTeams}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed}
      />

      <BulkUpdateMatchweekModal
        isOpen={modal.bulkUpdate.isOpen}
        onClose={modal.bulkUpdate.onClose}
        bulkUpdateData={bulkUpdateData}
        onBulkUpdateDataChange={setBulkUpdateData}
        onBulkUpdate={handleBulkUpdateMatchweek}
        categories={categories}
        matches={matches}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed}
      />

      <LineupManagerModal
        isOpen={modal.lineup.isOpen}
        onClose={modal.lineup.onClose}
        selectedMatch={selectedMatch}
        members={members}
        onMemberCreated={() => {}}
      />

      <ExcelImportModal
        isOpen={modal.excelImport.isOpen}
        onClose={modal.excelImport.onClose}
        onImport={handleExcelImport}
        categories={categories}
        teams={[]}
        selectedSeason={selectedSeasonId}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.closeAndClear}
        onConfirm={handleDeleteMatch}
        title="Potvrdit smazání zápasu"
        message={`
          Opravdu chcete smazat zápas <strong>${
            deleteConfirm.selectedItem?.home_team?.name || 'Domácí tým'
          } vs ${
            deleteConfirm.selectedItem?.away_team?.name || 'Hostující tým'
          }</strong> ze dne ${deleteConfirm.selectedItem?.date}?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a smaže všechny související údaje o zápasu.</span>
        `}
      />

      <MatchActionsModal
        isOpen={matchActions.isOpen}
        onClose={matchActions.onClose}
        match={selectedMatch}
        onAddResult={modal.addResult.onOpen}
        onEditMatch={handleEditMatch}
        onLineupModalOpen={modal.lineup.onOpen}
        onDeleteClick={() => deleteConfirm.openWith(selectedMatch!)}
        onMatchProcessOpen={modal.matchProcess.onOpen}
        isSeasonClosed={isSeasonClosed}
      />

      <MatchProcessWizardModal
        isOpen={modal.matchProcess.isOpen}
        onClose={modal.matchProcess.onClose}
        match={selectedMatch}
      />

      <DeleteConfirmationModal
        isOpen={modal.deleteAllConfirm.isOpen}
        onClose={modal.deleteAllConfirm.onClose}
        onConfirm={handleDeleteAllMatches}
        title="Potvrdit smazání všech zápasů"
        message={`
          <div class="space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <span class="font-semibold text-red-800">⚠️ Varování!</span>
              <p class="text-red-700 mt-2">
                Tato akce smaže <strong>VŠECHNY</strong> zápasy pro vybranou sezónu.
              </p>
            </div>
            <p>
              Opravdu chcete smazat všechny zápasy pro sezónu <strong>${
                sortedSeasons.find((s) => s.id === selectedSeasonId)?.name || 'Neznámá sezóna'
              }</strong>?
            </p>
            <p class="text-sm text-gray-600">
              <strong>Počet zápasů k smazání:</strong> ${
                [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])].length
              }
            </p>
          </div>
        `}
      />
    </AdminContainer>
  );
}
