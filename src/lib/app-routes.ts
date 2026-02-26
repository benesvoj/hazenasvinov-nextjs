export const APP_ROUTES = {
  // Public — no auth required
  public: {
    home: '/' as const,
    blog: '/blog' as const,
    blogPost: (slug: string) => `/blog/${slug}`,
    matches: '/matches' as const,
    match: (id: string | number) => `/matches/${id}`,
    photoGallery: '/photo-gallery' as const,
    chronicle: '/chronicle' as const,
    downloads: '/downloads' as const,
    contact: '/contact' as const,
    about: '/about' as const,
    celebration: '/100' as const,
    category: (id: string | number) => `/category/${id}`,
  },

  // Auth + error utility routes
  auth: {
    login: '/login' as const,
    setPassword: '/set-password' as const,
    resetPassword: '/reset-password' as const,
    error: '/error' as const,
    blocked: '/blocked' as const,
  },

  // Admin portal
  admin: {
    root: '/admin' as const,
    users: '/admin/users' as const,
    posts: '/admin/posts' as const,
    categories: '/admin/categories' as const,
    seasons: '/admin/seasons' as const,
    matches: '/admin/matches' as const,
    members: '/admin/members' as const,
    memberFunctions: '/admin/member-functions' as const,
    committees: '/admin/committees' as const,
    sponsorship: '/admin/sponsorship' as const,
    clubConfig: '/admin/club-config' as const,
    photoGallery: '/admin/photo-gallery' as const,
    clubs: '/admin/clubs' as const,
    club: (id: string | number) => `/admin/clubs/${id}`,
    clubNew: '/admin/clubs/new' as const,
    clubCategories: '/admin/club-categories' as const,
    videos: '/admin/videos' as const,
    userRoles: '/admin/user-roles' as const,
    meetingMinutes: '/admin/meeting-minutes' as const,
    grantCalendar: '/admin/grant-calendar' as const,
  },

  // Coach portal
  coaches: {
    root: '/coaches' as const,
    dashboard: '/coaches/dashboard' as const,
    attendance: '/coaches/attendance' as const,
    login: '/login?tab=coach' as const,
  },
} as const;
