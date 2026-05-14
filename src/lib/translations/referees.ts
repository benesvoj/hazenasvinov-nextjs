export const refereesTranslations = {
  responseMessages: {
    fetchFailed: 'Chyba při načítání rozhodčích',
    createSuccess: 'Rozhodčí byl úspěšně přidán',
    createError: 'Chyba při přidávání rozhodčího',
    updateSuccess: 'Rozhodčí byl úspěšně aktualizován',
    updateError: 'Chyba při aktualizaci rozhodčího',
    deleteSuccess: 'Rozhodčí byl úspěšně smazán',
    deleteError: 'Chyba při mazání rozhodčího',
    assignSuccess: 'Rozhodčí zápasu byli uloženi',
    assignError: 'Chyba při ukládání rozhodčích zápasu',
  },
  table: {
    ariaLabel: 'Tabulka rozhodčích',
    header: {
      name: 'Příjmení',
      surname: 'Jméno',
      fullName: 'Jméno a příjmení',
      member: 'Člen klubu',
      status: 'Stav',
      actions: 'Akce',
    },
  },
  status: {
    active: 'Aktivní',
    inactive: 'Neaktivní',
  },
  modal: {
    addTitle: 'Přidat rozhodčího',
    editTitle: 'Upravit rozhodčího',
    deleteTitle: 'Smazat rozhodčího',
    deleteDescription: 'Opravdu chcete smazat rozhodčího',
    formFields: {
      name: 'Jméno',
      namePlaceholder: 'např. Jan',
      surname: 'Příjmení',
      surnamePlaceholder: 'např. Novák',
      memberId: 'Člen klubu (volitelné)',
      memberIdPlaceholder: 'Vyberte člena klubu, pokud je rozhodčí členem',
      isActive: 'Aktivní',
    },
  },
  emptyState: {
    title: 'Žádní rozhodčí nenalezeni',
    description: 'Přidejte prvního rozhodčího kliknutím na tlačítko níže.',
  },
  page: {
    title: 'Rozhodčí',
    description: 'Správa rozhodčích — interních členů klubu i externích rozhodčích.',
  },
  matchForm: {
    referee1Label: '1. rozhodčí (volitelné)',
    referee1Placeholder: 'Vyberte 1. rozhodčího',
    referee2Label: '2. rozhodčí (volitelné)',
    referee2Placeholder: 'Vyberte 2. rozhodčího',
    sectionTitle: 'Rozhodčí',
  },
};
