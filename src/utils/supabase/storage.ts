import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// Storage bucket name for team logos
const TEAM_LOGOS_BUCKET = 'team-logos';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a team logo to Supabase Storage
 */
export async function uploadTeamLogo(
  teamId: string, 
  file: File
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
      };
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Please upload an image smaller than 2MB.'
      };
    }

    // Generate file name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${teamId}-${timestamp}.${fileExtension}`;

    // Delete existing logo first (if any)
    await deleteTeamLogo(teamId);

    // Upload new file
    const { data, error } = await supabase.storage
      .from(TEAM_LOGOS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: 'Failed to upload image to storage.'
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(TEAM_LOGOS_BUCKET)
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL.'
      };
    }

    // Update team record with new logo URL
    const { error: updateError } = await supabase
      .from('teams')
      .update({ logo_url: publicUrlData.publicUrl })
      .eq('id', teamId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Clean up uploaded file if database update fails
      await supabase.storage
        .from(TEAM_LOGOS_BUCKET)
        .remove([fileName]);
      
      return {
        success: false,
        error: 'Failed to update team record.'
      };
    }

    return {
      success: true,
      url: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during upload.'
    };
  }
}

/**
 * Delete a team logo from storage
 */
export async function deleteTeamLogo(teamId: string): Promise<boolean> {
  try {
    // Get current logo URL from database
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('logo_url')
      .eq('id', teamId)
      .single();

    if (fetchError || !team?.logo_url) {
      return true; // No logo to delete
    }

    // Extract file name from URL
    const fileName = extractFileNameFromUrl(team.logo_url);
    if (!fileName) {
      return true; // Not a storage URL
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(TEAM_LOGOS_BUCKET)
      .remove([fileName]);

    if (deleteError) {
      console.error('Storage deletion error:', deleteError);
    }

    // Remove URL from database
    const { error: updateError } = await supabase
      .from('teams')
      .update({ logo_url: null })
      .eq('id', teamId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Extract file name from Supabase storage URL
 */
function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    
    // Look for the team-logos bucket in the path
    const bucketIndex = pathSegments.findIndex(segment => segment === TEAM_LOGOS_BUCKET);
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments[bucketIndex + 1];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the storage bucket URL for creating new buckets
 */
export function getStorageBucketInfo() {
  return {
    bucketName: TEAM_LOGOS_BUCKET,
    bucketId: TEAM_LOGOS_BUCKET,
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    fileSizeLimit: 2097152 // 2MB
  };
}

/**
 * Initialize storage bucket (call this once in setup)
 */
export async function initializeStorageBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === TEAM_LOGOS_BUCKET);
    
    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(TEAM_LOGOS_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('Team logos bucket created successfully');
    }

    return true;
  } catch (error) {
    console.error('Bucket initialization error:', error);
    return false;
  }
}
