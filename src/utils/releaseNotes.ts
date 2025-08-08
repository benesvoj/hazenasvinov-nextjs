export interface ReleaseNote {
  version: string;
  date: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  technicalUpdates: string[];
}

// Static release notes data
export const releaseNotesData: ReleaseNote[] = [
  {
    version: '1.5.0',
    date: 'August 2025',
    features: [
      'Match Detail System: Complete match detail pages with comprehensive information display',
      'Matchweek Integration: Added matchweek information throughout the application',
      'Enhanced Match Layout: New horizontal 3-column layout matching professional sports design',
      'Advanced Match Filtering: Category and status-based filtering for all matches',
      'Navigation Integration: Added "Zápasy" to main navigation with proper routing'
    ],
    improvements: [
      'Match Display Consistency: Unified layout across landing page, schedule page, and detail pages',
      'Team Logo Presentation: Circular logos with proper fallback handling and consistent sizing',
      'Date and Time Formatting: Improved time display with HH:MM format and proper localization',
      'Responsive Design: Enhanced mobile and desktop layouts for all match displays',
      'Error Handling: Graceful handling of missing matches and loading states'
    ],
    bugFixes: [
      'React Key Conflicts: Fixed duplicate route entries causing React rendering errors',
      'Navigation Duplication: Resolved duplicate "Zápasy" entries in routes configuration',
      'TypeScript Interface Updates: Added matchweek property to all match interfaces',
      'Data Transformation: Ensured matchweek data is properly preserved in all components'
    ],
    technicalUpdates: [
      'Dynamic Routing: Implemented Next.js dynamic routes for match detail pages',
      'Database Query Optimization: Enhanced Supabase queries with proper joins and filtering',
      'Component Architecture: Modular match display components with consistent styling',
      'Route Management: Updated routing system to support match detail navigation'
    ]
  },
  {
    version: '1.4.0',
    date: 'August 2024',
    features: [
      'Committee Management System: Complete CRUD operations for regional competition committees',
      'Own Club Filtering: Landing page now shows only matches and results for your own club',
      'Team Logo Integration: Display team logos throughout the application with fallback handling',
      'Enhanced Match Display: Improved layout with team logos, action buttons, and better information hierarchy'
    ],
    improvements: [
      'Database Schema Evolution: Migrated from simple region field to structured committees table',
      'Team Management: Added committee assignment and own club designation for teams',
      'Match Schedule Filtering: Smart filtering for own club matches while showing complete standings',
      'Form Auto-fill Prevention: Fixed issue where forms retained data from previously opened dialogs',
      'Committee Code Immutability: Prevented editing of committee codes after creation for data integrity'
    ],
    bugFixes: [
      'Supabase Query Syntax: Fixed invalid .or() clause syntax that was causing database errors',
      'TypeScript Interface Updates: Added missing is_own_club properties to team interfaces',
      'Form State Management: Resolved committee form auto-fill issues with proper reset functions',
      'Database Schema Issues: Added missing columns and proper foreign key relationships'
    ],
    technicalUpdates: [
      'Committee System Architecture: New committees table with proper RLS policies and triggers',
      'JavaScript Filtering: Replaced problematic Supabase .or() clauses with client-side filtering',
      'Enhanced Error Handling: Added detailed logging and diagnostic scripts for better debugging',
      'Database Migration Scripts: Comprehensive SQL scripts for schema updates and data validation'
    ]
  },
  {
    version: '1.3.0',
    date: 'August 2025',
    features: [
      'Visual Todo Management: Added intuitive icons for priority, status, and category indicators',
      'Smart Todo Sorting: Automatic sorting by priority (urgent > high > medium > low) and due date',
      'Enhanced Todo Layout: Stacked label-value design for better readability and information hierarchy',
      'Responsive Grid System: 12-column grid layout for optimal space distribution'
    ],
    improvements: [
      'Todo List UX: Removed "assigned to" field for cleaner interface',
      'Date Formatting: Simplified created date to YYYY-MM-DD format for better readability',
      'Email Field Spacing: Optimized layout to prevent email wrapping with 50-67% width allocation',
      'Icon-Based Indicators: Replaced text badges with intuitive icons for faster scanning',
      'Release Notes Modal: Fixed positioning and sizing issues for better viewport display'
    ],
    bugFixes: [
      'Modal Positioning: Resolved release notes modal appearing outside viewport',
      'Form State Management: Removed assigned_to field from todo forms and database operations',
      'TypeScript Errors: Fixed interface conflicts after removing assigned_to field',
      'Grid Layout Issues: Resolved responsive grid behavior for different screen sizes'
    ],
    technicalUpdates: [
      'Release Notes Architecture: Migrated from markdown parsing to TypeScript static data',
      'Todo Interface Updates: Removed assigned_to from TodoItem interface',
      'Grid System Implementation: Implemented 12-column CSS Grid for precise layout control',
      'Icon System Integration: Added comprehensive icon mapping for todo indicators'
    ]
  },
  {
    version: '1.2.0',
    date: 'August 2025',
    features: [
      'Enhanced Categories Management: Added 1:N relationship between categories and seasons',
      'Season Configuration: Full CRUD operations for season assignments per category',
      'Editable Season Settings: Competition type, matchweek count, team count, and duplicate team allowances',
      'Tabbed Interface: Organized category editing with "Basic Info" and "Seasons" tabs',
      'Icon-Only Actions: Streamlined action buttons throughout the admin interface'
    ],
    improvements: [
      'Dashboard Refactor: Added todo list and release notes sections',
      'Categories Table: Removed unnecessary columns for cleaner overview',
      'Form Validation: Enhanced input validation and error handling',
      'UI/UX Enhancements: Better modal layouts and responsive design'
    ],
    bugFixes: [
      'Category Code Immutability: Prevented editing of category codes after creation',
      'Data Fetching: Fixed category seasons loading and error handling',
      'Form State Management: Resolved issues with form data persistence'
    ],
    technicalUpdates: [
      'Database Schema: Updated to support category_seasons junction table',
      'TypeScript Interfaces: Enhanced type safety for category and season management',
      'Component Architecture: Improved separation of concerns and reusability'
    ]
  },
  {
    version: '1.1.0',
    date: 'August 2025',
    features: [
      'Team Logo Management: Upload, preview, and delete team logos using Supabase Storage',
      'Matchweek System: Added matchweek tracking and grouping for better competition organization',
      'Bulk Operations: Bulk update matchweeks for multiple matches',
      'Enhanced Match Editing: Edit completed matches with full score and result management'
    ],
    improvements: [
      'Standings Calculation: Fixed points calculation (2 points for win instead of 3)',
      'Match Display: Improved upcoming matches and results layout with team logos',
      'Admin Interface: Better modal layouts and form organization'
    ],
    bugFixes: [
      'Storage Permissions: Resolved RLS policy issues for team logo uploads',
      'Data Fetching: Fixed various data loading and error handling issues',
      'UI Rendering: Resolved React key conflicts and component state issues'
    ],
    technicalUpdates: [
      'Supabase Storage Integration: Full CRUD for team logos',
      'Database Migrations: Added matchweek column and related indexes',
      'Error Handling: Improved error handling and user feedback'
    ]
  },
  {
    version: '1.0.0',
    date: 'June 2025',
    features: [
      'Basic Admin Interface: Categories, teams, matches, and users management',
      'Match Scheduling: Create and manage matches with teams and venues',
      'Standings System: Automatic calculation and display of team standings',
      'User Authentication: Secure login and role-based access control',
      'Responsive Design: Mobile-friendly interface with dark/light theme support'
    ],
    improvements: [
      'CRUD Operations: Full create, read, update, delete functionality for all entities',
      'Data Validation: Form validation and error handling',
      'Real-time Updates: Live data updates and state management',
      'Export Functionality: CSV export for match schedules and results'
    ],
    bugFixes: [
      'Initial Release: Core functionality implementation',
      'Database Setup: Initial schema and data structure',
      'UI Components: Basic component library and styling'
    ],
    technicalUpdates: [
      'Next.js 15: Latest framework with App Router',
      'Supabase Integration: Database and authentication setup',
      'TypeScript: Full type safety throughout the application',
      'Tailwind CSS: Utility-first styling approach'
    ]
  }
];

// Function to get release notes (now just returns the static data)
export const getReleaseNotes = (): ReleaseNote[] => {
  return releaseNotesData;
};

// Legacy function for backward compatibility
export const parseReleaseNotes = (markdown: string): ReleaseNote[] => {
  console.log('parseReleaseNotes called with markdown, returning static data instead');
  return releaseNotesData;
};
