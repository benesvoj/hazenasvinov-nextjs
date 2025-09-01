import {translations} from "@/lib/translations";

export interface MenuItem {
	title: string;
	route?: string;
	children?: MenuItem[];
	description?: string;
	isPrivate?: boolean;
	hidden?: boolean;
}

export const publicRoutes = {
	home: '/',
	error: '/error',
	chronicle: '/chronicle',
	downloads: '/downloads',
	contact: '/contact',
	about: '/about',
	celebration: '/100',
	blog: '/blog',
	login: '/login',
	matches: '/matches',
	photoGallery: '/photo-gallery',
	youngestKids: '/categories/youngest-kids',
	prepKids: '/categories/prep-kids',
	youngerBoys: '/categories/younger-boys',
	youngerGirls: '/categories/younger-girls',
	olderBoys: '/categories/older-boys',
	olderGirls: '/categories/older-girls',
	juniorBoys: '/categories/junior-boys',
	juniorGirls: '/categories/junior-girls',
	men: '/categories/men',
	women: '/categories/women',
} as const;



export const privateRoutes = {
	admin: '/admin',
	users: '/admin/users',
	posts: '/admin/posts',
	categories: '/admin/categories',
	seasons: '/admin/seasons',
	teams: '/admin/teams',
	teamCategories: '/admin/team-categories',
	matches: '/admin/matches',
	members: '/admin/members',
	memberFunctions: '/admin/member-functions',
	committees: '/admin/committees',
	competitions: '/admin/competitions',
	sponsorship: '/admin/sponsorship',
	clubConfig: '/admin/club-config',
	photoGallery: '/admin/photo-gallery',
	clubs: '/admin/clubs',
	clubCategories: '/admin/club-categories',
};

const routes: MenuItem[] = [
	{route: publicRoutes.home, title: translations.landingPage.title},
	{
		title: 'Kategorie', children: [
			{
				title: 'Kuřátka',
				route: publicRoutes.youngestKids,
				description: 'Nejmladší se zájmem o pohyb',
			},
			{
				title: 'Přípravka',
				route: publicRoutes.prepKids,
				description: 'Děti 5--10 let, turnajové kategorie',
			},
			{
				title: 'Mladší žáci',
				route: publicRoutes.youngerBoys,
				description: 'Kluci 9 - 12 let, SM oblast',
			},
			{
				title: 'Mladší žáčky',
				route: publicRoutes.youngerGirls,
				description: 'Devčata 9 - 12 let, SM oblast',
			},
			{
				title: 'Starší žáci',
				route: publicRoutes.olderBoys,
				description: 'Kluci 12 - 15 let, SM oblast',
			},
			{
				title: 'Starší žáčky',
				route: publicRoutes.olderGirls,
				description: 'Devčata 12 - 15 let, SM oblast',
			},
			{
				title: 'Dorostenci',
				route: publicRoutes.juniorBoys,
				description: 'Junioři 15 - 18 let, SM oblast',
			},
			{
				title: 'Dorostenky',
				route: publicRoutes.juniorGirls,
				description: 'Juniorky 15 - 18 let, SM oblast',
			},
			{
				title: 'Muži',
				route: publicRoutes.men,
				description: '1.liga mužů, SM oblast',
			},
			{
				title: 'Ženy',
				route: publicRoutes.women,
				description: 'Oblastní liga žen, SM oblast',
			},
		]
	},
	{route: publicRoutes.blog, title: 'Novinky'},
	{route: publicRoutes.matches, title: 'Zápasy'},
	{route: publicRoutes.photoGallery, title: 'Fotogalerie'},
	{route: publicRoutes.chronicle, title: 'Kronika'},
	{route: publicRoutes.downloads, title: 'Dokumenty'},
	{route: publicRoutes.contact, title: 'Kontakt'},
	{route: publicRoutes.about, title: 'O oddílu'},
	{route: publicRoutes.celebration, title: '100 let'},
	{route: publicRoutes.login, title: 'Admin'},
	{route: privateRoutes.admin, title: 'Dashboard', isPrivate: true, description: 'Správa obsahu a nastavení systému.'},
	{route: privateRoutes.competitions, title: translations.competitions.title, isPrivate: true, description: translations.competitions.description, hidden: true},
	{route: privateRoutes.teams, title: 'Týmy', isPrivate: true, description: 'Správa týmů a jejich informací.'},
	{route: privateRoutes.committees, title: 'Komise', isPrivate: true, description: 'Správa oblastních soutěžních komisí.'},
	{route: privateRoutes.matches, title: 'Zápasy', isPrivate: true, description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.'},
	{route: privateRoutes.members, title: 'Členové', isPrivate: true, description: 'Správa členů klubu - přidávání, úprava a mazání členů.'},
	{route: privateRoutes.memberFunctions, title: 'Funkce členů', isPrivate: true, description: 'Správa funkcí členů klubu - přidávání, úprava a mazání funkcí.'},
	{route: privateRoutes.teamCategories, title: 'Kategorie týmů', isPrivate: true, description: 'Správa kategorií týmů pro různé sezóny.', hidden: true},
	{route: privateRoutes.seasons, title: translations.seasons.title, isPrivate: true, description: translations.seasons.description},
	{route: privateRoutes.categories, title: 'Kategorie', isPrivate: true, description: 'Správa kategorií pro týmové soutěže a členy klubu.'},
	{route: privateRoutes.posts, title: 'Blog', isPrivate: true, description: 'Správa blogových článků a novinek.'},
	{route: privateRoutes.users, title: 'Uživatelé', isPrivate: true, description: 'Správa uživatelů, kteří se mohou přihlásit do systému.'},
	{route: privateRoutes.sponsorship, title: 'Sponzorství', isPrivate: true, description: 'Správa sponzorů, partnerů a sponzorských balíčků.'},
	{route: privateRoutes.clubConfig, title: 'Konfigurace klubu', isPrivate: true, description: 'Správa nastavení a konfigurace klubu.'},
	{route: privateRoutes.photoGallery, title: 'Fotogalerie', isPrivate: true, description: 'Správa fotoalb a fotografií.'},
	{route: privateRoutes.clubs, title: 'Kluby', isPrivate: true, description: 'Správa klubů a jejich týmů.'},
	{route: privateRoutes.clubCategories, title: 'Přiřazení klubů', isPrivate: true, description: 'Správa přiřazení klubů ke kategoriím pro různé sezóny.'},
]

export default routes