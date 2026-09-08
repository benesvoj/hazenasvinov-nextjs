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
  editLineupMemberDialog: {
    title: 'Upravit člena soupisky',
    action: 'Upravit údaje na soupisce',
    updateSuccess: 'Údaje člena soupisky upraveny',
    updateError: 'Údaje se nepodařilo uložit',
  },
  deleteLineupMemberDialog: {
    title: 'Odebrat člena ze soupisky',
    message: 'Opravdu chcete odebrat tohoto člena ze soupisky?',
    attendanceCheckbox: (count: number) => `Odebrat i z docházky naplánovaných tréninků (${count})`,
    attendanceNone: 'V naplánovaných trénincích nemá tento člen žádnou docházku.',
    attendancePastWarning: (count: number) =>
      `Pozor: ${count} z těchto tréninků už podle data proběhlo. Tréninky nikdo nepřeklápí na „Proběhlo“, takže se smaže i zapsaná docházka. Tuto akci nelze vrátit zpět.`,
    confirm: 'Odebrat',
  },
  attendanceSync: {
    outOfSyncTooltip: (count: number) =>
      `Chybí v ${count === 1 ? '1 tréninku' : `${count} trénincích`}`,
    summaryChip: (members: number, records: number) =>
      `Docházka nesedí u ${members === 1 ? '1 člena' : `${members} členů`} (${records} chybějících záznamů)`,
    syncAll: 'Srovnat vše',
    dialog: {
      title: 'Dogenerovat docházku',
      titleAll: 'Dogenerovat docházku pro celou soupisku',
      intro: (name: string, count: number) => `${name} chybí v ${count} trénincích této sezóny.`,
      introAll: (members: number, records: number) =>
        `${members === 1 ? '1 člen soupisky' : `${members} členů soupisky`} nemá docházku ve všech trénincích této sezóny — celkem chybí ${records} záznamů.`,
      scopeLabel: 'Které tréninky doplnit',
      scopeAll: 'Všechny tréninky sezóny',
      scopeAllHint: (count: number) => `Doplní ${count} chybějících záznamů.`,
      scopePlanned: 'Jen naplánované tréninky',
      scopePlannedHint: (count: number) => `Doplní ${count} chybějících záznamů.`,
      statusLabel: 'S jakým stavem docházky záznamy založit',
      statusHint: 'Existující záznamy se nepřepisují — doplní se jen ty, které chybí.',
      submit: 'Dogenerovat',
      nothingToDo: 'V tomto rozsahu není co doplnit.',
    },
    responseMessages: {
      created: (count: number) =>
        count === 1 ? 'Doplněn 1 záznam docházky' : `Doplněno ${count} záznamů docházky`,
      createFailed: 'Docházku se nepodařilo dogenerovat',
      deleted: (count: number) =>
        count === 1 ? 'Odebrán 1 záznam docházky' : `Odebráno ${count} záznamů docházky`,
      deleteFailed: 'Docházku se nepodařilo odebrat',
    },
  },
};
