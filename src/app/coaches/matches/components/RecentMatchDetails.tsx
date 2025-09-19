'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Card, CardHeader, CardBody, Button, Textarea, Input} from '@heroui/react';
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  UserGroupIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import {
  Match,
  MatchMetadata,
  isPhotoMetadata,
  isNoteMetadata,
  isLineupMetadata,
  isDocumentMetadata,
} from '@/types';
import Image from 'next/image';
import {LoadingSpinner, showToast} from '@/components';
import {
  useMatchMetadata,
  useAddMatchMetadata,
  useDeleteMatchMetadata,
  useSetPrimaryMatchMetadata,
} from '@/hooks/useMatchMetadata';

interface RecentMatchDetailsProps {
  selectedMatch: Match;
  onClose: () => void;
}

export default function RecentMatchDetails({selectedMatch, onClose}: RecentMatchDetailsProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch metadata using the new hooks
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useMatchMetadata(selectedMatch.id, 'photo');
  const {
    data: notes = [],
    isLoading: notesLoading,
    error: notesError,
  } = useMatchMetadata(selectedMatch.id, 'note');
  const {
    data: lineups = [],
    isLoading: lineupsLoading,
    error: lineupsError,
  } = useMatchMetadata(selectedMatch.id, 'lineup');
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = useMatchMetadata(selectedMatch.id, 'document');

  // Debug: Log photos data
  useEffect(() => {
    if (photos.length > 0) {
      // Photos loaded successfully
    }
  }, [photos]);

  // Helper function to get safe image URL
  const getSafeImageUrl = (fileUrl: string | undefined | null, metadata?: any): string => {
    if (!fileUrl) {
      // Check if we have a temporary preview in metadata
      if (metadata?.temp_preview) {
        return metadata.temp_preview;
      }
      return '/placeholder-image.jpg';
    }
    if (fileUrl.includes('example.com')) return '/placeholder-image.jpg';
    if (!fileUrl.startsWith('http')) return '/placeholder-image.jpg';
    return fileUrl;
  };

  // Get primary items
  const primaryPhoto = photos.find((photo) => photo.is_primary && isPhotoMetadata(photo));
  const primaryNote = notes.find((note) => note.is_primary && isNoteMetadata(note));
  const primaryLineup = lineups.find((lineup) => lineup.is_primary && isLineupMetadata(lineup));
  const primaryDocument = documents.find((doc) => doc.is_primary && isDocumentMetadata(doc));

  // Mutations
  const addMetadata = useAddMatchMetadata();
  const deleteMetadata = useDeleteMatchMetadata();
  const setPrimaryMetadata = useSetPrimaryMatchMetadata();

  // Local state for editing
  const [editingNote, setEditingNote] = useState(primaryNote?.content || '');

  // Update editing note when primary note changes
  useEffect(() => {
    setEditingNote(primaryNote?.content || '');
  }, [primaryNote?.content]);

  const handleSaveNotes = async () => {
    try {
      if (primaryNote) {
        // Update existing note
        await addMetadata.mutateAsync({
          match_id: selectedMatch.id,
          metadata_type: 'note',
          content: editingNote,
          is_primary: true,
        });
      } else {
        // Create new note
        await addMetadata.mutateAsync({
          match_id: selectedMatch.id,
          metadata_type: 'note',
          content: editingNote,
          is_primary: true,
        });
      }
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleCancelNotes = () => {
    setEditingNote(primaryNote?.content || '');
    setIsEditingNotes(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.danger('Prosím vyberte obrázek');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.danger('Obrázek je příliš velký. Maximální velikost je 10MB');
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

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, just add metadata without file_url (will be uploaded later)
      await addMetadata.mutateAsync({
        match_id: selectedMatch.id,
        metadata_type: 'photo',
        file_url: undefined, // Will be set after actual upload
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_primary: photos.length === 0, // First photo is primary
        metadata: {
          width: 0, // TODO: Get actual dimensions
          height: 0,
          taken_at: new Date().toISOString(),
          temp_preview: URL.createObjectURL(file), // Store preview locally only
        },
      });

      // Photo metadata added successfully
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast.danger('Chyba při nahrávání fotografie');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (primaryPhoto) {
      try {
        await deleteMetadata.mutateAsync(primaryPhoto.id);
        setPhotoPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error removing photo:', error);
        showToast.danger('Chyba při odstraňování fotografie');
      }
    } else {
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          {/* Match Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-base">
                  Fotografie zápisu utkání
                  {photos.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({photos.length})
                    </span>
                  )}
                </h4>
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
                  variant="flat"
                  color="primary"
                  onPress={() => fileInputRef.current?.click()}
                  startContent={<PlusIcon className="w-4 h-4" />}
                  isLoading={isUploadingPhoto}
                  className="text-xs"
                >
                  {isUploadingPhoto ? 'Nahrávání...' : 'Přidat fotku'}
                </Button>
              </div>
            </div>

            {photosLoading ? (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : photosError ? (
              <div className="w-full h-48 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800">
                <div className="text-center text-red-600 dark:text-red-400">
                  <PhotoIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Chyba při načítání fotek</p>
                  <p className="text-xs mt-1">Zkuste to prosím znovu</p>
                </div>
              </div>
            ) : photos.length > 0 ? (
              <div className="space-y-3">
                {/* Primary Photo Display */}
                {primaryPhoto && (
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={getSafeImageUrl(primaryPhoto.file_url, primaryPhoto.metadata)}
                      alt={primaryPhoto.file_name || 'Fotografie zápisu utkání'}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Hlavní
                      </span>
                    </div>
                  </div>
                )}

                {/* Photo Gallery */}
                {photos.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos
                      .filter((photo) => !photo.is_primary)
                      .slice(0, 6)
                      .map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group"
                        >
                          <Image
                            src={getSafeImageUrl(photo.file_url, photo.metadata)}
                            alt={photo.file_name || 'Fotografie'}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                              <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={() =>
                                  setPrimaryMetadata.mutate({
                                    id: photo.id,
                                    matchId: selectedMatch.id,
                                    type: 'photo',
                                  })
                                }
                                className="text-xs"
                              >
                                Hlavní
                              </Button>
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => deleteMetadata.mutate(photo.id)}
                                className="text-xs"
                              >
                                Smazat
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {photos.length > 7 && (
                      <div className="aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{photos.length - 7}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Žádné fotografie nejsou k dispozici</p>
                  <p className="text-xs mt-1">Klikněte na &quot;Přidat fotku&quot; pro nahrání</p>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-base">
                  Sestavy
                  {lineups.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({lineups.length})
                    </span>
                  )}
                </h4>
              </div>
              <Button
                size="sm"
                variant="light"
                onPress={() => {
                  // TODO: Open lineup editor
                }}
                className="text-xs"
              >
                Upravit sestavy
              </Button>
            </div>

            {lineupsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-32">
                  <LoadingSpinner />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-32">
                  <LoadingSpinner />
                </div>
              </div>
            ) : lineupsError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center justify-center h-32 border border-red-200 dark:border-red-800">
                <div className="text-center text-red-600 dark:text-red-400">
                  <UserGroupIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Chyba při načítání sestav</p>
                  <p className="text-xs mt-1">Zkuste to prosím znovu</p>
                </div>
              </div>
            ) : lineups.length > 0 ? (
              <div className="space-y-4">
                {lineups.map((lineup) => (
                  <div key={lineup.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                          {lineup.metadata?.formation || 'Sestava'}
                        </h5>
                        {lineup.is_primary && (
                          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            Hlavní
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!lineup.is_primary && (
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() =>
                              setPrimaryMetadata.mutate({
                                id: lineup.id,
                                matchId: selectedMatch.id,
                                type: 'lineup',
                              })
                            }
                            className="text-xs"
                          >
                            Hlavní
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => deleteMetadata.mutate(lineup.id)}
                          className="text-xs"
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>

                    {lineup.metadata?.players ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {lineup.metadata.players.slice(0, 6).map((player: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded"
                            >
                              <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-semibold">
                                {player.jersey_number}
                              </span>
                              <span className="truncate">{player.name}</span>
                            </div>
                          ))}
                        </div>
                        {lineup.metadata.players.length > 6 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{lineup.metadata.players.length - 6} dalších hráčů
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Detailní sestava není k dispozici
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
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
                      }}
                    >
                      Upravit sestavu
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Match Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-base">
                  Dokumenty a zprávy
                  {documents.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({documents.length})
                    </span>
                  )}
                </h4>
              </div>
              <Button
                size="sm"
                variant="light"
                onPress={() => {
                  // TODO: Open document uploader
                }}
                className="text-xs"
              >
                Přidat dokument
              </Button>
            </div>

            {documentsLoading ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : documentsError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center justify-center h-32 border border-red-200 dark:border-red-800">
                <div className="text-center text-red-600 dark:text-red-400">
                  <DocumentIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Chyba při načítání dokumentů</p>
                  <p className="text-xs mt-1">Zkuste to prosím znovu</p>
                </div>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DocumentIcon className="w-4 h-4 text-indigo-600" />
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                            {document.file_name}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {document.mime_type} •{' '}
                            {document.file_size
                              ? `${Math.round(document.file_size / 1024)} KB`
                              : 'Neznámá velikost'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {document.is_primary && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                            Hlavní
                          </span>
                        )}
                        {!document.is_primary && (
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() =>
                              setPrimaryMetadata.mutate({
                                id: document.id,
                                matchId: selectedMatch.id,
                                type: 'document',
                              })
                            }
                            className="text-xs"
                          >
                            Hlavní
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => window.open(document.file_url, '_blank')}
                          className="text-xs"
                        >
                          Otevřít
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => deleteMetadata.mutate(document.id)}
                          className="text-xs"
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                    {document.metadata?.document_type && (
                      <div className="flex gap-2">
                        <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                          {document.metadata.document_type === 'report' && 'Zpráva'}
                          {document.metadata.document_type === 'statistics' && 'Statistiky'}
                          {document.metadata.document_type === 'analysis' && 'Analýza'}
                        </span>
                        {document.metadata.pages && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                            {document.metadata.pages} stránek
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-32">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <DocumentIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Žádné dokumenty nejsou k dispozici</p>
                  <p className="text-xs mt-1">
                    Klikněte na &quot;Přidat dokument&quot; pro nahrání
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Match Notes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-base">
                  Poznámky k zápasu
                  {notes.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({notes.length})
                    </span>
                  )}
                </h4>
              </div>
              {!isEditingNotes && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsEditingNotes(true)}
                  className="text-xs"
                >
                  Přidat poznámku
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Zadejte poznámky k zápasu..."
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  minRows={4}
                  maxRows={8}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="light" onPress={handleCancelNotes}>
                    Zrušit
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleSaveNotes}
                    isLoading={addMetadata.isPending}
                  >
                    Uložit
                  </Button>
                </div>
              </div>
            ) : notesLoading ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-h-[100px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : notesError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg min-h-[100px] flex items-center justify-center border border-red-200 dark:border-red-800">
                <div className="text-center text-red-600 dark:text-red-400">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Chyba při načítání poznámek</p>
                  <p className="text-xs mt-1">Zkuste to prosím znovu</p>
                </div>
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(note.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                        {note.is_primary && (
                          <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
                            Hlavní
                          </span>
                        )}
                        {note.metadata?.note_type && (
                          <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                            {note.metadata.note_type === 'tactical' && 'Taktické'}
                            {note.metadata.note_type === 'post_match' && 'Po zápase'}
                            {note.metadata.note_type === 'pre_match' && 'Před zápasem'}
                            {note.metadata.note_type === 'general' && 'Obecné'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!note.is_primary && (
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() =>
                              setPrimaryMetadata.mutate({
                                id: note.id,
                                matchId: selectedMatch.id,
                                type: 'note',
                              })
                            }
                            className="text-xs"
                          >
                            Hlavní
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => deleteMetadata.mutate(note.id)}
                          className="text-xs"
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-h-[100px] flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Žádné poznámky nejsou k dispozici</p>
                  <p className="text-xs mt-1">
                    Klikněte na &quot;Přidat poznámku&quot; pro přidání
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
