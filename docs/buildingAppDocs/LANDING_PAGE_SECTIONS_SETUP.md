# Landing Page Sections Management

This document describes how to set up and use the new landing page sections management system that allows administrators to control the visibility of key sections on the main page.

## Overview

The landing page sections management system allows you to:
- Show/hide the "O našem oddílu" (About Our Club) section
- Show/hide the "Naši partneři a sponzoři" (Our Partners and Sponsors) section  
- Show/hide the "Chcete se připojit k našemu týmu?" (Join Our Team) section

## Setup

### 1. Run the Setup Script

First, ensure you have the page visibility system set up:

```bash
npm run setup:page-visibility
```

Then add the landing page sections:

```bash
npm run setup:landing-sections
```

### 2. Verify Database Entries

The setup script will create three new entries in the `page_visibility` table:

- `club_highlight_section` - Controls the "O našem oddílu" section
- `sponsors_section` - Controls the "Naši partneři a sponzoři" section
- `call_to_action_section` - Controls the "Chcete se připojit k našemu týmu?" section

## Usage

### Admin Panel

1. Navigate to **Admin > Club Config**
2. Scroll down to the **"Sekce hlavní stránky"** (Landing Page Sections) card
3. Use the toggle switches to show/hide each section
4. Changes take effect immediately on the public landing page

### Section Descriptions

- **Club Highlight Section**: Displays information about the club and its history
- **Sponsors Section**: Shows the list of partners and sponsors
- **Call to Action Section**: Displays the invitation to join the club

## Technical Implementation

### Components

- **`useSectionVisibility` hook**: Manages section visibility state
- **Main page conditional rendering**: Sections are only rendered when visible
- **Admin controls**: Toggle switches in ClubPagesCard component

### Database Schema

The system uses the existing `page_visibility` table with these fields:
- `page_key`: Unique identifier for each section
- `is_visible`: Boolean flag for visibility
- `category`: Set to 'landing' for these sections
- `sort_order`: Display order (1-3)

### Files Modified

- `src/hooks/useSectionVisibility.ts` - New hook for section visibility
- `src/app/(main)/page.tsx.backup` - Conditional section rendering
- `src/app/admin/club-config/components/ClubPagesCard.tsx` - Admin controls
- `scripts/setup-landing-sections.js` - Setup script
- `scripts/add_landing_page_sections.sql` - SQL script

## Benefits

1. **Content Control**: Admins can easily show/hide sections without code changes
2. **A/B Testing**: Test different page layouts by toggling sections
3. **Seasonal Content**: Hide certain sections during specific periods
4. **User Experience**: Tailor the landing page based on current needs

## Troubleshooting

### Sections Not Appearing

1. Check if the setup script ran successfully
2. Verify database entries exist in `page_visibility` table
3. Ensure sections are marked as `is_visible: true`

### Admin Controls Not Working

1. Check browser console for JavaScript errors
2. Verify user has admin permissions
3. Ensure the page visibility API is working correctly

### Performance Issues

The system is optimized for performance:
- Sections are only rendered when visible
- Visibility state is cached in the hook
- No unnecessary re-renders when toggling sections

## Future Enhancements

Potential improvements could include:
- Section ordering controls
- Custom content for each section
- Scheduled visibility (show/hide at specific times)
- Analytics tracking for section visibility
- User preference-based section display
