'use client';

import React, {useState} from 'react';

import {VideoCameraIcon} from '@heroicons/react/24/outline';

import {useAppData} from '@/contexts/AppDataContext';

import {useCoachCategory} from "@/app/coaches/components/CoachCategoryContext";

import {DeleteConfirmationModal, PageContainer, VideoPageLayout} from '@/components';
import {useFetchVideos, useModalWithItem, useVideoFiltering, useVideos} from '@/hooks';
import {Video} from '@/types';
import {isEmpty} from '@/utils';

export default function CoachesVideosPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 20;

	const formModal = useModalWithItem<Video>();
	const deleteModal = useModalWithItem<Video>();

	const {
		clubs: {data: clubs},
		seasons: {data: seasons},
	} = useAppData();

	const {availableCategories} = useCoachCategory();

	const hasAssignedCategories = !isEmpty(availableCategories);

	const {data: videos, loading} = useFetchVideos(availableCategories.map(c => c.id));
	const {deleteVideo} = useVideos();
	const {filters, totalPages, totalCount} = useVideoFiltering({
		videos,
		itemsPerPage,
		currentPage,
	});

	const handleDeleteVideo = async (id: string) => {
		try {
			await deleteVideo(id);
			deleteModal.closeAndClear();
		} catch (err) {
			console.error('Error deleting video:', err);
		}
	};

	const openEditModal = (video: Video) => {
		formModal.openWith(video);
	};

	const openDeleteModal = (video: Video) => {
		deleteModal.openWith(video);
	};

	const accessControlMessage =
		!hasAssignedCategories ? (
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
					<VideoCameraIcon className="w-5 h-5 text-yellow-600"/>
				</div>
				<div>
					<h3 className="font-medium text-yellow-900">Žádné přiřazené kategorie</h3>
					<p className="text-sm text-yellow-700">
						Nemáte přiřazené žádné kategorie. Kontaktujte administrátora pro přiřazení kategorií.
					</p>
				</div>
			</div>
		) : null;

	return (
		<>
			<PageContainer
				isLoading={loading}
			>
				<VideoPageLayout
					videos={videos}
					loading={loading}
					categories={availableCategories}
					clubs={clubs}
					seasons={seasons}
					onEdit={openEditModal}
					onDelete={openDeleteModal}
					showAccessControlMessage={!hasAssignedCategories}
					accessControlMessage={accessControlMessage}
					emptyStateTitle="Žádná videa"
					emptyStateDescription={
						filters.search || filters.category_id || filters.is_active !== undefined
							? 'Nebyla nalezena žádná videa odpovídající filtru.'
							: 'Zatím nejsou přidána žádná videa pro vaše kategorie.'
					}
					showAddButton={!filters.search && !filters.category_id && filters.is_active === undefined}
					currentPage={currentPage}
					totalPages={totalPages}
					totalCount={totalCount}
					itemsPerPage={itemsPerPage}
					onPageChange={setCurrentPage}
				/>
			</PageContainer>

			<DeleteConfirmationModal
				isOpen={deleteModal.isOpen}
				onClose={deleteModal.closeAndClear}
				onConfirm={() => deleteModal.selectedItem && handleDeleteVideo(deleteModal.selectedItem.id)}
				title="Smazat video"
				message={`Opravdu chcete smazat video "${deleteModal.selectedItem?.title}"? Tato akce je nevratná.`}
			/>
		</>
	);
}
