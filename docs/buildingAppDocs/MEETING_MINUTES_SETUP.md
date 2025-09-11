# Meeting Minutes Setup Guide

This guide explains how to set up and use the Meeting Minutes feature for managing board meeting records.

## Overview

The Meeting Minutes feature allows administrators and coaches to:
- Create and manage meeting minutes from board meetings
- Track attendees and their attendance status (present/excused)
- Attach documents (Word/PDF) to meeting records
- Filter and search through meeting records
- Generate sequential meeting numbers per year

## Database Schema

### Tables Created

1. **`meeting_minutes`** - Main table for meeting records
   - `id` - Unique UUID
   - `meeting_number` - Sequential number within the year
   - `meeting_date` - Date of the meeting
   - `meeting_place` - Location (optional)
   - `season_id` - Related season (optional)
   - `wrote_by` - User who wrote the minutes
   - `attachment_url` - URL to attached file
   - `attachment_filename` - Original filename
   - `is_active` - Whether the record is active

2. **`meeting_attendees`** - Attendees for each meeting
   - `id` - Unique UUID
   - `meeting_minutes_id` - Reference to meeting minutes
   - `user_id` - Reference to user
   - `status` - 'present' or 'excused'
   - `notes` - Additional notes

## Setup Instructions

### 1. Database Setup

Run the setup script to create the required tables:

```bash
npm run setup:meeting-minutes
```

This will:
- Create the `meeting_minutes` and `meeting_attendees` tables
- Set up proper indexes for performance
- Create Row Level Security policies
- Add necessary triggers for `updated_at` timestamps

### 2. Access the Feature

#### Admin Portal
- Navigate to `/admin/meeting-minutes`
- Full CRUD operations available
- Can create, edit, and delete meeting minutes
- Can manage attendees for each meeting

#### Coach Portal
- Navigate to `/coaches/meeting-minutes`
- Read-only access to meeting minutes
- Can view meeting details and attendees
- Can download attachments

## Features

### Meeting Minutes Header
- **Meeting Number**: Automatically incremented per year
- **Meeting Date**: Date when the meeting took place
- **Meeting Place**: Location (optional)
- **Season**: Related season (optional)
- **Wrote By**: User who wrote the minutes
- **Attachment**: File upload (Word/PDF, max 10MB)

### Attendees Management
- Add/remove attendees from the meeting
- Set attendance status (Present/Excused)
- Add notes for each attendee
- View attendance statistics

### Filtering and Search
- Filter by season
- Filter by who wrote the minutes
- Search by meeting place or notes
- Date range filtering

## Usage Examples

### Creating a New Meeting Minutes Entry

1. Go to Admin Portal → Meeting Minutes
2. Click "Přidat zápis" (Add Minutes)
3. Fill in the basic information:
   - Meeting number (auto-generated)
   - Meeting date
   - Meeting place (optional)
   - Season (optional)
   - Who wrote the minutes
4. Add attendees:
   - Click "Přidat účastníka" (Add Attendee)
   - Select user from dropdown
   - Set status (Present/Excused)
   - Add notes if needed
5. Upload attachment if available
6. Click "Vytvořit zápis" (Create Minutes)

### Viewing Meeting Minutes

1. Go to Coach Portal → Meeting Minutes
2. Use filters to find specific meetings
3. Click on a meeting to view details
4. Download attachments if available

## File Upload

- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10MB
- Files are stored in Supabase Storage
- Original filename is preserved

## Permissions

- **Admin users**: Full access to all meeting minutes
- **Coach users**: Read-only access to meeting minutes
- **Regular users**: No access to meeting minutes

## Technical Details

### API Endpoints
- Meeting minutes are managed through the `useMeetingMinutes` hook
- Data is fetched from Supabase with proper joins
- Real-time updates are supported

### Data Validation
- Meeting number must be positive integer
- Meeting date is required
- At least one attendee is required
- File uploads are validated for type and size

### Performance
- Indexes are created on frequently queried columns
- Pagination is supported for large datasets
- Efficient joins are used for related data

## Troubleshooting

### Common Issues

1. **"Tabulka neexistuje" error**
   - Run `npm run setup:meeting-minutes` to create tables

2. **File upload fails**
   - Check file size (must be under 10MB)
   - Ensure file is PDF, DOC, or DOCX format

3. **Meeting number conflicts**
   - The system automatically generates sequential numbers
   - If conflicts occur, check for duplicate entries

4. **Permission denied**
   - Ensure user has proper role (admin or coach)
   - Check RLS policies are correctly set

### Database Maintenance

- Regularly clean up old, inactive meeting minutes
- Monitor file storage usage for attachments
- Consider archiving old meeting minutes

## Future Enhancements

- Email notifications for new meeting minutes
- Meeting minutes templates
- Export to PDF functionality
- Integration with calendar systems
- Meeting minutes approval workflow
- Advanced reporting and analytics

