-- Update album cover photos functionality
-- This script adds functions to automatically manage album cover photos

-- Function to set the first photo as cover photo for an album
CREATE OR REPLACE FUNCTION set_album_cover_photo(album_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE photo_albums 
    SET cover_photo_url = (
        SELECT file_url 
        FROM photos 
        WHERE album_id = album_uuid 
        ORDER BY sort_order ASC, created_at ASC 
        LIMIT 1
    )
    WHERE id = album_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update cover photo when photos are added/removed
CREATE OR REPLACE FUNCTION update_album_cover_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new photo, check if it should be the cover
    IF TG_OP = 'INSERT' THEN
        -- If album has no cover photo, set this one as cover
        IF NOT EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE id = NEW.album_id AND cover_photo_url IS NOT NULL
        ) THEN
            UPDATE photo_albums 
            SET cover_photo_url = NEW.file_url 
            WHERE id = NEW.album_id;
        END IF;
    END IF;
    
    -- If this is a delete operation, check if we need to update cover
    IF TG_OP = 'DELETE' THEN
        -- If the deleted photo was the cover photo, set a new one
        IF EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE id = OLD.album_id AND cover_photo_url = OLD.file_url
        ) THEN
            PERFORM set_album_cover_photo(OLD.album_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage cover photos
DROP TRIGGER IF EXISTS trigger_update_album_cover_photo ON photos;
CREATE TRIGGER trigger_update_album_cover_photo
    AFTER INSERT OR DELETE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_album_cover_photo();

-- Update existing albums to have cover photos
UPDATE photo_albums 
SET cover_photo_url = (
    SELECT file_url 
    FROM photos 
    WHERE album_id = photo_albums.id 
    ORDER BY sort_order ASC, created_at ASC 
    LIMIT 1
)
WHERE cover_photo_url IS NULL 
AND EXISTS (SELECT 1 FROM photos WHERE album_id = photo_albums.id);
