'use client';

import React, {useCallback, useState} from "react";

import {generateSlug} from "@/utils/slugGenerator";

import {showToast} from "@/components";
import {BLOG_POST_STATUSES, ModalMode} from "@/enums";
import {Blog, BlogFormData, Match} from "@/types";

const initialFormData: BlogFormData = {
	title: '',
	slug: '',
	content: '',
	status: BLOG_POST_STATUSES.draft,
	category_id:'',
	match_id: '',
	image_url: '',
	author_id: '',
	published_at: '',
}

export const useBlogPostForm = () => {
	const [formData, setFormData] = useState<BlogFormData>(initialFormData);
	const [selectedPost, setSelectedPost] = useState<Blog | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

	const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
	const [uploadingImage, setUploadingImage] = useState<boolean>(false);

	const openAddMode = useCallback(() => {
		setModalMode(ModalMode.ADD);
		setSelectedPost(null);
		setFormData(initialFormData);
	}, [])

	const openEditMode = useCallback((item: Blog) => {
		setModalMode(ModalMode.EDIT);
		setSelectedPost(item);
		const {id, created_at, updated_at, ...editableFields} = item;
		setFormData(editableFields);

		if(item.image_url) {
			setImagePreview(item.image_url);
		}
	}, [])

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedPost(null);
		setModalMode(ModalMode.ADD);

		setSelectedMatch(null);
		setImageFile(null);
		setImagePreview('');
		setIsMatchModalOpen(false);
		setUploadingImage(false);
	}, [])

	const handleMatchSelect = useCallback((match: Match | null) => {
		setSelectedMatch(match);
		setFormData(prev => ({
			...prev,
			match_id: match?.id || '',
		}));
	}, []);

	const openMatchModal = useCallback(() => {
		setIsMatchModalOpen(true);
	}, []);

	const closeMatchModal = useCallback(() => {
		setIsMatchModalOpen(false);
	}, []);

	const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			showToast.warning('Selected file is not an image.')
			console.error('Selected file is not an image.');
			return;
		}

		const MAX_SIZE = 5 * 1024 * 1024; // 5MB
		if (file.size > MAX_SIZE) {
			showToast.warning('Selected image exceeds the maximum size of 5MB.')
			console.error('Selected image exceeds the maximum size of 5MB.');
			return;
		}
		setImageFile(file);

		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	}, []);

	const handleRemoveImage = useCallback(() => {
		setImageFile(null);
		setImagePreview('');
		setFormData(prev => ({
			...prev,
			image_url: '',
		}));
	},[]);

	const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
		const errors: string[] = [];

		if (!formData.content?.trim()) {
			errors.push('Content is mandatory');
		}
		if (!formData.title?.trim()) {
			errors.push('Title is mandatory');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}, [formData]);

	const updateFormData = useCallback((updates: Partial<BlogFormData>) => {
		setFormData(prev => {
			const newData = {...prev, ...updates}

			if (updates.title !== undefined) {
				newData.slug = generateSlug(updates.title)
			}
			return newData;
		})
	},[])

	return {
		formData,
		setFormData,
		updateFormData,
		selectedPost,
		modalMode,
		openAddMode,
		openEditMode,
		resetForm,
		validateForm,

		selectedMatch,
		handleMatchSelect,
		isMatchModalOpen,
		openMatchModal,
		closeMatchModal,

		imageFile,
		imagePreview,
		handleImageFileChange,
		handleRemoveImage,
		uploadingImage,
		setUploadingImage,
	}
}