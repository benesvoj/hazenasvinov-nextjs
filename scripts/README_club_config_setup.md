# Club Configuration System Setup

This guide explains how to set up the new club configuration system that allows you to manage club settings, logo, and hero image from the admin panel.

## 🎯 **What This System Provides**

- **Club Configuration Management**: Centralized admin interface for club settings
- **Dynamic Hero Section**: Replace static logo with configurable hero image
- **Flexible Content**: Customizable titles, subtitles, and button text
- **Database Storage**: All settings stored securely in Supabase

## 🗄️ **Database Setup**

### Step 1: Run the Database Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `scripts/create_club_config_table.sql`
4. Click **Run** to execute the script

This will create:
- `club_config` table with all necessary fields
- Default configuration data
- Proper permissions and RLS policies

### Step 2: Setup Storage Bucket

1. In the same **SQL Editor**, run the storage setup script:
   ```sql
   -- Copy and paste the content of: scripts/setup_club_storage.sql
   ```

This will create:
- `club-assets` storage bucket for club images
- Proper storage policies for public read access
- Upload permissions for authenticated users

### Step 3: Verify Setup

Run this query to check if everything was created correctly:

```sql
-- Check club config table
SELECT * FROM club_config;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'club-assets';
```

You should see:
- One row in `club_config` with default data
- One row in `storage.buckets` for `club-assets`

## 🎨 **Features Available**

### **Club Information**
- Club name and description
- Founded year (automatically calculates tradition years)
- Club logo URL

### **Hero Section Configuration**
- Hero background image upload (stored in Supabase storage)
- Custom hero title and subtitle
- Configurable button text and link
- Dynamic content loading

### **File Management**
- **Club Logo**: Upload PNG/JPG files (max 5MB)
- **Hero Image**: Upload high-quality images (recommended: 1920x1080px)
- **Automatic Storage**: Files stored in `club-assets` bucket
- **Cleanup**: Old files automatically deleted when replaced

### **Contact Information**
- Email and phone
- Physical address
- Social media links (Facebook, Instagram)
- Website URL

## 🚀 **How to Use**

### **1. Access Club Configuration**
- Go to **Admin Panel** → **Konfigurace klubu**
- You'll see all current settings in read-only mode

### **2. Edit Configuration**
- Click **"Upravit konfiguraci"** button
- Modify any fields you want to change
- Click **"Uložit změny"** to save

### **3. Add Images**
- **Club Logo**: 
  - Click "Upravit konfiguraci"
  - Use file input to upload PNG/JPG logo
  - File automatically stored in Supabase storage
- **Hero Image**: 
  - Use file input to upload high-quality image
  - Recommended size: 1920x1080px or larger
  - File automatically stored and optimized
- **Automatic Management**: Old files are cleaned up when replaced

## 🖼️ **Image Recommendations**

### **Hero Image**
- **Size**: 1920x1080px or larger
- **Format**: JPG or PNG
- **Content**: Club activities, team photos, or sports action
- **Style**: High contrast for text readability

### **Club Logo**
- **Size**: 200x200px or larger
- **Format**: PNG with transparent background
- **Style**: Clean, recognizable design

## 🔧 **Technical Details**

### **Files Created/Modified**
- `scripts/create_club_config_table.sql` - Database schema
- `src/types/types.ts` - TypeScript interfaces
- `src/hooks/useClubConfig.ts` - Data management hook
- `src/app/api/club-config/route.ts` - API endpoints
- `src/app/admin/club-config/page.tsx` - Admin interface
- `src/app/(main)/page.tsx` - Updated landing page
- `src/routes/routes.ts` - Added admin route
- `src/app/admin/components/Sidebar.tsx` - Added navigation

### **API Endpoints**
- `GET /api/club-config` - Fetch current configuration
- `PUT /api/club-config` - Update configuration

### **Database Table Structure**
```sql
club_config (
  id, club_name, club_logo_url, hero_image_url,
  hero_title, hero_subtitle, hero_button_text, hero_button_link,
  contact_email, contact_phone, address,
  facebook_url, instagram_url, website_url,
  founded_year, description, is_active,
  created_at, updated_at
)
```

## 🎉 **Result**

After setup, your landing page will:
- ✅ **Display dynamic hero image** instead of static logo
- ✅ **Show customizable content** (title, subtitle, button)
- ✅ **Use club logo** from configuration
- ✅ **Calculate tradition years** automatically
- ✅ **Load all content** from database

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Table doesn't exist" error**
   - Make sure you ran the database script
   - Check if you're in the correct Supabase project

2. **Images not loading**
   - Verify image URLs are accessible
   - Check if images are properly uploaded
   - Ensure URLs start with `http://` or `https://`

3. **Changes not appearing**
   - Refresh the page after saving
   - Check browser console for errors
   - Verify database permissions

### **Need Help?**
- Check browser console for error messages
- Verify database connection in Supabase
- Ensure all files are properly saved and built

## 🔄 **Next Steps**

After setup, you can:
1. **Customize hero content** with your own text and images
2. **Add social media links** for better engagement
3. **Update contact information** for visitors
4. **Modify club description** to match your current focus

Your club website will now have a professional, dynamic hero section that you can easily update from the admin panel! 🎯
