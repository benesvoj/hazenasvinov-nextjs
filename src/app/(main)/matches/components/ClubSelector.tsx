'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Image } from '@heroui/react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useSeasons, useCategories } from '@/hooks';
import { ClubWithTeams } from '@/types';

interface ClubSelectorProps {
  selectedCategory?: string;
  selectedClub?: string;
  onClubSelect: (clubId: string | undefined) => void;
  onClubDataChange?: (clubData: { [clubId: string]: string[] }) => void;
  className?: string;
}

export default function ClubSelector({ 
  selectedCategory, 
  selectedClub, 
  onClubSelect,
  onClubDataChange,
  className = ''
}: ClubSelectorProps) {
  const [clubs, setClubs] = useState<ClubWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use existing hooks instead of custom fetch functions
  const { activeSeason, fetchActiveSeason } = useSeasons();
  const { categories, fetchCategories } = useCategories();

  // Fetch required data when component mounts
  useEffect(() => {
    if (!activeSeason?.id) {
      fetchActiveSeason();
    }
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [activeSeason?.id, categories.length, fetchActiveSeason, fetchCategories]);

  // Fetch clubs data when the component mounts
  useEffect(() => {
    const fetchClubs = async () => {
      if (!activeSeason?.id || !categories.length) {
        // Don't start loading if we don't have the required data yet
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Import Supabase client dynamically to avoid SSR issues
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        // Fetch clubs that have teams in the selected category
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select(`
            id,
            name,
            short_name,
            logo_url
          `)
          .eq('is_active', true)
          .order('name');

        if (clubError) {
          throw new Error(`Failed to fetch clubs: ${clubError.message}`);
        }

        // Fetch club categories and teams separately for better control
        const { data: clubCategoriesData, error: clubCategoriesError } = await supabase
          .from('club_categories')
          .select(`
            id,
            club_id,
            category_id,
            club_category_teams(
              id,
              team_suffix
            )
          `)
          .eq('is_active', true);

        if (clubCategoriesError) {
          throw new Error(`Failed to fetch club categories: ${clubCategoriesError.message}`);
        }

        if (clubError) {
          throw new Error(`Failed to fetch clubs: ${clubError.message}`);
        }


        // Transform the data to match our Club interface
        const transformedClubs: ClubWithTeams[] = (clubData || []).map((club: any) => {
          // Find all club categories for this club
          const clubCategories = clubCategoriesData?.filter((cc: any) => cc.club_id === club.id) || [];
          
          // Get all teams from all categories for this club
          const teams = clubCategories.flatMap((cc: any) => 
            cc.club_category_teams?.map((team: any) => ({
              id: team.id,
              team_suffix: team.team_suffix,
              club_category_id: cc.category_id
            })) || []
          );

          return {
            id: club.id,
            name: club.name,
            short_name: club.short_name,
            logo_url: club.logo_url,
            teams
          };
        });

        setClubs(transformedClubs);
        setLoading(false);
        
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch clubs');
        setLoading(false);
      }
    };

    fetchClubs();
  }, [activeSeason, categories]);

  // Update club-team mapping whenever category or clubs change
  useEffect(() => {
    if (onClubDataChange && clubs.length > 0) {
      const clubTeamMap: { [clubId: string]: string[] } = {};
      
      clubs.forEach(club => {
        if (selectedCategory && selectedCategory !== 'all') {
          // Filter teams by selected category
          const categoryTeams = club.teams.filter(team => {
            const category = categories.find(cat => cat.id === team.club_category_id);
            return category?.code === selectedCategory;
          });
          clubTeamMap[club.id] = categoryTeams.map(team => team.id);
        } else {
          // All teams if no category selected
          clubTeamMap[club.id] = club.teams.map(team => team.id);
        }
      });
      
      onClubDataChange(clubTeamMap);
    }
  }, [clubs, selectedCategory, categories, onClubDataChange]);

  // Filter clubs based on selected category
  const filteredClubs = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return clubs;
    }

    // Find the category ID that matches the selected category code
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) {
      return [];
    }

    const filtered = clubs.filter(club => 
      club.teams.some(team => team.club_category_id === selectedCategoryData.id)
    );

    return filtered;
  }, [clubs, selectedCategory, categories]);

  // Handle club selection
  const handleClubSelect = (clubId: string) => {
    if (selectedClub === clubId) {
      // Deselect if same club clicked
      onClubSelect(undefined);
    } else {
      // Select new club
      onClubSelect(clubId);
    }
  };

  // Show loading state while waiting for required data
  if (!activeSeason?.id || !categories.length) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Načítání sezóny a kategorií...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Načítání klubů...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-red-600 dark:text-red-400 mb-2">
          Chyba: {error}
        </div>
        <Button
          size="sm"
          color="primary"
          onPress={() => window.location.reload()}
        >
          Zkusit znovu
        </Button>
      </div>
    );
  }

  if (filteredClubs.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <BuildingOfficeIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedCategory && selectedCategory !== 'all' 
            ? 'Žádné kluby v této kategorii'
            : 'Žádné kluby k dispozici'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`md:space-y-4 space-y-2 ${className} flex items-center flex-col`}>
      {/* Club Grid */}
      <div className="flex flex-wrap justify-center gap-1 md:gap-2">
        {filteredClubs.map((club) => (
          <Button
            key={club.id}
            variant="light"
            size="sm"
            onPress={() => handleClubSelect(club.id)}
            aria-label={`${selectedClub === club.id ? 'Zrušit filtr pro klub' : 'Filtrovat zápasy pro klub'} ${club.name}`}
            className={`flex items-center gap-1 md:flex-col md:gap-1 p-1 md:p-2 h-auto ${
              selectedClub === club.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
            }`}
          >
            {/* Club Logo */}
            {club.logo_url ? (
              <Image
                src={club.logo_url}
                alt={`${club.name} logo`}
                width={32}
                height={32}
                className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full"
              />
            ) : (
              <div className="w-6 h-6 md:w-12 md:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs md:text-lg font-bold text-gray-500">
                  {club.short_name ? club.short_name.charAt(0) : club.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Club Name - Hidden on mobile, shown on desktop */}
            <span className="hidden md:block text-xs font-medium text-gray-600 dark:text-gray-400 text-center max-w-[80px]">
              {club.short_name || club.name}
            </span>

          </Button>
        ))}
      </div>
    </div>
  );
}
