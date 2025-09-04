"use client";

import React from "react";
import { Video, VideoFilters as VideoFiltersType, Category, Club, Season } from "@/types";
import { Card, CardBody } from "@heroui/react";
import { VideoPageHeader } from "./VideoPageHeader";
import { VideoFilters } from "./VideoFilters";
import { VideoGrid } from "./VideoGrid";
import { VideoFormModal } from "./VideoFormModal";

interface VideoPageLayoutProps {
  // Header props
  title: string;
  description: string;
  iconColor?: string;
  buttonColor?: "primary" | "success";
  buttonText: string;
  onAddVideo: () => void;
  isAddDisabled?: boolean;
  additionalInfo?: React.ReactNode;

  // Data props
  videos: Video[];
  loading: boolean;
  error: string | null;
  filters: VideoFiltersType;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  availableCategories?: Category[]; // For coaches - only show assigned categories

  // Event handlers
  onFiltersChange: (filters: VideoFiltersType) => void;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onFormSubmit: (formData: any) => void;

  // Modal props
  isFormModalOpen: boolean;
  editingVideo: Video | null;
  onCloseModals: () => void;

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

export function VideoPageLayout({
  // Header props
  title,
  description,
  iconColor = "text-blue-600",
  buttonColor = "primary",
  buttonText,
  onAddVideo,
  isAddDisabled = false,
  additionalInfo,

  // Data props
  videos,
  loading,
  error,
  filters,
  categories,
  clubs,
  seasons,
  availableCategories,

  // Event handlers
  onFiltersChange,
  onEdit,
  onDelete,
  onFormSubmit,

  // Modal props
  isFormModalOpen,
  editingVideo,
  onCloseModals,

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
}: VideoPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <VideoPageHeader
        title={title}
        description={description}
        iconColor={iconColor}
        buttonColor={buttonColor}
        buttonText={buttonText}
        onAddVideo={onAddVideo}
        isAddDisabled={isAddDisabled}
        additionalInfo={additionalInfo}
      />

      {/* Access Control Message */}
      {showAccessControlMessage && accessControlMessage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardBody>
            {accessControlMessage}
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <VideoFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        clubs={clubs}
        seasons={seasons}
        availableCategories={availableCategories}
      />

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <div className="space-y-3">
              <p className="text-red-700 font-medium">{error}</p>
              {error.includes("Tabulka videí neexistuje") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Jak vyřešit:
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Jděte do Supabase Dashboard</li>
                    <li>Otevřete SQL Editor</li>
                    <li>
                      Zkopírujte obsah souboru{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        scripts/create_videos_table.sql
                      </code>
                    </li>
                    <li>Vložte do SQL Editor a spusťte</li>
                    <li>Obnovte stránku</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">
                    Podrobné instrukce najdete v{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      docs/VIDEOS_MANUAL_SETUP.md
                    </code>
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Videos Grid */}
      <VideoGrid
        videos={videos}
        loading={loading}
        filters={filters}
        categories={availableCategories || categories}
        seasons={seasons}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddVideo={onAddVideo}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        showAddButton={showAddButton}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />

      {/* Form Modal */}
      <VideoFormModal
        isOpen={isFormModalOpen}
        onClose={onCloseModals}
        onSubmit={onFormSubmit}
        video={editingVideo}
        clubs={clubs}
        availableCategories={availableCategories}
      />
    </div>
  );
}
