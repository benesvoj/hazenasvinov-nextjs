import { PageVisibility } from '@/types/types';

export interface MenuItem {
	title: string;
	route?: string;
	children?: MenuItem[];
	description?: string;
	isPrivate?: boolean;
	hidden?: boolean;
}

// Function to build menu items from page visibility data
export const buildMenuFromPages = (pages: PageVisibility[]): MenuItem[] => {
	const menuItems: MenuItem[] = [];
	
	// Group pages by category
	const groupedPages = pages.reduce((acc, page) => {
		const category = page.category || 'other';
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(page);
		return acc;
	}, {} as Record<string, PageVisibility[]>);

	// Build main navigation items
	if (groupedPages.main) {
		groupedPages.main.forEach(page => {
			menuItems.push({
				title: page.page_title,
				route: page.page_route,
				description: page.page_description,
			});
		});
	}

	// Build categories section if any category pages exist
	if (groupedPages.categories && groupedPages.categories.length > 0) {
		const categoryChildren = groupedPages.categories.map(page => ({
			title: page.page_title,
			route: page.page_route,
			description: page.page_description,
		}));

		menuItems.push({
			title: 'Kategorie',
			children: categoryChildren,
		});
	}

	// Add info pages
	if (groupedPages.info) {
		groupedPages.info.forEach(page => {
			menuItems.push({
				title: page.page_title,
				route: page.page_route,
				description: page.page_description,
			});
		});
	}

	// Add admin login (always visible)
	menuItems.push({
		title: 'Admin',
		route: '/login',
		description: 'Přihlášení do administrace',
	});

	return menuItems;
};

// Fallback routes in case database is not available
export const fallbackRoutes = {
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
};
