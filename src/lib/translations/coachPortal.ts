import {Nullish} from '@/types';

export const coachPortalTranslations = {
  title: 'Trenérský portál',
  description: 'Přehled vašich týmů a aktivit',
  routes: {
    dashboard: 'Dashboard',
    matches: 'Zápasy',
    lineups: 'Soupisky týmů',
    videos: 'Videa',
    attendance: 'Docházka členů',
    statistics: 'Statistiky',
    meetingMinutes: 'Zápisy z výborových schůzí',
    members: 'Seznam členů',
    profile: 'Profil trenéra',
  },
  labels: {
    fetchingCardError: (error: string | Nullish) => `Chyba při načítání statistik: ${error}`,
  },
  descriptions: {
    dashboard: 'Přehled vašich týmů a aktivit',
    matches: 'Zápasy pro vaše přiřazené kategorie',
    lineups: 'Správa soupisek vašich týmů',
    videos: 'Videa a tréninkové materiály',
    attendance: 'Sledování docházky členů',
    statistics: 'Statistiky a analýzy týmů',
    meetingMinutes: 'Zápisy z výborových schůzí',
    profile: 'Správa vašeho trenérského profilu',
  },
  birthdayCard: {
    title: 'Nadcházející narozeniny',
    emptyStateTitle: 'Žádné nadcházející narozeniny',
    noBirthdays: 'Žádné nadcházející narozeniny v přiřazených kategoriích',
    loadingError: 'Chyba při načítání narozenin: ',
    lastBirthdaysTitle: 'Zobrazují se nejbližší 3 narozeniny',
  },
  redCardsCard: {
    title: 'Červené karty',
    emptyState: {
      title: 'Žádné červené karty',
      description: 'Zatím nebyly odehrány žádné zápasy, takže nejsou žádné červené karty',
    },
    labels: {
      matchesPlayed: 'zápasů',
      '5min': '×5min',
      '10min': '×10min',
      personal: '×osobní',
    },
    loadingError: 'Chyba při načítání statistik: ',
  },
  bestScorersCard: {
    title: 'Nejlepší střelci',
    emptyState: {
      title: 'Žádní střelci',
      description:
        'Zatím nebyly odehrány žádné zápasy, takže nejsou žádní střelci. Statistiky se zobrazí po odehrání prvních zápasů',
    },
    labels: {
      top5: 'Zobrazuje se top 5 střelců',
      goalsPerMatch: 'gólů/zápas',
    },
  },
  yellowCardsCard: {
    title: 'Žluté karty',
    emptyState: {
      title: 'Žádné žluté karty',
      description:
        'Zatím nebyly odehrány žádné zápasy, takže nejsou žádné žluté karty. Statistiky se zobrazí po odehrání prvních zápasů',
    },
    labels: {
      matchesPlayed: 'zápasů',
      top5: 'Zobrazuje se top 5 hráčů s žlutými kartami',
    },
  },
};
