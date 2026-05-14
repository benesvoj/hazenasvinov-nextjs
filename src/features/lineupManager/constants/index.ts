// Lineup Manager Constants

export const LINEUP_VALIDATION_RULES = {
  MIN_GOALKEEPERS: 1,
  MAX_GOALKEEPERS: 2,
  MIN_FIELD_PLAYERS: 6,
  MAX_FIELD_PLAYERS: 13,
  MAX_COACHES: 3,
} as const;

export const LINEUP_MODAL_NAMES = {
  PLAYER_SELECTION: 'playerSelection',
  PLAYER_EDIT: 'playerEdit',
  COACH_SELECTION: 'coachSelection',
  COACH_EDIT: 'coachEdit',
  DELETE_LINEUP: 'deleteLineup',
  DELETE_PLAYER: 'deletePlayer',
} as const;

export const LINEUP_TABLE_COLUMNS = {
  PLAYERS: [
    {key: 'name', label: 'Hráč', allowsSorting: true},
    {key: 'position', label: 'Pozice', allowsSorting: true},
    {key: 'jersey_number', label: 'Dres', allowsSorting: true, align: 'center' as const},
    {key: 'goals', label: 'Góly', allowsSorting: true, align: 'center' as const},
    {key: 'yellow_cards', label: 'ŽK', allowsSorting: true, align: 'center' as const},
    {key: 'red_cards_5min', label: 'ČK5', allowsSorting: true, align: 'center' as const},
    {key: 'red_cards_10min', label: 'ČK10', allowsSorting: true, align: 'center' as const},
    {key: 'red_cards_personal', label: 'ČKOT', allowsSorting: true, align: 'center' as const},
    {key: 'actions', label: 'Akce', align: 'center' as const},
  ],
  COACHES: [
    {key: 'name', label: 'Trenér'},
    {key: 'role', label: 'Funkce'},
    {key: 'actions', label: 'Akce', align: 'center' as const},
  ],
} as const;

export const LINEUP_MESSAGES = {
  SUCCESS: {
    LINEUP_SAVED: 'Sestava byla úspěšně uložena!',
    LINEUP_CREATED: 'Sestava byla automaticky vytvořena',
    PLAYER_ADDED: 'Hráč byl přidán do sestavy',
    PLAYER_UPDATED: 'Hráč byl aktualizován',
    PLAYER_DELETED: 'Hráč byl odebrán ze sestavy',
    COACH_ADDED: 'Trenér byl přidán do sestavy',
    COACH_UPDATED: 'Trenér byl aktualizován',
    COACH_DELETED: 'Trenér byl odebrán ze sestavy',
  },
  WARNING: {
    GOALKEEPER_REQUIRED: 'Upozornění: Sestava musí mít alespoň 1 brankáře',
    INCOMPLETE_LINEUP: 'Upozornění: Sestava není kompletní',
  },
  ERROR: {
    VALIDATION: '⚠️ Pravidla sestavy:',
    DATABASE: '❌ Chyba databáze:',
    NETWORK: '❌ Problém se sítí:',
    UNKNOWN: '❌ Neznámá chyba:',
  },
} as const;
