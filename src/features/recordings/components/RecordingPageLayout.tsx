'use client';

import React from 'react';

import {Alert} from '@heroui/alert';

import {ContentCard} from '@/components';
import {Category, Club, Season} from '@/types';
import {isEmpty} from '@/utils';

import type {RecordingSchema} from '../types';

import {RecordingGrid} from './RecordingGrid';

interface RecordingPageLayoutProps {
  // Data props
  recordings: RecordingSchema[];
  loading: boolean;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];

  // Event handlers
  onEdit: (item: RecordingSchema) => void;
  onDelete: (item: RecordingSchema) => void;

  // Access control
  showAccessControlMessage?: boolean;
  accessControlMessage?: React.ReactNode;

  // Empty state customization
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showAddButton?: boolean;

  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  isHeaderVisible?: boolean;
}

export function RecordingPageLayout({
  recordings,
  loading,
  categories,
  seasons,
  clubs,

  // Event handlers
  onEdit,
  onDelete,

  // Access control
  showAccessControlMessage = false,
  accessControlMessage,

  // Empty state customization
  emptyStateTitle,
  emptyStateDescription,
  showAddButton = true,

  // Pagination props
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  itemsPerPage = 20,
  onPageChange,
}: RecordingPageLayoutProps) {
  if (loading && isEmpty(recordings)) {
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
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Access Control Message */}
      {showAccessControlMessage && accessControlMessage && (
        <ContentCard>
          <Alert color="warning">{accessControlMessage}</Alert>
        </ContentCard>
      )}

      <RecordingGrid
        recordings={recordings}
        loading={loading}
        categories={categories}
        seasons={seasons}
        clubs={clubs}
        onEdit={onEdit}
        onDelete={onDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}
