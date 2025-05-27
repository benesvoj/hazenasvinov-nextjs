import {translations} from "@/lib/translations";

export interface MenuItem {
	title: string;
	route?: string;
	children?: MenuItem[];
	description?: string;
	isPrivate?: boolean;
}

export const publicRoutes = {
	home: '/',
	error: '/error',
	chronicle: '/chronicle',
	downloads: '/downloads',
	contact: '/contact',
	about: '/about',
	celebration: '/celebration',
	login: '/login',
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
	dashboard: '/admin',
	articles: '/admin/articles',
	teams: '/admin/teams',
	players: '/admin/players',
	users: '/admin/users',
	competitions: '/admin/competitions',
} as const;

const routes: MenuItem[] = [
	{route: publicRoutes.home, title: 'Úvod'},
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
	{route: publicRoutes.chronicle, title: 'Kronika'},
	{route: publicRoutes.downloads, title: 'Dokumenty'},
	{route: publicRoutes.contact, title: 'Kontakt'},
	{route: publicRoutes.about, title: 'O oddílu'},
	{route: publicRoutes.celebration, title: '100 let'},
	{route: publicRoutes.login, title: 'Admin'},
	{route: privateRoutes.dashboard, title: 'Dashboard', isPrivate: true, description: 'Správa obsahu a nastavení systému.'},
	{route: privateRoutes.competitions, title: translations.competitions.title, isPrivate: true, description: translations.competitions.description},
	{route: privateRoutes.users, title: 'Uživatelé', isPrivate: true, description: 'Správa uživatelů, kteří se mohou přihlásit do systému.'},
]

export default routes