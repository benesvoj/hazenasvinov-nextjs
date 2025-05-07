
export interface MenuItem {
	title: string;
	route?: string;
	children?: MenuItem[];
	description?: string;
}

const menuItems: MenuItem[] = [
	{route: '/', title: 'Úvod'},
	{
		title: 'Kategorie', children: [
			{
				title: 'Kuřátka',
				route: '/categories/young-lings',
				description: 'Nejmladší se zájmem o pohyb',
			},
			{
				title: 'Přípravka',
				route: '/categories/young-lings',
				description: 'Děti 5--10 let, turnajové kategorie',
			},
			{
				title: 'Mladší žáci',
				route: '/categories/younger-boys',
				description: 'Kluci 9 - 12 let, SM oblast',
			},
			{
				title: 'Mladší žáčky',
				route: '/categories/younger-girls',
				description: 'Devčata 9 - 12 let, SM oblast',
			},
			{
				title: 'Starší žáci',
				route: '/categories/older-boys',
				description: 'Kluci 12 - 15 let, SM oblast',
			},
			{
				title: 'Starší žáčky',
				route: '/categories/older-girls',
				description: 'Devčata 12 - 15 let, SM oblast',
			},
			{
				title: 'Dorostenci',
				route: '/categories/junior-boys',
				description: 'Junioři 15 - 18 let, SM oblast',
			},
			{
				title: 'Dorostenky',
				route: '/categories/junior-girls',
				description: 'Juniorky 15 - 18 let, SM oblast',
			},
			{
				title: 'Muži',
				route: '/categories/men',
				description: '1.liga mužů, SM oblast',
			},
			{
				title: 'Ženy',
				route: '/categories/women',
				description: 'Oblastní liga žen, SM oblast',
			},
		]
	},
	{route: '/chronicle', title: 'Kronika'},
	{route: '/downloads', title: 'Dokumenty'},
	{route: '/contact', title: 'Kontakt'},
	{route: '/about', title: 'O oddílu'},
	{route: '/celebration', title: '100 let'},
]

export default menuItems