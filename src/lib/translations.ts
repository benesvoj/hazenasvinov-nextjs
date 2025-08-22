import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export const translations = {
	footer: {
		copyright: `© 2025 TJ Sokol Svinov. Všechna práva vyhrazena.`,
	},
	categories: {
		title: 'Kategorie',
		description: 'Správa kategorií, které jsou dostupné v systému.',
		edit: 'Upravit kategorii',
		editDescription: 'Upravte informace o kategorii. Změny budou uloženy po kliknutí na tlačítko "Uložit". Úpravy se projeví na všech stránkách, které tuto kategorii používají.',
		table: {
			id: 'ID',
			name: 'Název',
			namePlaceholder: 'Zadejte název kategorie',
			nameError: 'Zadejte unikátní název kategorie',
			description: 'Popis',
			descriptionPlaceholder: 'Zadejte popis kategorie',
			descriptionError: 'Zadejte popis kategorie',
			route: 'Cesta',
			routePlaceholder: 'Zadejte URL kategorie',
			routeError: 'Zadejte unikátní URL kategorie',
			updatedAt: 'Aktualizováno',
			createdAt: 'Vytvořeno',
			actions: 'Akce'
		}
	},
	men: {
		title: 'Muži',
	},
	women: {
		title: 'Ženy',
	},
	juniorBoys: {
		title: 'Dorostenci',
	},
	juniorGirls: {
		title: 'Dorostenky',
	},
	olderBoys: {
		title: 'Starší žáci',
	},
	olderGirls: {
		title: 'Starší žačky',
	},
	youngerBoys: {
		title: 'Mladší žáci',
	},
	youngerGirls: {
		title: 'Mladší žačky',
	},
	email: 'email',
	password: 'heslo',
	name: 'Jméno',
	enterYourEmail: 'Zadejte svůj email',
	enterValidEmail: 'Zadejte platný email',
	enterYourName: 'Zadejte své jméno',
	login: 'Přihlásit se',
	signup: 'Registrovat se',
	logout: 'Odhlásit se',
	returnBackToHomepage: 'Zpět na úvodní stránku',
	// Authentication related translations
	authenticationRequired: 'Vyžadováno přihlášení',
	loginRequiredForAccess: 'Pro přístup k této stránce se musíte přihlásit.',
	admin: {
		title: 'Administrace',
	},
	button: {
		add: 'Přidat',
		edit: 'Upravit',
		delete: 'Smazat',
		save: 'Uložit',
		cancel: 'Zrušit',
		confirm: 'Potvrdit',
		decline: 'Zamítnout',
	},
	sponsorship: {
		title: 'Sponzorství',
		description: 'Správa sponzorů, partnerů a sponzorských balíčků.',
		sponsors: 'Sponzoři',
		packages: 'Sponzorské balíčky',
		partners: 'Partneři',
		mainPartners: 'Hlavní partneři',
		mainPartnersDescription: 'Správa hlavních sponzorů a partnerů klubu',
		businessPartners: 'Obchodní partneři',
		businessPartnersDescription: 'Správa obchodních partnerů a dodavatelů',
		mediaPartners: 'Mediální partneři',
		mediaPartnersDescription: 'Správa mediálních partnerů a propagace',
		button: {
			addPartner: 'Přidat partnera',
			editPartner: 'Upravit partnera',
			save: 'Uložit',
			cancel: 'Zrušit',
			delete: 'Smazat'
		},
		table: {
			id: 'ID',
			name: 'Název',
			logo: 'Logo',
			website: 'Webové stránky',
			description: 'Popis',
			level: 'Úroveň sponzorství',
			startDate: 'Datum začátku',
			endDate: 'Datum konce',
			status: 'Status',
			actions: 'Akce'
		},
		levels: {
			platinum: 'Platinový',
			gold: 'Zlatý',
			silver: 'Stříbrný',
			bronze: 'Bronzový',
			partner: 'Partner'
		},
		status: {
			active: 'Aktivní',
			inactive: 'Neaktivní',
			expired: 'Expirovaný',
			pending: 'Čekající'
		}
	},
	users: {
		title: 'Správa uživatelů',
		description: 'Správa uživatelů, kteří se mohou přihlásit do systému.',
		tabs: {
			users: 'Uživatelé',
			loginLogs: 'Historie přihlášení'
		},
		table: {
			id: 'ID',
			email: 'Email',
			createdAt: 'Vytvořeno',
			updatedAt: 'Aktualizováno',
			actions: 'Akce',
		},
		loginLogs: {
			title: 'Historie přihlášení',
			description: 'Přehled přihlášení uživatelů do systému.',
			table: {
				user: 'Uživatel',
				email: 'Email',
				loginTime: 'Čas přihlášení',
				ipAddress: 'IP adresa',
				userAgent: 'Prohlížeč',
				status: 'Status'
			}
		},
		modal: {
			title: 'Přidat uživatele',
			description: 'Přidejte nového uživatele, který se může přihlásit do systému. Na uvedený email bude odeslán odkaz pro nastavení hesla.',
		}
	},
	competitions: {
		title: 'Soutěže',
		description: 'Správa soutěží, které se konají v rámci systému.',
	},
	seasons: {
		title: 'Sezóny',
		description: 'Správa sezón pro organizaci soutěží a týmů.',
	},
	season: {
		title: 'Sezóna',
		description: 'Správa sezón, které jsou dostupné v systému.',
		selectSeason: 'Vyberte sezónu',
		noSeasons: 'Žádné sezóny nebyly načteny',
		closed: 'Uzavřená',
	},
	error:{
		fetchCategories: 'Chyba při načítání kategorií',
	},
	loading: 'Načítání...',
	matches: {
		matchNumber: 'Číslo zápasu',
		matchNumberPlaceholder: 'např. 1, 2, Finále, Semifinále',
		matchNumberError: 'Zadejte číslo zápasu',
		matchNumberRequired: 'Číslo zápasu je povinné',
		matchNumberInvalid: 'Číslo zápasu je neplatné',
		matchDateTime: 'Datum a čas',
		matchLocation: 'Zápas a místo',
		matchScore: 'Skóre',
		matchResult: 'Výsledek',
		noMatches: 'Žádné odehrané zápasy',
	},
	matchDetail: {
		loading: 'Načítání zápasu...',
		noMatchFound: 'Zápas nebyl nalezen',
		noMatchFoundDescription: 'Požadovaný zápas neexistuje nebo byl odstraněn.',
		backToMatches: 'Zpět na zápasy',
		matchNotStarted: 'Zápas ještě nezačal',
		matchDateTime: 'Datum a čas',
		matchStart: 'Začátek zápasu',
		matchVenue: 'Místo konání',
	},
	import: 'Import dat',
	DeleteConfirmationModal: {
		confirmButtonText: 'Smazat',
		cancelButtonText: 'Zrušit',
	},
	members: {
		deleteMember: 'Smazat člena',
		deleteMemberMessage: 'Opravdu chcete smazat člena <strong>{name} {surname}</strong> (Reg. číslo: {registration_number})? Tato akce je nevratná.',
		members: 'Členové',
		membersDescription: 'Správa členů, které jsou dostupné v systému.',
		membersTable: {
			id: 'ID',
			status: 'Status',
			name: 'Jméno',
			surname: 'Příjmení',
			searchPlaceholder: 'Hledat podle jména, příjmení nebo registračního čísla...',
			registrationNumber: 'Reg. číslo',
			dateOfBirth: 'Datum narození',
			category: 'Kategorie',
			sex: 'Pohlaví',
			functions: 'Funkce',
			actions: 'Akce',
			
		},
		membersList: 'Seznam členů',
		buttonAddMember: 'Přidat člena',
		buttonEditMember: 'Upravit člena',
		buttonDeleteMember: 'Smazat člena',
		buttonAddMemberModal: {
			title: 'Přidat člena',
			description: 'Přidejte nového člena, který se může přihlásit do systému. Na uvedený email bude odeslán odkaz pro nastavení hesla.',
		},
	},
	memberFunctions: {
		title: 'Správa funkcí členů',
		description: 'Správa funkcí členů, které jsou dostupné v systému.',
		list: 'Seznam funkcí',
		table: {
			header: {
				name: 'Název',
				displayName: 'Zobrazovaný název',
				description: 'Popis',
				sorting: 'Řazení',
				status: 'Stav',
				actions: 'Akce',
			},
			ariaLabel: 'Tabulka funkcí členů',
		}
	},
	table: {
		emptyContent: 'Žádné záznamy nebyly nalezeny',
	},
	heroSection: {
		fallbackSubtitle: 'V TJ Sokol Svinov žijeme národní házenou – sportem s ryze českými kořeny a bohatou historií. Už přes 90 let jsme součástí českého sportovního prostředí a během této doby jsme nasbírali řadu úspěchů v soutěžích dospělých i mládeže.',
	},
} as const;