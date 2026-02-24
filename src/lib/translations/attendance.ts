export const attendanceTranslations = {
  completedSessions: 'Dokončené tréninky',
  plannedSessions: 'Naplánované tréninky',
  cancelledSessions: 'Zrušené tréninky',
  completionRate: 'Míra dokončení',
  noDataMessage: 'Pro tuto kategorii a sezónu nejsou k dispozici žádné statistiky.',
  errorMessage: 'Nepodařilo se načíst statistiky. Zkuste to prosím znovu.',
  modal: {
    title: {
      addSession: 'Nový trénink',
      editSession: 'Upravit trénink',
      deleteSession: 'Smazat trénink',
    },
    description: {
      deleteSession:
        'Opravdu chcete smazat tento trénink? Tato akce je nevratná a může ovlivnit související data.',
    },
  },
  labels: {
    newSession: 'Nový trénink',
    newSessionShort: 'Nový',
    attendanceList: (count: number) => `Docházka (${count})`,
  },
  ariaLabels: {
    sessionGeneration: 'Generovat tréninky',
  },
  enums: {
    tabs: {
      attendance: 'Docházka',
      statistics: 'Statistiky a analýza',
    },
    statuses: {
      present: 'Přítomen',
      excused: 'Omluven',
      late: 'Pozdní příchod',
      absent: 'Nepřítomen',
    },
  },
  alerts: {
    missingAttendanceRecords: (count: number) =>
      `Upozornění: ${count} záznamů má chybějící data člena a nebude zobrazeno.`,
  },
  responseMessages: {
    sessionStateUpdateFailed: 'Chyba při změně stavu tréninku',
    noMembersForSession: 'Žádní členové nejsou k dispozici pro vybranou kategorii',
    sessionCreationFailed: 'Chyba při vytváření záznamů docházky',
    attendanceCreationFailed: 'Chyba při zaznamenávání docházky',
    sessionSavingFailed: 'Chyba při ukládání tréninku',
    sessionDeletionFailed: 'Chyba při mazání tréninku',
    selectSeasonAndCategory: 'Vyberte sezónu a kategorii pro zobrazení statistik',
    sessionWasNotCreated: 'Nepodařilo se vytvořit trénink',
    selectSessionToShowAttendance: 'Vyberte trénink pro zobrazení docházky',
    attendanceRecordsCreated: (count: number) =>
      `Vytvořeno ${count} záznamů docházky pro tento trénink`,
  },
  table: {
    columns: {
      memberName: 'Jméno člena',
      status: 'Status',
    },
  },
  charts: {
    attendanceAverage: 'Průměr přítomných',
    attendancePercentage: 'Průměrná docházka',
    absenceAverage: 'Průměr nepřítomných',
    attendanceTrend: 'Trend docházky',
  },
};
