
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
				description: 'Connect with third-party tools',
			},
			{
				title: 'Přípravka',
				route: '/categories/young-lings',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Mladší žáci',
				route: '/categories/younger-boys',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Mladší žáčky',
				route: '/categories/younger-girls',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Starší žáci',
				route: '/categories/older-boys',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Starší žáčky',
				route: '/categories/older-girls',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Dorostenci',
				route: '/categories/junior-boys',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Dorostenky',
				route: '/categories/junior-girls',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Muži',
				route: '/categories/men',
				description: 'Connect with third-party tools',
			},
			{
				title: 'Ženy',
				route: '/categories/women',
				description: 'Connect with third-party tools',
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