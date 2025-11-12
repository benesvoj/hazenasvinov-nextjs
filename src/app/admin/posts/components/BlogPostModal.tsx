import React from "react";

import Image from "next/image";

import {Button, Input, Select, SelectItem, Textarea} from "@heroui/react";

import {MagnifyingGlassIcon, PhotoIcon, XMarkIcon} from "@heroicons/react/24/outline";

import MatchSelectionModal from "@/app/admin/posts/components/MatchSelectionModal";

import {UnifiedModal} from "@/components";
import {getBlogPostStatusOptions, ModalMode} from "@/enums";
import {formatDateString} from "@/helpers";
import {useBlogPostForm} from "@/hooks";
import {Category} from "@/types";


interface BlogPostModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	categories: Category[];
	categoriesLoading: boolean;
	blogPostForm: ReturnType<typeof useBlogPostForm>;
	mode: ModalMode;
}

export const BlogPostModal = ({
								  isOpen,
								  onClose,
								  onSubmit,
								  categories,
								  categoriesLoading,
								  blogPostForm,
								  mode
							  }: BlogPostModalProps) => {
	const isEditMode = mode === ModalMode.EDIT;
	const modalTitle = isEditMode ? 'Upravit článek' : 'Vytvořit nový článek';

	const footerButtons = (
		<>
			<Button variant="light" onPress={onClose}>
				Zrušit
			</Button>
			<Button color="primary" onPress={onSubmit}>
				{isEditMode ? 'Uložit změny' : 'Vytvořit článek'}
			</Button>
		</>
	)

	return (
		<>
			<UnifiedModal
				isOpen={isOpen}
				onClose={onClose}
				title={modalTitle}
				footer={footerButtons}
				size='4xl'
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="space-y-4">
						<Input
							label="Název článku"
							placeholder="Zadejte název článku"
							value={blogPostForm.formData.title}
							onChange={(e) => blogPostForm.updateFormData({title: e.target.value})}
							isRequired
						/>
						<Input
							label="Slug (URL)"
							placeholder="automaticky generováno"
							value={blogPostForm.formData.slug}
							onChange={(e) => blogPostForm.setFormData({...blogPostForm.formData, slug: e.target.value})}
							isRequired
							isDisabled
						/>
						<Select
							label="Autor"
							placeholder="Vyberte autora"
							selectedKeys={blogPostForm.formData.author_id ? [blogPostForm.formData.author_id] : []}
							onSelectionChange={(keys) =>
								blogPostForm.setFormData({
									...blogPostForm.formData,
									author_id: Array.from(keys)[0] as string
								})
							}
							isRequired
						>
							<SelectItem key={1}>Ja</SelectItem>
							{/*{users.map((user) => (*/}
							{/*	<SelectItem key={user.id}>{user.email}</SelectItem>*/}
							{/*))}*/}
						</Select>
						<Select
							label="Stav"
							placeholder="Vyberte stav"
							selectedKeys={[blogPostForm.formData.status]}
							onSelectionChange={(keys) =>
								blogPostForm.setFormData({
									...blogPostForm.formData,
									status: Array.from(keys)[0] as string
								})
							}
							isRequired
						>
							{getBlogPostStatusOptions().map(({value, label}) => (
								<SelectItem key={value}>{label}</SelectItem>
							))}
						</Select>

						{/* Category Selection */}
						<Select
							label="Kategorie"
							placeholder="Vyberte kategorii"
							selectedKeys={blogPostForm.formData.category_id ? [blogPostForm.formData.category_id] : []}
							onSelectionChange={(keys) =>
								blogPostForm.setFormData({
									...blogPostForm.formData,
									category_id: Array.from(keys)[0] as string
								})
							}
							isDisabled={categoriesLoading}
							isRequired
						>
							{categories.length > 0 ? (
								categories.map((category) => (
									<SelectItem key={category.id}>{category.name}</SelectItem>
								))
							) : (
								<SelectItem key="no-categories" isDisabled>
									{categoriesLoading ? 'Načítání kategorií...' : 'Žádné kategorie'}
								</SelectItem>
							)}
						</Select>

						{/* Match Selection (Optional) */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Související zápas (volitelné)
							</label>
							{blogPostForm.selectedMatch ? (
								<div
									className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium text-gray-900 dark:text-white">
												{blogPostForm.selectedMatch.home_team.name} vs {blogPostForm.selectedMatch.away_team.name}
											</div>
											<div className="text-sm text-gray-500">
												{blogPostForm.selectedMatch.competition} • {formatDateString(blogPostForm.selectedMatch.date)}
											</div>
										</div>
										<Button
											size="sm"
											variant="light"
											color="danger"
											onPress={() => blogPostForm.handleMatchSelect(null)}
										>
											Odstranit
										</Button>
									</div>
								</div>
							) : (
								<Button
									variant="bordered"
									startContent={<MagnifyingGlassIcon className="w-4 h-4"/>}
									onPress={blogPostForm.openMatchModal}
									className="w-full justify-start"
								>
									Vybrat zápas
								</Button>
							)}
							<p className="text-xs text-gray-500 mt-1">
								{!blogPostForm.formData.category_id
									? 'Nejprve vyberte kategorii pro filtrování dostupných zápasů.'
									: 'Vyberte zápas pro propojení s článkem'}
							</p>
						</div>

						{/* Image Upload */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Obrázek článku
							</label>

							{blogPostForm.imagePreview ? (
								<div className="space-y-3">
									<div
										className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
										<Image
											src={blogPostForm.imagePreview}
											alt="Preview"
											width={200}
											height={200}
											className="object-cover"
										/>
										<Button
											onPress={blogPostForm.handleRemoveImage}
											className="absolute top-2 right-2"
											title="Odstranit obrázek"
											radius="full"
											size="sm"
											color="danger"
											variant="flat"
											isIconOnly
											aria-label="Odstranit obrázek"
											startContent={<XMarkIcon className="h-4 w-4"/>}
										/>
									</div>
									<p className="text-xs text-gray-500">
										{blogPostForm.imageFile
											? 'Obrázek bude nahrán při uložení článku'
											: 'Stávající obrázek bude zachován, pokud nevyberete nový soubor.'}
									</p>
								</div>
							) : (
								<div className="space-y-3">
									<div
										className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
										<PhotoIcon className="mx-auto h-12 w-12 text-gray-400"/>
										<div className="mt-2">
											<label htmlFor="image-upload" className="cursor-pointer">
												<span className="text-sm font-medium text-blue-600 hover:text-blue-500">Nahrajte obrázek</span>
												<span className="text-gray-500"> nebo přetáhněte</span>
											</label>
											<input
												id="image-upload"
												type="file"
												className="hidden"
												accept="image/*"
												onChange={blogPostForm.handleImageFileChange}
												disabled={blogPostForm.uploadingImage}
											/>
										</div>
										<p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF do 5MB</p>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Obsah článku <span className="text-red-500">*</span>
							</label>
							<Textarea
								placeholder="Zde napište obsah článku..."
								value={blogPostForm.formData.content}
								onChange={(e) => blogPostForm.setFormData({
									...blogPostForm.formData,
									content: e.target.value
								})}
								rows={12}
								required
								className="w-full"
							/>
						</div>
					</div>
				</div>
			</UnifiedModal>

			<MatchSelectionModal
				isOpen={blogPostForm.isMatchModalOpen}
				onClose={blogPostForm.closeMatchModal}
				onSelect={blogPostForm.handleMatchSelect}
				selectedMatchId={blogPostForm.selectedMatch?.id}
				categoryId={blogPostForm.formData.category_id || undefined}
			/>
		</>
	)
}