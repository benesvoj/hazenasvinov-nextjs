'use client';

import React, {useState, useMemo, useEffect, useRef} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Spinner,
  Image,
  Pagination,
} from '@heroui/react';
import {Video} from '@/types';
import {useVideos} from '@/hooks';
import {formatDateString} from '@/helpers';
import {MinusIcon, PlusIcon} from '@heroicons/react/24/outline';

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videos: Video[]) => void;
  selectedVideoIds?: string[];
  categoryId?: string;
  opponentClubId?: string; // For filtering videos by opponent club
}

export default function VideoSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedVideoIds = [],
  categoryId,
  opponentClubId,
}: VideoSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);

  const statusFilterOptions = [
    {key: 'active', label: 'Aktivní'},
    {key: 'inactive', label: 'Neaktivní'},
    {key: 'all', label: 'Všechny'},
  ];

  // Fetch videos with filters and pagination
  const {
    videos,
    loading,
    error,
    fetchVideos,
    currentPage: hookCurrentPage,
    totalPages,
    totalCount,
    itemsPerPage,
  } = useVideos({itemsPerPage: 10});

  // Use ref to store fetchVideos to avoid dependency issues
  const fetchVideosRef = useRef(fetchVideos);
  fetchVideosRef.current = fetchVideos;

  // Initialize selected videos when modal opens
  useEffect(() => {
    if (isOpen && selectedVideoIds.length > 0) {
      // Find videos that match the selected IDs from the current videos list
      const matchingVideos = videos.filter((video) => selectedVideoIds.includes(video.id));
      setSelectedVideos(matchingVideos);
    } else if (isOpen) {
      setSelectedVideos([]);
    }
  }, [isOpen, selectedVideoIds, videos]);

  // Fetch videos when modal opens or filters change
  useEffect(() => {
    if (isOpen && categoryId) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchVideosRef.current(
          {
            category_id: categoryId,
            club_id: opponentClubId, // Filter by opponent club
            is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
            search: searchTerm || undefined,
          },
          currentPage
        );
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, categoryId, statusFilter, searchTerm, currentPage, opponentClubId]);

  // Filter videos based on search and status
  const filteredVideos = useMemo(() => {
    try {
      return videos.filter((video: Video) => {
        // Ensure video has required data
        if (!video || !video.title) {
          return false;
        }

        const matchesSearch =
          !searchTerm ||
          video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && video.is_active) ||
          (statusFilter === 'inactive' && !video.is_active);

        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering videos:', error);
      return [];
    }
  }, [videos, searchTerm, statusFilter]);

  // Don't render if no categoryId is provided
  if (!categoryId) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">Vyberte video</h2>
          </ModalHeader>
          <ModalBody>
            <div className="text-center py-8 text-gray-500">Nejdříve vyberte kategorii zápasu</div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const handleToggleVideo = (video: Video) => {
    const isSelected = selectedVideos.some((v) => v.id === video.id);
    let newSelectedVideos: Video[];

    if (isSelected) {
      // Remove video from selection
      newSelectedVideos = selectedVideos.filter((v) => v.id !== video.id);
    } else {
      // Add video to selection
      newSelectedVideos = [...selectedVideos, video];
    }

    setSelectedVideos(newSelectedVideos);
    onSelect(newSelectedVideos);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">
              Vyberte videa ({selectedVideos.length} vybráno)
            </h2>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Hledat videa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              aria-label="Hledat videa"
            />
            <Select
              placeholder="Stav videa"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-48"
              aria-label="Stav videa"
            >
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Videos Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error || 'Chyba při načítání videí'}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Žádná videa nenalezena</div>
          ) : (
            <Table aria-label="Videos table">
              <TableHeader>
                <TableColumn>Náhled</TableColumn>
                <TableColumn>Název</TableColumn>
                <TableColumn>Odehráno</TableColumn>
                <TableColumn>Akce</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredVideos
                  .filter((video) => video && video.id) // Filter out invalid videos
                  .map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        {video.thumbnail_url ? (
                          <Image
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">N/A</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium max-w-xs truncate">{video.title}</div>
                          {video.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {video.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.recording_date ? formatDateString(video.recording_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-label={
                            selectedVideos.some((v) => v.id === video.id)
                              ? 'Odznačit video'
                              : 'Vybrat video'
                          }
                          size="sm"
                          color={
                            selectedVideos.some((v) => v.id === video.id) ? 'success' : 'primary'
                          }
                          variant={
                            selectedVideos.some((v) => v.id === video.id) ? 'solid' : 'bordered'
                          }
                          onPress={() => handleToggleVideo(video)}
                          isIconOnly
                          radius="full"
                          startContent={
                            selectedVideos.some((v) => v.id === video.id) ? (
                              <MinusIcon className="w-4 h-4" />
                            ) : (
                              <PlusIcon className="w-4 h-4" />
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Stránka {currentPage} z {totalPages} • {totalCount} videí celkem
              </div>
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
                size="sm"
                classNames={{
                  wrapper: 'gap-0 overflow-visible h-8 rounded border border-divider',
                  item: 'w-8 h-8 text-small rounded-none bg-transparent',
                  cursor:
                    'bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-500 dark:to-default-600 text-white font-bold',
                }}
              />
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedVideos.length} videí vybráno
          </div>
          <div className="flex gap-2">
            <Button variant="light" onPress={onClose}>
              Zavřít
            </Button>
            <Button color="primary" onPress={onClose}>
              Potvrdit výběr
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
