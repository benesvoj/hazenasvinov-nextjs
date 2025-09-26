import {createClient} from './client';
import {
  PhotoAlbum,
  Photo,
  CreateAlbumData,
  UpdateAlbumData,
  CreatePhotoData,
  UpdatePhotoData,
} from '@/types/features/gallery/photoGallery';

// Album operations
export async function getPhotoAlbums(): Promise<PhotoAlbum[]> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase
      .from('photo_albums')
      .select(
        `
        *,
        photos(count)
      `
      )
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching albums:', error);
      return [];
    }

    return data.map((album: PhotoAlbum & {photos?: {count: number}[]}) => ({
      ...album,
      photo_count: album.photos?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
}

export async function getPhotoAlbum(id: string): Promise<PhotoAlbum | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase.from('photo_albums').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching album:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

export async function createPhotoAlbum(albumData: CreateAlbumData): Promise<PhotoAlbum | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase.from('photo_albums').insert(albumData).select().single();

    if (error) {
      console.error('Error creating album:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating album:', error);
    return null;
  }
}

export async function updatePhotoAlbum(
  id: string,
  albumData: UpdateAlbumData
): Promise<PhotoAlbum | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase
      .from('photo_albums')
      .update(albumData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating album:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating album:', error);
    return null;
  }
}

export async function deletePhotoAlbum(id: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const {error} = await supabase.from('photo_albums').delete().eq('id', id);

    if (error) {
      console.error('Error deleting album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting album:', error);
    return false;
  }
}

// Photo operations
export async function getPhotosByAlbum(albumId: string): Promise<Photo[]> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching photos:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

export async function getPhoto(id: string): Promise<Photo | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase.from('photos').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching photo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching photo:', error);
    return null;
  }
}

export async function createPhoto(photoData: CreatePhotoData): Promise<Photo | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase.from('photos').insert(photoData).select().single();

    if (error) {
      console.error('Error creating photo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating photo:', error);
    return null;
  }
}

export async function updatePhoto(id: string, photoData: UpdatePhotoData): Promise<Photo | null> {
  try {
    const supabase = createClient();

    const {data, error} = await supabase
      .from('photos')
      .update(photoData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating photo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating photo:', error);
    return null;
  }
}

export async function deletePhoto(id: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const {error} = await supabase.from('photos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

export async function reorderPhotos(photoIds: string[]): Promise<boolean> {
  try {
    const supabase = createClient();

    // Update photos one by one to avoid upsert issues
    for (let i = 0; i < photoIds.length; i++) {
      const {error} = await supabase.from('photos').update({sort_order: i}).eq('id', photoIds[i]);

      if (error) {
        console.error(`Error updating photo ${photoIds[i]}:`, error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error reordering photos:', error);
    return false;
  }
}
