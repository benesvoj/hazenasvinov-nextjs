import React, {useState, useRef} from 'react';
import {Button, Input} from '@heroui/react';
import {PhotoIcon, TrashIcon, PlusIcon} from '@heroicons/react/24/outline';
import Image from 'next/image';
import {uploadClubAsset, deleteClubAsset, getClubAssetUrl} from '@/utils/supabase/storage';

interface LogoUploadProps {
  value?: string; // Current logo URL
  onChange: (logoUrl: string) => void;
  onPathChange?: (logoPath: string) => void; // Optional path for storage management
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export default function LogoUpload({
  value,
  onChange,
  onPathChange,
  label = 'Logo klubu',
  description,
  className = '',
  disabled = false,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Soubor je příliš velký. Maximální velikost je 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const path = `club-logos/logo-${timestamp}.${extension}`;

      const result = await uploadClubAsset(file, path);

      if (result.error) {
        alert(`Chyba při nahrávání loga: ${result.error}`);
        setPreview(null);
        return;
      }

      // Update parent component
      onChange(result.url);
      if (onPathChange) {
        onPathChange(result.path);
      }
    } catch (error) {
      alert('Chyba při nahrávání loga');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value && onPathChange) {
      // Extract path from URL if it's a storage URL
      const url = new URL(value);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/club-assets\/(.+)/);
      if (pathMatch) {
        const path = pathMatch[1];
        await deleteClubAsset(path);
      }
    }

    onChange('');
    if (onPathChange) {
      onPathChange('');
    }
    setPreview(null);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = preview || value;

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>

      <div className="space-y-3">
        {/* Logo Preview */}
        {displayUrl ? (
          <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
            <Image
              src={displayUrl}
              alt="Logo preview"
              fill
              className="object-contain p-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {!disabled && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                className="absolute top-1 right-1"
                onPress={handleRemove}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <PhotoIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Upload Button */}
        {!disabled && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="light"
              onPress={handleButtonClick}
              isLoading={isUploading}
              startContent={!isUploading ? <PlusIcon className="w-4 h-4" /> : undefined}
            >
              {isUploading ? 'Nahrávám...' : displayUrl ? 'Změnit logo' : 'Nahrát logo'}
            </Button>

            {displayUrl && (
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={handleRemove}
                startContent={<TrashIcon className="w-4 h-4" />}
              >
                Odstranit
              </Button>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
