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
  lineupIncomplete: {
    title: (covered: number, total: number) =>
      `Soupiska obsahuje ${covered} z ${total} členů kategorie`,
    description:
      'Docházka se zakládá podle soupisky, takže nová docházka bude jen pro ně. Doplňte soupisku, pokud mají být i ostatní. Chybí:',
  },
  labels: {
    newSession: 'Nový trénink',
    newSessionShort: 'Nový',
    attendanceList: (count: number) => `Docházka (počet členů: ${count})`,
    attendanceListEmpty: 'Docházka',
    memberPerformance: 'Výkon člena',
    attendanceTrend: 'Trend docházky',
    recommendation: 'Doporučení pro trénink',
    generatedAt: 'Generováno dne',
    queries: 'Dotazy',
    insights: 'Postřehy',
    // Stats cards
    totalTrainings: 'Tréninky sezóny',
    averageAttendance: 'Průměrná docházka',
    excusedAbsences: 'Omluvené absence',
    unexcusedAbsences: 'Neomluvené absence',
    totalTrainingsSubtitle: 'v aktuální sezóně',
    attendanceTrendVsLastMonth: (diff: number) =>
      diff >= 0 ? `+${diff}% oproti minulému měsíci` : `${diff}% oproti minulému měsíci`,
    // Panel toolbar
    searchPlaceholder: 'Hledat člena…',
    filterAll: 'Vše',
    markAllPresent: 'Označit vše přítomno',
    markAllPresentConfirm: 'Opravdu chcete označit všechny členy jako přítomné?',
    // Bulk actions
    selectedCount: (n: number) => `${n} vybráno`,
    // Note column
    notePlaceholder: 'Poznámka…',
    // History column
    historyLabel: 'Posl. 5 tréninků',
    // Summary bar
    summaryTotal: (n: number) => `Celkem: ${n} členů`,
    // Session detail
    selectSessionPrompt: 'Vyberte trénink ze seznamu vlevo',
    bulkUpdateFailed: 'Nepodařilo se hromadně aktualizovat docházku',
    bulkUpdateSuccess: (n: number) => `Aktualizováno ${n} záznamů`,
    markAllPresentSuccess: 'Všichni členové označeni jako přítomni',
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
    createSuccess: 'Docházka byla úspěšně vytvořena',
    updateSuccess: 'Docházka byla úspěšně aktualizována',
    deleteSuccess: 'Docházka byla úspěšně smazána',
    createError: 'Chyba při vytváření docházky',
    updateError: 'Chyba při aktualizaci docházky',
    deleteError: 'Chyba při mazání docházky',
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
    memberAttendanceFetchFailed: 'Chyba při načítání docházky členů',
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
