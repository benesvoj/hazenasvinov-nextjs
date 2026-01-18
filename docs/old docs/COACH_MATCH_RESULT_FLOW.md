# Coach Match Result Flow

## Overview

A mobile-friendly 3-step process for coaches to record match results, photos, and notes directly from their dashboard. This feature allows coaches to quickly and easily document match outcomes and observations.

## Features

### 3-Step Mobile Flow

1. **Result Entry** - Enter final score and halftime score
2. **Photo Capture** - Take or upload a photo from the match
3. **Coach Notes** - Add observations and notes about the match (optional)

### Key Features

- **Mobile-Optimized**: Designed primarily for mobile devices with touch-friendly interface
- **Progress Tracking**: Visual progress bar showing current step
- **Photo Upload**: Direct camera capture or file upload with preview
- **Validation**: Form validation ensures all required data is entered
- **Error Handling**: Clear error messages and loading states
- **Responsive Design**: Works on both mobile and desktop devices

## Database Changes

### New Column Added

```sql
-- Add coach_notes field to matches table
ALTER TABLE matches 
ADD COLUMN coach_notes TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_matches_coach_notes ON matches(coach_notes) WHERE coach_notes IS NOT NULL;
```

### Updated Match Type

The `Match` interface now includes:
```typescript
coach_notes?: string | Nullish;
```

## File Structure

```
src/app/coaches/matches/
├── components/
│   ├── CoachMatchResultFlow.tsx    # Main 3-step flow component
│   ├── UpcomingMatchesCard.tsx     # Updated with result flow button
│   └── index.ts                    # Updated exports
├── page.tsx.backup                        # Updated to integrate flow
```

## Usage

### For Coaches

1. Navigate to the Coaches → Matches page
2. Find an upcoming match in the "Nadcházející zápasy" section
3. Click the "Zaznamenat výsledek" button
4. Follow the 3-step process:
   - Enter scores (final and halftime)
   - Take or upload a photo
   - Add coach notes
5. Click "Dokončit" to save

### Technical Implementation

The flow is implemented as a modal with three distinct steps:

1. **Step 1 - Result Entry**:
   - Final score inputs for home and away teams
   - Halftime score inputs for home and away teams
   - Validation ensures scores are non-negative numbers

2. **Step 2 - Photo Capture**:
   - File input with camera capture support
   - Image preview after selection
   - File validation (max 5MB, images only)
   - Upload to Supabase storage

3. **Step 3 - Coach Notes**:
   - Textarea for coach observations
   - Character limit (1000 characters)
   - Optional field (no validation required)

## Storage

- **Photos**: Stored in `club-assets` storage bucket under `match-photos/` path
- **File naming**: `{matchId}-{timestamp}.{extension}`
- **File limits**: 5MB maximum, images only (PNG, JPG, etc.)

## Security

- Uses existing Supabase RLS policies
- File upload validation
- User authentication required
- Coach role verification through existing system

## Mobile Optimization

- Touch-friendly buttons and inputs
- Camera capture support (`capture="environment"`)
- Responsive modal sizing
- Optimized for portrait orientation
- Large touch targets for easy interaction

## Error Handling

- File size validation
- File type validation
- Network error handling
- Database error handling
- User-friendly error messages in Czech

## Future Enhancements

- Multiple photo upload support
- Photo editing capabilities
- Offline support
- Push notifications for match reminders
- Integration with team statistics
- Export functionality for match reports
