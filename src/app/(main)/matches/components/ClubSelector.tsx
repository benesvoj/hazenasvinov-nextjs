'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import Image from 'next/image';
import { TrophyIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useSeasons, useCategories } from '@/hooks';

interface Club {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  team_count: number;
  teams: Array<{
    id: string;
    team_suffix: string;
    category_id: string;
  }>;
}

interface ClubSelectorProps {
  selectedCategory?: string;
  selectedClub?: string;
  onClubSelect: (clubId: string | undefined) => void;
  className?: string;
}

export default function ClubSelector({ 
  selectedCategory, 
  selectedClub, 
  onClubSelect,
  className = ''
}: ClubSelectorProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use existing hooks instead of custom fetch functions
  const { activeSeason } = useSeasons();
  const { categories } = useCategories();

  // For now, let's use a simpler approach with the existing hooks
  // We'll fetch clubs data when the component mounts
  useEffect(() => {
    const fetchClubs = async () => {
      if (!activeSeason?.id) return;

      try {
        setLoading(true);
        setError(null);

        console.log('🏢 [ClubSelector] Using existing hooks, activeSeason:', activeSeason);

        // Since we're using the existing hooks, we can simplify this
        // and just show that we're ready to work with the data
        setLoading(false);
        
        // TODO: Implement club fetching logic using the existing hooks
        // For now, we'll show a placeholder
        setClubs([]);
        
      } catch (error) {
        console.error('❌ [ClubSelector] Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
        setLoading(false);
      }
    };

    fetchClubs();
  }, [activeSeason]);

  // Filter clubs based on selected category
  const filteredClubs = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return clubs;
    }

    return clubs.filter(club => 
      club.teams.some(team => team.category_id === selectedCategory)
    );
  }, [clubs, selectedCategory]);

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
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Filtrovat podle klubu:
        </span>
        {!selectedClub ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (zobrazeny všechny kluby)
          </span>
        ) : (
          <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
            (filtrováno)
          </span>
        )}
      </div>

      {/* Club Grid */}
      <div className={`grid gap-3 ${
        filteredClubs.length > 6 ? 'grid-cols-6' : 
        filteredClubs.length > 4 ? 'grid-cols-4' : 
        filteredClubs.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
      } justify-items-center`}>
        {filteredClubs.map((club) => (
          <button
            key={club.id}
            onClick={() => handleClubSelect(club.id)}
            aria-label={`${selectedClub === club.id ? 'Zrušit filtr pro klub' : 'Filtrovat zápasy pro klub'} ${club.name}`}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all border-2 ${
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
                width={48}
                height={48}
                className="w-12 h-12 object-contain rounded-full"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-500">
                  {club.short_name ? club.short_name.charAt(0) : club.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Club Name */}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center max-w-[80px]">
              {club.short_name || club.name}
            </span>

            {/* Team Count Badge */}
            {club.team_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <TrophyIcon className="w-3 h-3" />
                <span>{club.team_count}</span>
              </div>
            )}
          </button>
        ))}
      </div>

              {/* Clear Selection Button */}
        {selectedClub && (
          <div className="text-center">
            <Button
              size="sm"
              variant="bordered"
              color="default"
              onPress={() => onClubSelect(undefined)}
            >
              Zrušit filtr klubu
            </Button>
          </div>
        )}
    </div>
  );
}
