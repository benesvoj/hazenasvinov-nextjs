# Supabase Storage Setup for Team Logos

## Quick Fix for "Unauthorized" Error

The 403 error you're seeing is due to missing RLS (Row Level Security) policies for the storage bucket. Here are two ways to fix this:

## Option 1: Manual Setup via Dashboard (Recommended)

### Step 1: Create Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Fill in the details:
   - **Name**: `team-logos`
   - **Public bucket**: ✅ **Yes** (this allows public read access)
   - **File size limit**: `2097152` (2MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

### Step 2: Set Up RLS Policies
1. Still in Storage, click on the **"team-logos"** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Create these 4 policies:

#### Policy 1: Public Read Access
- **Policy name**: `Public read access for team logos`
- **Allowed operation**: `SELECT`
- **Policy definition**: `true` (allows everyone to read)

#### Policy 2: Authenticated Upload
- **Policy name**: `Authenticated users can upload team logos`
- **Allowed operation**: `INSERT`
- **Policy definition**: `auth.role() = 'authenticated'`

#### Policy 3: Authenticated Update
- **Policy name**: `Authenticated users can update team logos`
- **Allowed operation**: `UPDATE`
- **Policy definition**: `auth.role() = 'authenticated'`

#### Policy 4: Authenticated Delete
- **Policy name**: `Authenticated users can delete team logos`
- **Allowed operation**: `DELETE`
- **Policy definition**: `auth.role() = 'authenticated'`

## Option 2: SQL Script (Alternative)

If you prefer using SQL, run the `setup-storage-policies.sql` file in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy the contents of `setup-storage-policies.sql`
3. Paste and run the script

## Verification

After setup, you should be able to:
- ✅ Upload team logos through the admin interface
- ✅ View team logos on the frontend
- ✅ Delete team logos through the admin interface

## Troubleshooting

If you still get errors:

1. **Check Authentication**: Make sure you're logged in when uploading
2. **Check Bucket Name**: Ensure the bucket is named exactly `team-logos`
3. **Check File Size**: Ensure files are under 2MB
4. **Check File Type**: Only JPEG, PNG, WebP are allowed

## Security Notes

- **Public Read**: Team logos are publicly readable (needed for displaying on website)
- **Authenticated Write**: Only logged-in users can upload/modify logos
- **File Validation**: Built-in validation for file size and type
- **Auto Cleanup**: Old logos are automatically deleted when new ones are uploaded
