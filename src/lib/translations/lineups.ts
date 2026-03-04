export const lineupsTranslations = {
  responseMessages: {
    lineupsFetchFailed: 'Chyba při načítání soupisek',
    mandatoryName: 'Název je povinný',
    createSuccess: 'Soupiska byla úspěšně vytvořena.',
    updateSuccess: 'Soupiska byla úspěšně aktualizována.',
    deleteSuccess: 'Soupiska byla úspěšně smazána.',
    createError: 'Chyba při vytváření soupisky.',
    updateError: 'Chyba při aktualizaci soupisky.',
    deleteError: 'Chyba při mazání soupisky.',
  },
  title: 'Soupisky',
  updateLineup: 'Upravit soupisku',
  deleteLineup: 'Smazat soupisku',
  deleteLineupMessage: 'Opravdu chcete smazat tuto soupisku? Tato akce je nevratná.',
  noLineups: 'Žádné soupisky',
  deleteLineupMember: 'Smazat člena soupisky',
  deleteLineupMemberMessage:
    'Opravdu chcete smazat tohoto člena ze soupisky? Tato akce je nevratná.',
  enums: {
    errorType: {
      validationError: 'Validace',
      databaseError: 'Databáze',
      networkError: 'Síť',
      unknownError: 'Neznámá',
      permissionError: 'Oprávnění',
    },
    lineupRole: {
      captain: 'Kapitán',
      member: 'Člen',
    },
    playerPosition: {
      goalkeeper: 'Brankář',
      fieldPlayer: 'Hráč v poli',
    },
    playerRoles: {
      captain: 'Kapitán',
    },
  },
};
