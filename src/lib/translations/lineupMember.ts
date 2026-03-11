export const lineupMembersTranslations = {
  responseMessages: {
    lineupMembersFetchFailed: 'Chyba při načítání členů soupisky',
    lineupMembersNotFound: 'Žádní dostupní členové',
    lineupMembersSearchNotFound: 'Žádní členové neodpovídají vyhledávání',
    createSuccess: 'Člen soupisky úspěšně přidán',
    updateSuccess: 'Člen soupisky úspěšně aktualizován',
    deleteSuccess: 'Člen soupisky úspěšně odebrán',
    createError: 'Chyba při přidávání člena soupisky',
    updateError: 'Chyba při aktualizaci člena soupisky',
    deleteError: 'Chyba při odebírání člena soupisky',
    errorMessage: 'Nastala chyba. Zkuste to prosím znovu.',
  },
  title: 'Členové soupisky',
  titles: {
    addMemberToLineup: 'Přidat člena na soupisku',
  },
  labels: {
    search: 'Hledat člena...',
    showAll: 'Zobrazit všechny členy',
    hideAll: 'Skrýt členy mimo mé kategorie',
    availableMembers: 'Dostupní členové',
    select: 'Vybrat',
    member: 'Člen',
    registrationNumber: 'Reg. číslo',
  },
  buttons: {
    createNewMember: 'Vytvořit nového člena',
    removeMember: 'Odebrat člena ze soupisky',
  },
  noLineupMembers: 'Žádní členové soupisky',
  selectLineupPrompt: 'Vyberte soupisku pro zobrazení členů',
  addMember: 'Přidat člena na soupisku',
  table: {
    ariaLabel: 'Seznam členů soupisky',
    columns: {
      member: 'Člen',
      position: 'Pozice',
      jersey_number: 'Dres',
      functions: 'Funkce',
      actions: 'Akce',
    },
  },
  lineupMemberSetupCard: {
    title: 'Nastavení člena',
    functionSection: {
      title: 'Funkce',
      captain: 'Kapitán',
      viceCaptain: 'Zástupce kapitána',
    },
    labels: {
      position: 'Pozice',
      jerseyNumber: 'Číslo dresu',
      selectedMemberTitle: 'Vybraný člen:',
      name: 'Jméno',
      surname: 'Příjmení',
      registrationNumber: 'Registrační číslo',
    },
    placeholders: {
      position: 'Vyberte pozici',
      jerseyNumber: 'Vyberte číslo dresu',
    },
  },
  deleteLineupMemberDialog: {
    title: 'Odebrat člena ze soupisky',
    message: 'Opravdu chcete odebrat tohoto člena ze soupisky?',
  },
};
