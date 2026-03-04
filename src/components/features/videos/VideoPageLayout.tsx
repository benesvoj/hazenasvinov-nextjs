'use client';

import React from 'react';

import {Card, CardBody} from '@heroui/react';

import {Category, Club, Season, VideoSchema,} from '@/types';
import {isEmpty} from "@/utils";

import {VideoGrid} from './VideoGrid';

interface VideoPageLayoutProps {
	// Data props
	videos: VideoSchema[];
	loading: boolean;
	categories: Category[];
	clubs: Club[];
	seasons: Season[];

	// Event handlers
	onEdit: (video: VideoSchema) => void;
	onDelete: (video: VideoSchema) => void;

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
									videos,
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
								}: VideoPageLayoutProps) {

	if (loading && isEmpty(videos)) {
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
						<div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Access Control Message */}
			{showAccessControlMessage && accessControlMessage && (
				<Card className="border-yellow-200 bg-yellow-50">
					<CardBody>{accessControlMessage}</CardBody>
				</Card>
			)}

			<VideoGrid
				videos={videos}
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
