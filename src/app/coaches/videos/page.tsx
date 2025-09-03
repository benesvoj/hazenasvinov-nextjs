'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Video, VideoFormData, VideoFilters } from '@/types';
import { useClubs, useSeasons, useAuth, useCategories, useUserRoles } from '@/hooks';
import { 
  VideoCameraIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  SelectItem,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton
} from '@heroui/react';
import { VideoFormModal, VideoCard } from '@/components';


export default function CoachesVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VideoFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);

  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const { clubs, loading: clubsLoading } = useClubs();
  const { seasons, loading: seasonsLoading, fetchAllSeasons } = useSeasons();
  const { user, loading: authLoading } = useAuth();
  const { getCurrentUserCategories } = useUserRoles();

  // Fetch coach's assigned categories using new role system
  const fetchAssignedCategories = async () => {
    if (!user?.id) return;

    try {
      const categories = await getCurrentUserCategories();
      setAssignedCategories(categories);
    } catch (err) {
      console.error('Error fetching assigned categories:', err);
      setAssignedCategories([]);
    }
  };

  // Fetch videos with category-based access control
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Check if videos table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('videos')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('Videos table error:', tableError);
        if (tableError.message.includes('relation "videos" does not exist')) {
          setError('Tabulka videí neexistuje. Kontaktujte administrátora.');
          setVideos([]);
          return;
        }
        throw tableError;
      }
      
      let query = supabase
        .from('videos')
        .select(`
          *,
          categories (
            id,
            name,
            code
          ),
          clubs (
            id,
            name,
            short_name
          ),
          seasons (
            id,
            name,
            start_date,
            end_date
          )
        `)
        .order('created_at', { ascending: false });

      // Apply category-based access control for coaches
      if (assignedCategories.length > 0) {
        query = query.in('category_id', assignedCategories);
      } else {
        // If no categories assigned, show no videos
        setVideos([]);
        setLoading(false);
        return;
      }

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.club_id) {
        query = query.eq('club_id', filters.club_id);
      }
      
      if (filters.season_id) {
        query = query.eq('season_id', filters.season_id);
      }
      
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched videos data:', data);
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(`Chyba při načítání videí: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchAssignedCategories();
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (assignedCategories.length > 0) {
      fetchCategories();
      fetchAllSeasons();
    }
  }, [assignedCategories]);

  useEffect(() => {
    if (assignedCategories.length > 0) {
      fetchVideos();
    }
  }, [filters, assignedCategories]);

  // Handle video operations
  const handleCreateVideo = async (formData: VideoFormData) => {
    try {
      const supabase = createClient();
      
      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(formData.youtube_url);
      if (!youtubeId) {
        throw new Error('Neplatná YouTube URL');
      }

      const { data, error } = await supabase
        .from('videos')
        .insert({
          ...formData,
          youtube_id: youtubeId,
          thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          created_by: user?.id,
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVideos(prev => [data, ...prev]);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error creating video:', err);
      setError('Chyba při vytváření videa');
    }
  };

  const handleUpdateVideo = async (id: string, formData: VideoFormData) => {
    try {
      const supabase = createClient();
      
      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(formData.youtube_url);
      if (!youtubeId) {
        throw new Error('Neplatná YouTube URL');
      }

      const { data, error } = await supabase
        .from('videos')
        .update({
          ...formData,
          youtube_id: youtubeId,
          thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          updated_by: user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVideos(prev => prev.map(video => video.id === id ? data : video));
      setEditingVideo(null);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error updating video:', err);
      setError('Chyba při aktualizaci videa');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setVideos(prev => prev.filter(video => video.id !== id));
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Chyba při mazání videa');
    }
  };

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Filter handlers
  const handleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      category_id: categoryId === 'all' ? undefined : categoryId
    }));
  };

  const handleSearchFilter = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined
    }));
  };

  const handleActiveFilter = (isActive: boolean) => {
    setFilters(prev => ({
      ...prev,
      is_active: isActive
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingVideo(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (video: Video) => {
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setEditingVideo(null);
    setDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  // Filter categories to only show assigned ones
  const availableCategories = categories.filter(cat => 
    assignedCategories.includes(cat.id)
  );

  if (authLoading || (loading && videos.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Videa</h1>
            <p className="text-gray-600">Správa videí pro vaše kategorie</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <VideoCameraIcon className="w-8 h-8 text-green-600" />
              Videa
            </h1>
            <p className="text-gray-600">Správa videí pro vaše kategorie</p>
            {assignedCategories.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Máte přístup k {availableCategories.length} kategoriím
                </p>
              </div>
            )}
          </div>
          
          <Button
            color="success"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={openCreateModal}
            isDisabled={assignedCategories.length === 0}
          >
            Přidat video
          </Button>
        </div>

        {/* Access Control Message */}
        {assignedCategories.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <VideoCameraIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-900">Žádné přiřazené kategorie</h3>
                  <p className="text-sm text-yellow-700">
                    Nemáte přiřazené žádné kategorie. Kontaktujte administrátora pro přiřazení kategorií.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        {assignedCategories.length > 0 && (
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <Input
                  placeholder="Hledat videa..."
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                  value={filters.search || ''}
                  onValueChange={handleSearchFilter}
                />

                {/* Category Filter */}
                <Select
                  placeholder="Všechny kategorie"
                  selectedKeys={filters.category_id ? [filters.category_id] : ['all']}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleCategoryFilter(selected);
                  }}
                >
                  <>
                    <SelectItem key="all">Všechny kategorie</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </>
                </Select>

                {/* Club Filter */}
                <Select
                  placeholder="Všechny kluby"
                  selectedKeys={filters.club_id ? [filters.club_id] : ['all']}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilters(prev => ({
                      ...prev,
                      club_id: selected === 'all' ? undefined : selected
                    }));
                  }}
                >
                  <>
                    <SelectItem key="all">Všechny kluby</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </>
                </Select>

                {/* Season Filter */}
                <Select
                  placeholder="Všechny sezóny"
                  selectedKeys={filters.season_id ? [filters.season_id] : ['all']}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilters(prev => ({
                      ...prev,
                      season_id: selected === 'all' ? undefined : selected
                    }));
                  }}
                >
                  <>
                    <SelectItem key="all">Všechny sezóny</SelectItem>
                    {seasons.map((season) => (
                      <SelectItem key={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </>
                </Select>

                {/* Active Filter */}
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={filters.is_active === true}
                    onValueChange={(isActive) => handleActiveFilter(isActive)}
                  />
                  <span className="text-sm text-gray-600">Pouze aktivní</span>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="bordered"
                  startContent={<FunnelIcon className="w-4 h-4" />}
                  onPress={clearFilters}
                >
                  Vymazat filtry
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardBody>
              <p className="text-red-700 font-medium">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Videos Grid */}
        {assignedCategories.length > 0 && (
          <>
            {videos.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Žádná videa
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.category_id || filters.is_active !== undefined
                      ? 'Nebyla nalezena žádná videa odpovídající filtru.'
                      : 'Zatím nejsou přidána žádná videa pro vaše kategorie.'}
                  </p>
                  {!filters.search && !filters.category_id && filters.is_active === undefined && (
                    <Button
                      color="success"
                      startContent={<PlusIcon className="w-5 h-5" />}
                      onPress={openCreateModal}
                    >
                      Přidat první video
                    </Button>
                  )}
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    categories={availableCategories}
                    seasons={seasons}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Form Modal */}
        {assignedCategories.length > 0 && (
          <VideoFormModal
            isOpen={isFormModalOpen}
            onClose={closeModals}
            onSubmit={editingVideo ? 
              (formData: VideoFormData) => handleUpdateVideo(editingVideo.id, formData) : 
              handleCreateVideo
            }
            video={editingVideo}
            clubs={clubs}
            availableCategories={availableCategories}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteModalOpen} onClose={closeModals}>
          <ModalContent>
            <ModalHeader>Smazat video</ModalHeader>
            <ModalBody>
              <p>
                Opravdu chcete smazat video &ldquo;{videoToDelete?.title}&rdquo;? 
                Tato akce je nevratná.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={closeModals}>
                Zrušit
              </Button>
              <Button 
                color="danger" 
                onPress={() => videoToDelete && handleDeleteVideo(videoToDelete.id)}
              >
                Smazat
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </div>
  );
}
