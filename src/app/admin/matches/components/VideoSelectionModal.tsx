'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';

import {
  Button,
  Image,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {MinusIcon, PlusIcon} from '@heroicons/react/24/outline';

import {UnifiedModal} from '@/components';
import {formatDateString} from '@/helpers';
import {useFetchVideos, useVideoFiltering} from '@/hooks';
import {Video} from '@/types';

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videos: Video[]) => void;
  selectedVideoIds?: string[];
  categoryId?: string;
  opponentClubId?: string; // For filtering video by opponent club
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
  const itemsPerPage = 20;

  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);

  const statusFilterOptions = [
    {key: 'active', label: 'Aktivní'},
    {key: 'inactive', label: 'Neaktivní'},
    {key: 'all', label: 'Všechny'},
  ];

  const {data: videos, loading, error, refetch: fetchVideos} = useFetchVideos();

  const {filters, setFilters, paginatedVideos, totalPages, totalCount} = useVideoFiltering({
    videos,
    itemsPerPage,
    currentPage,
  });

  // Use ref to store fetchVideos to avoid dependency issues
  const fetchVideosRef = useRef(fetchVideos);
  fetchVideosRef.current = fetchVideos;

  // Initialize selected video when modal opens
  useEffect(() => {
    if (isOpen && selectedVideoIds.length > 0) {
      // Find video that match the selected IDs from the current video list
      const matchingVideos = videos.filter((video) => selectedVideoIds.includes(video.id));
      setSelectedVideos(matchingVideos);
    } else if (isOpen) {
      setSelectedVideos([]);
    }
  }, [isOpen, selectedVideoIds, videos]);

  // Fetch video when modal opens or filters change
  useEffect(() => {
    if (isOpen && categoryId) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        // TODO: Adjust fetchVideos to accept filters
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, categoryId, statusFilter, searchTerm, currentPage, opponentClubId]);

  // Filter video based on search and status
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
      console.error('Error filtering video:', error);
      return [];
    }
  }, [videos, searchTerm, statusFilter]);

  // Don't render if no categoryId is provided
  if (!categoryId) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={'Vyberte video'}
        size="5xl"
        scrollBehavior="inside"
        footer={
          <Button variant="light" onPress={onClose}>
            Zavřít
          </Button>
        }
      >
        <div className="text-center py-8 text-gray-500">Nejdříve vyberte kategorii zápasu</div>
      </UnifiedModal>
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

  const footer = (
    <div className="flex items-center justify-between">
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
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vyberte videa (${selectedVideos.length} vybráno)`}
      size="5xl"
      scrollBehavior="inside"
      footer={footer}
    >
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
        <div className="text-center py-8 text-red-500">{error || 'Chyba při načítání videí'}</div>
      ) : paginatedVideos.length === 0 ? (
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
            {paginatedVideos
              .filter((video) => video && video.id) // Filter out invalid video
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
                      color={selectedVideos.some((v) => v.id === video.id) ? 'success' : 'primary'}
                      variant={selectedVideos.some((v) => v.id === video.id) ? 'solid' : 'bordered'}
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
          />
        </div>
      )}
    </UnifiedModal>
  );
}
