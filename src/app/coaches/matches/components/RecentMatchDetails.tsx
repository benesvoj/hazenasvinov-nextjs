'use client';

import React, {useState, useRef} from 'react';
import {Card, CardHeader, CardBody, Button, Textarea, Input} from '@heroui/react';
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {Match} from '@/types';
import Image from 'next/image';
import {LoadingSpinner} from '@/components';

interface RecentMatchDetailsProps {
  selectedMatch: Match;
  onClose: () => void;
}

export default function RecentMatchDetails({selectedMatch, onClose}: RecentMatchDetailsProps) {
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveNotes = () => {
    // TODO: Save notes to database
    console.log('Saving notes:', notes);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setIsEditingNotes(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Obrázek je příliš velký. Maximální velikost je 10MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to Supabase storage
      console.log('Uploading photo for match:', selectedMatch.id, file);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Update match_photo_url in database
      console.log('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Chyba při nahrávání fotografie');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // TODO: Remove photo from database
    console.log('Removing photo for match:', selectedMatch.id);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-semibold truncate">Detail zápasu</h3>
        </div>
        <Button isIconOnly variant="light" size="sm" onPress={onClose} className="flex-shrink-0">
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        <div className="p-3 sm:p-4 space-y-6">
          {/* Match Photo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-base">Fotografie zápisu utkání</h4>
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => fileInputRef.current?.click()}
                  startContent={<PlusIcon className="w-4 h-4" />}
                  isLoading={isUploadingPhoto}
                  className="text-xs"
                >
                  {isUploadingPhoto ? <LoadingSpinner /> : 'Přidat zápis'}
                </Button>
                {(selectedMatch.match_photo_url || photoPreview) && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={handleRemovePhoto}
                    className="text-xs"
                  >
                    Odebrat
                  </Button>
                )}
              </div>
            </div>

            {selectedMatch.match_photo_url || photoPreview ? (
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <Image
                  src={photoPreview || selectedMatch.match_photo_url || ''}
                  alt="Fotografie zápisu utkání"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Žádný zápis utkání není k dispozici</p>
                  <p className="text-xs mt-1">Klikněte na &quot;Přidat zápis&quot; pro nahrání</p>
                </div>
              </div>
            )}
          </div>

          {/* Match Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-base">Statistiky zápasu</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedMatch.home_team?.name || 'Domácí'}
                </h5>
                <div className="space-y-1 text-sm">
                  <p>
                    Góly: <span className="font-semibold">{selectedMatch.home_score}</span>
                  </p>
                  <p>
                    Poločas:{' '}
                    <span className="font-semibold">
                      {selectedMatch.home_score_halftime || '-'}
                    </span>
                  </p>
                  <p>
                    Střely: <span className="font-semibold">-</span>
                  </p>
                  <p>
                    Fauly: <span className="font-semibold">-</span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedMatch.away_team?.name || 'Hosté'}
                </h5>
                <div className="space-y-1 text-sm">
                  <p>
                    Góly: <span className="font-semibold">{selectedMatch.away_score}</span>
                  </p>
                  <p>
                    Poločas:{' '}
                    <span className="font-semibold">
                      {selectedMatch.away_score_halftime || '-'}
                    </span>
                  </p>
                  <p>
                    Střely: <span className="font-semibold">-</span>
                  </p>
                  <p>
                    Fauly: <span className="font-semibold">-</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lineups */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-base">Sestavy</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Home Team Lineup */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedMatch.home_team?.name || 'Domácí tým'}
                </h5>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sestava není k dispozici
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-xs w-full"
                    onPress={() => {
                      // TODO: Open lineup editor for home team
                      console.log('Edit home team lineup for match:', selectedMatch.id);
                    }}
                  >
                    Upravit sestavu
                  </Button>
                </div>
              </div>

              {/* Away Team Lineup */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedMatch.away_team?.name || 'Hostující tým'}
                </h5>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sestava není k dispozici
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-xs w-full"
                    onPress={() => {
                      // TODO: Open lineup editor for away team
                      console.log('Edit away team lineup for match:', selectedMatch.id);
                    }}
                  >
                    Upravit sestavu
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Match Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-base">Poznámky k zápasu</h4>
              </div>
              {!isEditingNotes && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsEditingNotes(true)}
                  className="text-xs"
                >
                  {notes ? 'Upravit' : 'Přidat poznámky'}
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Zadejte poznámky k zápasu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  minRows={4}
                  maxRows={8}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="light" onPress={handleCancelNotes}>
                    Zrušit
                  </Button>
                  <Button size="sm" color="primary" onPress={handleSaveNotes}>
                    Uložit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-h-[100px]">
                {notes ? (
                  <p className="text-sm whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Žádné poznámky nejsou k dispozici. Klikněte na &quot;Přidat poznámky&quot; pro
                    přidání.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
