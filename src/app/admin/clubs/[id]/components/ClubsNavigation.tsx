'use client';

import React, {useEffect} from 'react';
import {Button} from '@heroui/button';
import {Select, SelectItem} from '@heroui/select';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useClubsNavigation} from '@/hooks/entities/club/useClubsNavigation';

interface ClubsNavigationProps {
  currentClubId: string;
}

export default function ClubsNavigation({currentClubId}: ClubsNavigationProps) {
  const router = useRouter();
  const {hasPrevious, hasNext, previousClub, nextClub, loading, error, currentIndex, clubs} =
    useClubsNavigation(currentClubId);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'ArrowLeft' && hasPrevious && previousClub) {
        event.preventDefault();
        router.push(`/admin/clubs/${previousClub.id}`);
      } else if (event.key === 'ArrowRight' && hasNext && nextClub) {
        event.preventDefault();
        router.push(`/admin/clubs/${nextClub.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, hasPrevious, hasNext, previousClub, nextClub]);

  // Handle quick jump to club
  const handleQuickJump = (clubId: string) => {
    if (clubId !== currentClubId) {
      router.push(`/admin/clubs/${clubId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">Načítání navigace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg">
        <div className="text-sm text-red-500">Chyba navigace: {error}</div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg mb-4">
      {/* Previous Club Button */}
      <div className="flex items-center gap-2">
        {hasPrevious && previousClub ? (
          <Link
            href={`/admin/clubs/${previousClub.id}`}
            prefetch={true}
            scroll={false}
            replace={false}
          >
            <Button
              variant="flat"
              size="sm"
              startContent={<ChevronLeftIcon className="w-4 h-4" />}
              className="min-w-[120px] justify-start"
            >
              <div className="text-left">
                <div className="text-xs text-gray-500">Předchozí</div>
                <div className="font-medium truncate max-w-[100px]">
                  {previousClub.short_name || previousClub.name}
                </div>
              </div>
            </Button>
          </Link>
        ) : (
          <Button
            variant="flat"
            size="sm"
            startContent={<ChevronLeftIcon className="w-4 h-4" />}
            isDisabled
            className="min-w-[120px] justify-start"
          >
            <div className="text-left">
              <div className="text-xs text-gray-500">Předchozí</div>
              <div className="font-medium">-</div>
            </div>
          </Button>
        )}
      </div>

      {/* Current Position Indicator and Quick Jump */}
      <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4" />
          <span>
            {currentIndex + 1} z {clubs.length}
          </span>
          <span className="text-xs text-gray-400 ml-2">(← → pro navigaci)</span>
        </div>

        {/* Quick Jump Dropdown */}
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4" />
          <Select
            label="Přejít na klub..."
            size="sm"
            selectedKeys={[currentClubId]}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              if (selectedKey) {
                handleQuickJump(selectedKey);
              }
            }}
            className="min-w-[180px] max-w-[250px]"
          >
            {clubs.map((club) => (
              <SelectItem key={club.id}>{club.short_name || club.name}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Next Club Button */}
      <div className="flex items-center gap-2">
        {hasNext && nextClub ? (
          <Link href={`/admin/clubs/${nextClub.id}`} prefetch={true} scroll={false} replace={false}>
            <Button
              variant="flat"
              size="sm"
              endContent={<ChevronRightIcon className="w-4 h-4" />}
              className="min-w-[120px] justify-end"
            >
              <div className="text-right">
                <div className="text-xs text-gray-500">Následující</div>
                <div className="font-medium truncate max-w-[100px]">
                  {nextClub.short_name || nextClub.name}
                </div>
              </div>
            </Button>
          </Link>
        ) : (
          <Button
            variant="flat"
            size="sm"
            endContent={<ChevronRightIcon className="w-4 h-4" />}
            isDisabled
            className="min-w-[120px] justify-end"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Následující</div>
              <div className="font-medium">-</div>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
