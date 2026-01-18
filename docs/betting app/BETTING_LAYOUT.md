# Betting App Layout

## Overview

The betting app now has its own dedicated layout separate from the main application. This provides a clean, focused betting experience without the main app's navigation elements.

## Structure

```
src/app/
├── (main)/              # Main app with Header/Footer
│   └── ...
├── (betting)/           # Betting app with custom layout
│   ├── layout.tsx       # Custom layout (no header)
│   └── betting/
│       └── page.tsx.backup     # Main betting page
└── betting/             # API routes for betting
    ├── history/
    ├── leaderboard/
    ├── rules/
    └── wallet/
```

## Key Features

### 1. Separate Layout (`src/app/(betting)/layout.tsx`)
- **No topbar/header** - Clean, distraction-free interface
- **Dark gradient background** - Gaming/betting aesthetic
- **Minimal footer** - Only essential info
- Route: Accessible at `/betting`

### 2. Login Screen (`src/components/features/betting/BettingLogin.tsx`)
- **Mockup authentication** - Ready for real auth integration
- **Feature highlights** - Shows betting system benefits
- **Demo account option** - Quick testing
- **Responsive design** - Works on all devices

### 3. Updated Betting Page (`src/app/(betting)/betting/page.tsx.backup`)
- Shows **BettingLogin** when user is not authenticated
- Shows **betting interface** when user is logged in
- Includes **logout button** in the header
- **Light text on dark background** for better contrast

## Visual Design

### Layout
- Dark gradient background: `from-gray-900 via-gray-800 to-gray-900`
- No main app header/navigation
- Minimal footer with "Play Responsibly" message

### Login Screen
- Split layout: Features on left, form on right
- Highlighted features with icons:
  - Live Betting (green)
  - Leaderboard (blue)
  - Virtual Currency (yellow)
- Warning banner about virtual currency

### Betting Interface
- White text for headers
- Light gray text for descriptions
- Logout button (red, top-right)
- Blue accent for info sections

## Routes

- **Login/Landing**: `/betting` (when not authenticated)
- **Betting Dashboard**: `/betting` (when authenticated)
- **API Endpoints**: `/betting/*` (separate folder for API routes)

## Components

### New Components
1. `BettingLogin` - Login/registration screen
2. Updated `betting/page.tsx.backup` - Main betting interface with auth check

### Existing Components (Updated for dark theme)
- `BetHistory`
- `BetSlip`
- `LeaderboardTable`
- `MatchBettingCard`
- `WalletBalance`

## Integration Notes

### Authentication
Currently using mockup authentication. To integrate real auth:

1. Update `BettingLogin.onLogin` handler in `page.tsx.backup`
2. Call Supabase auth service
3. Redirect on success

### Logout
Currently shows alert. To implement:

1. Update logout button handler in `page.tsx.backup`
2. Call Supabase signOut
3. Refresh page to show login screen

### Theme Adjustments
Some components may need color adjustments for dark background:
- Cards should use dark variants
- Text should be light-colored
- Borders should be visible against dark background

## Future Enhancements

1. **Real Authentication**
   - Integrate Supabase auth
   - Session management
   - Protected routes

2. **Navigation**
   - Add minimal sidebar for betting sections
   - Quick access to History, Leaderboard, Rules

3. **Responsive Design**
   - Optimize for mobile betting
   - Touch-friendly bet slip
   - Swipeable tabs

4. **Animations**
   - Smooth transitions
   - Loading states
   - Bet placement feedback

## Testing

To test the new layout:

1. Navigate to `/betting`
2. You should see the login screen (if not logged in)
3. Click "Try Demo Account" to populate demo credentials
4. Click "Sign In" to see the betting interface
5. Verify no header/topbar is visible
6. Check logout button functionality

## Migration Notes

**Old Location**: `src/app/(main)/betting/page.tsx.backup`
**New Location**: `src/app/(betting)/betting/page.tsx.backup`

The page was moved from the `(main)` route group to the `(betting)` route group to apply the custom layout.
