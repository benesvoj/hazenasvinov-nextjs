export const trainingSessionsTranslations = {
  title: 'Tréninkové jednotky',
  titleShort: 'Trénink',
  noTrainingSession: 'Žádné tréninky',
  noTrainingSessionDescription: 'Zatím nebyly vytvořeny žádné tréninkové jednotky.',
  noTrainingSessionsFound: 'Nenalezen žádný trénink odpovídající zadaným kritériím.',
  cancelTrainingSessionReason: 'Důvod zrušení:',
  changeTrainingSessionStatus: 'Změnit stav tréninku',
  updateTrainingSession: 'Upravit trénink',
  deleteTrainingSession: 'Smazat trénink',
  trainingSessionDescription: 'Popis:',
  trainingSessionGenerator: 'Generátor tréninků',
  trainingSessionTime: 'Čas tréninku',
  statuses: {
    planned: 'Naplánován',
    done: 'Proveden',
    cancelled: 'Zrušen',
    description: {
      planned: 'Trénink je naplánován a čeká na provedení',
      done: 'Trénink byl úspěšně proveden',
      cancelled: 'Trénink byl zrušen',
    },
  },
  labels: {
    title: 'Název trénink',
    description: 'Popis',
    date: 'Datum',
    time: 'Čas',
    location: 'Místo',
    sessionStatus: 'Stav tréninku',
    automaticTrainingSessionStatus:
      'Automaticky vytvořit záznamy docházky pro členy sestavy (výchozí: přítomen)',
    preview: 'Náhled vygenerovaných tréninků',
    numberInSessionTitle: 'Přidat číslo do názvu (např. Trénink 1, Trénink 2, ...)',
    today: 'Dnes',
  },
  placeholders: {
    title: 'Zadejte název tréninku',
    description: 'Zadejte popis tréninku',
    location: 'Zadejte místo konání tréninku',
    cancelReason: 'Zadejte důvod zrušení tréninku...',
    sessionStatus: 'Vyberte stav tréninku',
    automaticTrainingSessionStatus:
      'Pokud je zaškrtnuto, budou automaticky vytvořeny záznamy docházky pro všechny členy sestavy vybrané kategorie a sezóny.',
  },
  ariaLabel: {
    numberInSessionTitle: 'Přidat číslo do názvu',
    automaticTrainingSessionStatus: 'Vytvořit záznamy docházky',
  },
  alerts: {
    sessionCanceled:
      'Při zrušení tréninku budou všichni členové automaticky označeni jako nepřítomní.',
  },
  responseMessages: {
    trainingSessionsFetchFailed: 'Chyba při načítání tréninkových jednotek',
    createSuccess: 'Tréninková jednotka byla úspěšně vytvořena.',
    updateSuccess: 'Tréninková jednotka byla úspěšně aktualizována.',
    deleteSuccess: 'Tréninková jednotka byla úspěšně smazána.',
    createError: 'Chyba při vytváření tréninkové jednotky.',
    updateError: 'Chyba při aktualizaci tréninkové jednotky.',
    deleteError: 'Chyba při mazání tréninkové jednotky.',
    mandatoryFieldsMissing: 'Vyplňte všechny povinné údaje',
    trainingGenerationSummary: (successCount: number, errorCount: number) =>
      `Vytvořeno ${successCount} tréninků, ${errorCount} se nepodařilo vytvořit`,
    noTrainingSessionsProvided: 'Nebyl vybrán žádný trénink k vytvoření',
  },
  actions: {
    preview: 'Generovat náhled',
  },
  tabs: {
    upcoming: 'Nadcházející',
    past: 'Minulé',
    all: 'Vše',
  },
};
