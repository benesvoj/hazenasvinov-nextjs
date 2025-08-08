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
    version: '1.3.0',
    date: 'December 2024',
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
