export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  technical: string[];
}

export const releaseNotes: ReleaseNote[] = [
  {
    version: "2.3.0",
    date: "2025-08-21",
    title: "Component Refactoring & UI Consistency Improvements",
    description: "Significant refactoring of admin components for better maintainability, improved UI consistency with HeroUI components, and enhanced user experience in the matches management system.",
    features: [
      "🔧 Component Refactoring - Extracted AddMatchModal into separate reusable component",
      "🎨 UI Consistency - Replaced custom delete confirmation modals with standardized DeleteConfirmationModal",
      "📝 Enhanced Form Management - Improved season and category selection in match creation",
      "🔄 Better State Management - Cleaner separation of concerns between components",
      "🎯 Improved User Experience - More intuitive and consistent modal interactions"
    ],
    improvements: [
      "⚡ Code Maintainability - Reduced duplication and improved component organization",
      "🎨 Design Consistency - Unified delete confirmation dialogs across the application",
      "📱 Better Component Structure - Cleaner, more maintainable component architecture",
      "🔍 Enhanced Debugging - Added debug information for season selection troubleshooting",
      "📊 Improved Form Validation - Better handling of season and category dependencies"
    ],
    bugFixes: [
      "🐛 Fixed season selection dropdown visibility issues in admin matches page",
      "🔧 Resolved component prop passing issues between parent and child components",
      "📝 Fixed form data synchronization in AddMatchModal component",
      "🖼️ Corrected component import paths and dependency management",
      "⚡ Fixed component re-rendering issues with proper prop handling"
    ],
    technical: [
      "🏗️ Created AddMatchModal component for better code organization",
      "🗄️ Implemented DeleteConfirmationModal integration across admin pages",
      "🔌 Enhanced component props interfaces with proper TypeScript typing",
      "🎭 Improved error handling and user feedback in modal components",
      "📱 Optimized component rendering and state management",
      "🔄 Refactored modal state management for better performance",
      "🎨 Standardized UI components using HeroUI design system"
    ]
  },
  {
    version: "2.2.0",
    date: "2025-01-13",
    title: "Dynamic Blog System & Enhanced Admin Features",
    description: "Major update introducing a fully dynamic blog system integrated with the landing page, enhanced admin features for blog management, and significant performance improvements.",
    features: [
      "🎉 Dynamic Blog Integration - Blog posts now automatically appear on landing page",
      "📝 Enhanced Blog Post Management - Image uploads, category selection, and rich content editing",
      "🖼️ Image Support - Blog posts can now include featured images with Supabase storage",
      "🏷️ Smart Tagging System - Multiple category selection using HeroUI components",
      "🔍 Advanced Blog Search - Search and filter functionality on blog listing page",
      "📱 Responsive Blog Design - Mobile-friendly layouts with proper image handling",
      "🔄 Related Posts - Automatic suggestions for related content based on tags"
    ],
    improvements: [
      "⚡ Performance Optimization - Fixed infinite API call loops in match scheduling",
      "🎨 UI/UX Enhancements - Professional blog posting dialogs with HeroUI components",
      "📊 Better Content Organization - Landing page now shows latest news first",
      "🔄 Real-time Updates - Blog content updates immediately reflect on public pages",
      "📱 Mobile Experience - Improved responsive design across all blog components",
      "🎯 Content Prioritization - Latest news section moved to top of landing page"
    ],
    bugFixes: [
      "🐛 Fixed infinite API call loops in MatchSchedule and MatchSchedulePage components",
      "🔧 Resolved Supabase client creation issues causing performance problems",
      "📝 Fixed blog post ordering to show newest posts first",
      "🖼️ Resolved image hostname configuration issues for external domains",
      "⚡ Fixed authentication fetch errors with proper error handling and timeouts",
      "📊 Corrected database schema issues for blog post images"
    ],
    technical: [
      "🏗️ Created useFetchBlogPosts hook for centralized blog data management",
      "🗄️ Added image_url column support to blog_posts table schema",
      "🔌 Integrated Supabase storage for blog image uploads",
      "🎭 Enhanced error boundaries and loading states for better user experience",
      "📱 Optimized Next.js Image component usage across all blog components",
      "🔄 Implemented client-side sorting to ensure proper post ordering",
      "🎨 Migrated to HeroUI components for consistent design language"
    ]
  },
  {
    version: "2.1.0",
    date: "2025-01-12",
    title: "Supabase Integration & Authentication System",
    description: "Comprehensive update implementing Supabase database integration, authentication system, and robust error handling for the application.",
    features: [
      "🔐 Complete Authentication System - Login, logout, and session management",
      "👥 User Management - Admin portal for managing users, blocking/unblocking accounts",
      "📊 Login Logging - Track all login attempts with timestamps and user actions",
      "🔄 Password Reset - Email-based password reset functionality",
      "🛡️ Route Protection - Middleware-based admin route security",
      "👤 User Profiles - Editable user information and metadata management"
    ],
    improvements: [
      "⚡ Performance Optimization - Fixed infinite API call loops",
      "🎨 UI/UX Enhancements - Professional login page with HeroUI components",
      "📱 Mobile Responsiveness - Improved mobile experience across all pages",
      "🔍 Better Error Handling - Comprehensive error boundaries and user feedback",
      "📊 Connection Status - Real-time database connection monitoring",
      "🔄 Automatic Reloads - Smart error recovery for chunk loading issues"
    ],
    bugFixes: [
      "🐛 Fixed infinite API call loops in match scheduling components",
      "🔧 Resolved Supabase client creation issues",
      "📝 Fixed blog post management errors",
      "🖼️ Resolved image loading issues with proper Next.js configuration",
      "⚡ Fixed authentication fetch errors",
      "📊 Corrected database permission issues"
    ],
    technical: [
      "🏗️ Implemented Supabase client architecture with proper error handling",
      "🗄️ Created comprehensive database schema for users, posts, and logs",
      "🔌 Built API endpoints for user management and authentication",
      "🎭 Added custom error boundaries for database and chunk loading errors",
      "📱 Optimized Next.js configuration for image domains and webpack",
      "🔄 Implemented automatic login/logout logging system",
      "🎨 Migrated from Headless UI to HeroUI components"
    ]
  },
  {
    version: "2.0.0",
    date: "2025-01-11",
    title: "Major UI/UX Overhaul & Component System",
    description: "Complete redesign of the user interface with modern HeroUI components, improved layouts, and enhanced user experience across all pages.",
    features: [
      "🎨 Modern UI Design - Complete redesign using HeroUI components",
      "📱 Mobile-First Approach - Responsive design optimized for all devices",
      "🎭 Component System - Reusable UI components for consistency",
      "🌙 Dark Mode Support - Full dark/light theme implementation",
      "📊 Enhanced Tables - Professional data tables with sorting and filtering",
      "🎯 Improved Navigation - Better user flow and navigation structure"
    ],
    improvements: [
      "⚡ Performance - Optimized component rendering and data fetching",
      "🎨 Visual Design - Modern, professional appearance throughout",
      "📱 Responsiveness - Better mobile experience across all pages",
      "🔍 User Experience - Improved workflows and interaction patterns",
      "📊 Data Display - Better organization and presentation of information",
      "🔄 State Management - Improved React state handling and updates"
    ],
    bugFixes: [
      "🐛 Fixed component rendering issues",
      "🔧 Resolved layout and styling problems",
      "📝 Corrected form validation and submission",
      "🖼️ Fixed image display and loading issues",
      "⚡ Resolved performance bottlenecks",
      "📱 Fixed mobile responsiveness issues"
    ],
    technical: [
      "🏗️ Migrated from Headless UI to HeroUI component library",
      "🎨 Implemented comprehensive design system with consistent components",
      "📱 Added responsive design patterns and mobile optimizations",
      "🌙 Built theme switching system with dark/light mode support",
      "🔌 Integrated modern React patterns and hooks",
      "📊 Enhanced data table components with advanced functionality",
      "🎭 Created reusable component library for consistent UI"
    ]
  },
  {
    version: "1.0.0",
    date: "2025-01-10",
    title: "Initial Release - Core Application Foundation",
    description: "First release of the TJ Sokol Svinov National Handball Club application with basic functionality and core features.",
    features: [
      "🏠 Landing Page - Club introduction and overview",
      "📊 Match Management - Schedule, results, and standings",
      "👥 Team Categories - Different age groups and teams",
      "📝 Basic Blog System - Static news and announcements",
      "📞 Contact Information - Club contact details and location",
      "🏛️ About Section - Club history and information"
    ],
    improvements: [
      "🎯 User Experience - Intuitive navigation and clear information hierarchy",
      "📱 Responsive Design - Works well on all device sizes",
      "⚡ Performance - Fast loading and smooth interactions",
      "🔍 Accessibility - Proper semantic HTML and keyboard navigation",
      "📊 Data Organization - Clear presentation of club information",
      "🎨 Visual Design - Professional and attractive appearance"
    ],
    bugFixes: [
      "🐛 Initial bug fixes and stability improvements",
      "🔧 Performance optimizations",
      "📝 Content accuracy and updates",
      "🖼️ Image loading and display fixes",
      "⚡ Speed improvements",
      "📱 Mobile experience enhancements"
    ],
    technical: [
      "🏗️ Built on Next.js 15 with React 18",
      "🎨 Styled with Tailwind CSS for modern design",
      "📱 Implemented responsive design patterns",
      "🔌 Set up basic routing and page structure",
      "📊 Created data management and display components",
      "🎭 Built component architecture for maintainability",
      "📱 Optimized for mobile and desktop devices"
    ]
  }
];

// Function to get release notes (now just returns the static data)
export const getReleaseNotes = (): ReleaseNote[] => {
  return releaseNotes;
};

// Legacy function for backward compatibility
export const parseReleaseNotes = (markdown: string): ReleaseNote[] => {
  console.log('parseReleaseNotes called with markdown, returning static data instead');
  return releaseNotes;
};
