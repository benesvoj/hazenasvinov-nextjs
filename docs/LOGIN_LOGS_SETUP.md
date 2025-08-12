# Login Logs System Setup

This document explains how to set up the login logs system for tracking user authentication in the admin panel.

## Overview

The login logs system provides administrators with visibility into:
- User login attempts (successful and failed)
- Login timestamps
- IP addresses
- User agents (browser/device information)
- Authentication status

## Database Setup

### 1. Create the Login Logs Table

**Option A: Simple Setup (Recommended for first-time setup)**
Run the SQL script `scripts/create_login_logs_table_simple.sql` in your Supabase SQL editor. This version:
- Creates the table without foreign key constraints initially
- Uses simpler data types (TEXT instead of INET for IP addresses)
- Avoids potential foreign key issues

**Option B: Full Setup with Foreign Keys**
Run the SQL script `scripts/create_login_logs_table.sql` in your Supabase SQL editor. This version:
- Includes foreign key constraints to auth.users
- Uses proper data types (INET for IP addresses)
- Requires existing users in the auth.users table

### 2. Troubleshooting Common Issues

If you encounter foreign key constraint errors:

1. **Run the troubleshooting script**: Execute `scripts/troubleshoot_login_logs.sql` to diagnose issues
2. **Check existing users**: Verify what user IDs exist in your auth.users table
3. **Use the simple setup**: Start with the simple version and add constraints later

**Common Error**: `insert or update on table "login_logs" violates foreign key constraint`
**Solution**: Use the simple setup script that doesn't include foreign key constraints initially

### 3. Table Structure

The `login_logs` table contains:

- `id`: Unique identifier (UUID)
- `user_id`: Reference to auth.users (nullable for failed attempts)
- `email`: User's email address
- `login_time`: Timestamp of login attempt
- `ip_address`: IP address of the user
- `user_agent`: Browser/device information
- `status`: Login status ('success', 'failed', 'pending')
- `session_id`: Session identifier (optional)
- `created_at`: Record creation timestamp

### 4. Security Policies

The table uses Row Level Security (RLS) with policies that:
- Allow authenticated users (admins) to read all logs
- Allow authenticated users to insert new log entries
- Prevent unauthorized access

## API Endpoints

### GET /api/get-users

**Parameters:**
- `includeLogs=true` - Returns both users and login logs
- No parameters - Returns only users

**Response with logs:**
```json
{
  "users": [...],
  "loginLogs": [...]
}
```

## Frontend Components

### 1. UsersTab Component
- Displays user management interface
- Allows adding new users
- Shows user creation/update timestamps

### 2. LoginLogsTab Component
- Displays login history in a table format
- Shows user avatars, email, login time, IP, user agent, and status
- Includes status badges (success/failed/pending)
- Truncates long user agent strings for better display

## Usage

### Viewing Login Logs

1. Navigate to Admin → Users
2. Click on the "Historie přihlášení" tab
3. View the list of login attempts with timestamps

### Features

- **Real-time Data**: Shows actual login attempts from the database
- **Status Indicators**: Color-coded badges for different login statuses
- **Detailed Information**: IP addresses, user agents, and timestamps
- **Responsive Design**: Works on both desktop and mobile devices

## Automatic Login Logging

The system now automatically logs all login attempts in real-time:

### **What Gets Logged:**

1. **Successful Logins**: When users successfully authenticate
2. **Failed Logins**: When login attempts fail (with specific error reasons)
3. **Logouts**: When users sign out of the system
4. **Auth State Changes**: When authentication state changes (e.g., session refresh)

### **Logging Triggers:**

- **Login Page**: All login attempts (successful and failed)
- **Auth Hook**: Successful logins via auth state changes
- **TopBar**: User logout actions
- **API Endpoint**: Server-side logging with IP address capture

### **Information Captured:**

- **Email**: User's email address
- **Status**: 'success' or 'failed'
- **IP Address**: User's IP address (captured server-side)
- **User Agent**: Browser/device information
- **Timestamp**: Exact time of the attempt
- **Reason**: Specific reason for failure (if applicable)

### **Error Reasons Logged:**

- `Invalid credentials` - Wrong email/password
- `Email not confirmed` - Email verification required
- `Too many requests` - Rate limiting
- `User logged out` - Manual logout
- `Unexpected error` - System errors

## Setup Instructions

### Step-by-Step Setup

1. **Go to your Supabase project dashboard**
2. **Open the SQL Editor**
3. **Run the simple setup script first**:
   ```sql
   -- Copy and paste the contents of scripts/create_login_logs_table_simple.sql
   ```
4. **Test the system** by navigating to Admin → Users → Historie přihlášení
5. **Add foreign key constraints later** (optional) after you have users in your system

### Adding Foreign Key Constraints Later

After you have users in your system and want to add proper foreign key relationships:

```sql
-- Add foreign key constraint
ALTER TABLE login_logs ADD CONSTRAINT login_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing logs to reference real users
UPDATE login_logs 
SET user_id = (SELECT id FROM auth.users WHERE email = login_logs.email LIMIT 1)
WHERE user_id IS NULL AND email IN (SELECT email FROM auth.users);
```

## Future Enhancements

### 1. Automatic Logging
To automatically log successful logins, you can:

- Modify the login page to call the `log_successful_login` function
- Use Supabase triggers to automatically log authentication events
- Implement middleware to capture login attempts

### 2. Advanced Filtering
Add filters for:
- Date ranges
- User-specific logs
- Status filtering
- IP address ranges

### 3. Export Functionality
Add ability to:
- Export logs to CSV
- Generate reports
- Archive old logs

### 4. Real-time Updates
Implement WebSocket connections for:
- Live login monitoring
- Instant notifications of failed attempts
- Real-time dashboard updates

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Error**: Use the simple setup script initially
2. **No logs appearing**: Check if the `login_logs` table exists and has data
3. **Permission errors**: Verify RLS policies are correctly configured
4. **Empty results**: Ensure the API endpoint is working correctly

### Debug Steps

1. **Run the troubleshooting script**: `scripts/troubleshoot_login_logs.sql`
2. Check Supabase logs for API errors
3. Verify table permissions in Supabase dashboard
4. Test API endpoint directly with Postman or similar tool
5. Check browser console for frontend errors

### Quick Fix for Foreign Key Issues

If you're getting foreign key constraint errors:

```sql
-- Remove the problematic constraint
ALTER TABLE login_logs DROP CONSTRAINT IF EXISTS login_logs_user_id_fkey;

-- Recreate the table without constraints
DROP TABLE IF EXISTS login_logs CASCADE;
-- Then run the simple setup script again
```

## Security Considerations

- Login logs contain sensitive information (IP addresses, user agents)
- Access is restricted to authenticated users only
- Consider implementing log retention policies
- Monitor for unusual login patterns
- Implement rate limiting for failed login attempts

## Performance Notes

- The system limits results to 100 most recent entries
- Indexes are created on frequently queried columns
- Consider implementing pagination for large datasets
- Archive old logs to maintain performance
