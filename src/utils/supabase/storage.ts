import { createClient } from './client';

const BUCKET_NAME = 'club-assets';

export interface UploadResult {
  path: string;
  url: string;
  error?: string;
}

export async function uploadClubAsset(
  file: File, 
  path: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { path: '', url: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      path: '', 
      url: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

export async function deleteClubAsset(path: string): Promise<{ error?: string }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Delete failed:', error);
    return { 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

export function getClubAssetUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export async function listClubAssets(): Promise<string[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data.map((item: { name: string }) => item.name);
  } catch (error) {
    console.error('List failed:', error);
    return [];
  }
}
