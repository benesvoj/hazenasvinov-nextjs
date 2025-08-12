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
	users: {
		title: 'Správa uživatelů',
		description: 'Správa uživatelů, kteří se mohou přihlásit do systému.',
		table: {
			id: 'ID',
			email: 'Email',
			createdAt: 'Vytvořeno',
			updatedAt: 'Aktualizováno',
			actions: 'Akce',
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
	}
} as const;