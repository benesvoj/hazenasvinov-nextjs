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
	import: 'Import dat'
} as const;