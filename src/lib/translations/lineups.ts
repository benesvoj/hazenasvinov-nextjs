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
  titles: {
    title: 'Soupisky',
    new: 'Nová soupiska',
    update: 'Upravit soupisku',
    delete: 'Smazat soupisku',
  },
  actions: {
    newLineup: 'Nová soupiska',
  },
  deleteLineupMessage: 'Opravdu chcete smazat tuto soupisku? Tato akce je nevratná.',
  emptyState: {
    title: 'Žádné soupisky',
    description:
      'Zatím nemáte žádné soupisky. Začněte vytvořením nové soupisky pro vaši kategorii.',
  },
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
  labels: {
    name: 'Název soupisky',
    description: 'Popis',
  },
  placeholders: {
    name: 'Zadejte název soupisky',
    description: 'Zadejte popis soupisky',
  },
};
