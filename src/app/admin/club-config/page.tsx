'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { useClubConfig } from "@/hooks/useClubConfig";
import { useState, useEffect } from "react";
import { uploadClubAsset, deleteClubAsset } from "@/utils/supabase/storage";
import Image from "next/image";
import { 
	Cog6ToothIcon,
	PhotoIcon,
	BuildingOfficeIcon,
	GlobeAltIcon,
	PhoneIcon,
	EnvelopeIcon,
	MapPinIcon,
	CloudArrowUpIcon,
	TrashIcon
} from "@heroicons/react/24/outline";

export default function ClubConfigPage() {
	const { clubConfig, loading, error, updateClubConfig } = useClubConfig();
	const [isEditing, setIsEditing] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadingHero, setUploadingHero] = useState(false);
	const [formData, setFormData] = useState({
		club_name: '',
		club_logo_path: '',
		club_logo_url: '',
		hero_image_path: '',
		hero_image_url: '',
		hero_title: '',
		hero_subtitle: '',
		hero_button_text: '',
		hero_button_link: '',
		contact_email: '',
		contact_phone: '',
		address: '',
		facebook_url: '',
		instagram_url: '',
		website_url: '',
		founded_year: 1920,
		description: ''
	});

	// Initialize form data when clubConfig is loaded
	useEffect(() => {
		if (clubConfig) {
			setFormData({
				club_name: clubConfig.club_name || '',
				club_logo_path: clubConfig.club_logo_path || '',
				club_logo_url: clubConfig.club_logo_url || '',
				hero_image_path: clubConfig.hero_image_path || '',
				hero_image_url: clubConfig.hero_image_url || '',
				hero_title: clubConfig.hero_title || '',
				hero_subtitle: clubConfig.hero_subtitle || '',
				hero_button_text: clubConfig.hero_button_text || '',
				hero_button_link: clubConfig.hero_button_link || '',
				contact_email: clubConfig.contact_email || '',
				contact_phone: clubConfig.contact_phone || '',
				address: clubConfig.address || '',
				facebook_url: clubConfig.facebook_url || '',
				instagram_url: clubConfig.instagram_url || '',
				website_url: clubConfig.website_url || '',
				founded_year: clubConfig.founded_year || 1920,
				description: clubConfig.description || ''
			});
		}
	}, [clubConfig]);

	const handleSave = async () => {
		try {
			await updateClubConfig(formData);
			setIsEditing(false);
		} catch (error) {
			console.error('Error saving club config:', error);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		// Reset form to current values
		if (clubConfig) {
			setFormData({
				club_name: clubConfig.club_name || '',
				club_logo_path: clubConfig.club_logo_path || '',
				club_logo_url: clubConfig.club_logo_url || '',
				hero_image_path: clubConfig.hero_image_path || '',
				hero_image_url: clubConfig.hero_image_url || '',
				hero_title: clubConfig.hero_title || '',
				hero_subtitle: clubConfig.hero_subtitle || '',
				hero_button_text: clubConfig.hero_button_text || '',
				hero_button_link: clubConfig.hero_button_link || '',
				contact_email: clubConfig.contact_email || '',
				contact_phone: clubConfig.contact_phone || '',
				address: clubConfig.address || '',
				facebook_url: clubConfig.facebook_url || '',
				instagram_url: clubConfig.instagram_url || '',
				website_url: clubConfig.website_url || '',
				founded_year: clubConfig.founded_year || 1920,
				description: clubConfig.description || ''
			});
		}
	};

	const handleLogoUpload = async (file: File) => {
		setUploadingLogo(true);
		try {
			const timestamp = Date.now();
			const extension = file.name.split('.').pop() || 'png';
			const path = `club-assets/logo-${timestamp}.${extension}`;
			
			const result = await uploadClubAsset(file, path);
			
			if (result.error) {
				alert(`Chyba při nahrávání loga: ${result.error}`);
				return;
			}

			// Update form data with new logo
			setFormData(prev => ({
				...prev,
				club_logo_path: result.path,
				club_logo_url: result.url
			}));

			// Delete old logo if it exists
			if (formData.club_logo_path && formData.club_logo_path !== result.path) {
				await deleteClubAsset(formData.club_logo_path);
			}

		} catch (error) {
			console.error('Logo upload failed:', error);
			alert('Chyba při nahrávání loga');
		} finally {
			setUploadingLogo(false);
		}
	};

	const handleHeroUpload = async (file: File) => {
		setUploadingHero(true);
		try {
			const timestamp = Date.now();
			const extension = file.name.split('.').pop() || 'jpg';
			const path = `club-assets/hero-${timestamp}.${extension}`;
			
			const result = await uploadClubAsset(file, path);
			
			if (result.error) {
				alert(`Chyba při nahrávání hero obrázku: ${result.error}`);
				return;
			}

			// Update form data with new hero image
			setFormData(prev => ({
				...prev,
				hero_image_path: result.path,
				hero_image_url: result.url
			}));

			// Delete old hero image if it exists
			if (formData.hero_image_path && formData.hero_image_path !== result.path) {
				await deleteClubAsset(formData.hero_image_path);
			}

		} catch (error) {
			console.error('Hero upload failed:', error);
			alert('Chyba při nahrávání hero obrázku');
		} finally {
			setUploadingHero(false);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Načítání konfigurace klubu...</p>
				</CardBody>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="text-red-500 mb-4">
						<Cog6ToothIcon className="w-16 h-16 mx-auto" />
					</div>
					<div className="mb-2 text-red-600">Chyba při načítání konfigurace</div>
					<div className="text-sm text-gray-500 mb-4">{error}</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex justify-between w-full items-center">
						<div className="flex items-center gap-3">
							<Cog6ToothIcon className="w-8 h-8 text-blue-600" />
							<div>
								<h1 className="text-2xl font-bold">Konfigurace klubu</h1>
								<p className="text-gray-600">Správa základních informací a nastavení klubu</p>
							</div>
						</div>
						{!isEditing ? (
							<Button 
								color="primary" 
								onPress={() => setIsEditing(true)}
								startContent={<Cog6ToothIcon className="w-5 h-5" />}
							>
								Upravit konfiguraci
							</Button>
						) : (
							<div className="flex gap-2">
								<Button 
									color="secondary" 
									variant="bordered"
									onPress={handleCancel}
								>
									Zrušit
								</Button>
								<Button 
									color="primary" 
									onPress={handleSave}
								>
									Uložit změny
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardBody>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Club Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
								Základní informace
							</h3>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Název klubu
								</label>
								{isEditing ? (
									<Input
										value={formData.club_name}
										onChange={(e) => setFormData(prev => ({ ...prev, club_name: e.target.value }))}
										placeholder="Název klubu"
									/>
								) : (
									<p className="text-gray-900 font-medium">{clubConfig?.club_name}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Logo klubu
								</label>
								{isEditing ? (
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											{formData.club_logo_url ? (
												<Image
													src={formData.club_logo_url} 
													alt="Club Logo" 
													width={48}
													height={48}
													className="rounded-lg object-cover"
												/>
											) : (
												<div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
													<PhotoIcon className="w-6 h-6 text-gray-400" />
												</div>
											)}
											<div className="flex-1">
												<input
													type="file"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															handleLogoUpload(file);
														}
													}}
													className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
												/>
											</div>
										</div>
										{uploadingLogo && (
											<div className="flex items-center gap-2 text-sm text-blue-600">
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
												Nahrávání loga...
											</div>
										)}
										{formData.club_logo_path && (
											<div className="text-xs text-gray-500">
												Cesta: {formData.club_logo_path}
											</div>
										)}
									</div>
								) : (
									<div className="flex items-center gap-3">
										{clubConfig?.club_logo_url ? (
											<Image
												src={clubConfig.club_logo_url} 
												alt="Club Logo" 
												width={48}
												height={48}
												className="rounded-lg object-cover"
											/>
										) : (
											<div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
												<PhotoIcon className="w-6 h-6 text-gray-400" />
											</div>
										)}
										<span className="text-gray-600">
											{clubConfig?.club_logo_path || 'Logo není nastaveno'}
										</span>
									</div>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Rok založení
								</label>
								{isEditing ? (
									<Input
										type="number"
										value={formData.founded_year.toString()}
										onChange={(e) => setFormData(prev => ({ ...prev, founded_year: parseInt(e.target.value) || 1920 }))}
										placeholder="1920"
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.founded_year}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Popis klubu
								</label>
								{isEditing ? (
									<Textarea
										value={formData.description}
										onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Popis klubu"
										rows={3}
									/>
								) : (
									<p className="text-gray-600">{clubConfig?.description || 'Popis není nastaven'}</p>
								)}
							</div>
						</div>

						{/* Hero Section Configuration */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<PhotoIcon className="w-5 h-5 text-blue-600" />
								Hlavní stránka (Hero)
							</h3>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Hero obrázek
								</label>
								{isEditing ? (
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											{formData.hero_image_url ? (
												<Image
													src={formData.hero_image_url} 
													alt="Hero Image" 
													width={64}
													height={48}
													className="rounded-lg object-cover"
												/>
											) : (
												<div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
													<PhotoIcon className="w-6 h-6 text-gray-400" />
												</div>
											)}
											<div className="flex-1">
												<input
													type="file"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															handleHeroUpload(file);
														}
													}}
													className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
												/>
											</div>
										</div>
										{uploadingHero && (
											<div className="flex items-center gap-2 text-sm text-blue-600">
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
												Nahrávání hero obrázku...
											</div>
										)}
										{formData.hero_image_path && (
											<div className="text-xs text-gray-500">
												Cesta: {formData.hero_image_path}
											</div>
										)}
										<div className="text-xs text-gray-500">
											Doporučená velikost: 1920x1080px nebo větší
										</div>
									</div>
								) : (
									<div className="flex items-center gap-3">
										{clubConfig?.hero_image_url ? (
											<Image
												src={clubConfig.hero_image_url} 
												alt="Hero Image" 
												width={64}
												height={48}
												className="rounded-lg object-cover"
											/>
										) : (
											<div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
												<PhotoIcon className="w-6 h-6 text-gray-400" />
											</div>
										)}
										<span className="text-gray-600">
											{clubConfig?.hero_image_path || 'Hero obrázek není nastaven'}
										</span>
									</div>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Hlavní nadpis
								</label>
								{isEditing ? (
									<Input
										value={formData.hero_title}
										onChange={(e) => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
										placeholder="Hlavní nadpis"
									/>
								) : (
									<p className="text-gray-900 font-medium">{clubConfig?.hero_title}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Podnadpis
								</label>
								{isEditing ? (
									<Textarea
										value={formData.hero_subtitle}
										onChange={(e) => setFormData(prev => ({ ...prev, hero_subtitle: e.target.value }))}
										placeholder="Podnadpis"
										rows={2}
									/>
								) : (
									<p className="text-gray-600">{clubConfig?.hero_subtitle || 'Podnadpis není nastaven'}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Text tlačítka
									</label>
									{isEditing ? (
										<Input
											value={formData.hero_button_text}
											onChange={(e) => setFormData(prev => ({ ...prev, hero_button_text: e.target.value }))}
											placeholder="Více informací"
										/>
									) : (
										<p className="text-gray-900">{clubConfig?.hero_button_text}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Odkaz tlačítka
									</label>
									{isEditing ? (
										<Input
											value={formData.hero_button_link}
											onChange={(e) => setFormData(prev => ({ ...prev, hero_button_link: e.target.value }))}
											placeholder="/about"
										/>
									) : (
										<p className="text-gray-900">{clubConfig?.hero_button_link}</p>
									)}
								</div>
							</div>
						</div>

						{/* Contact Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<EnvelopeIcon className="w-5 h-5 text-blue-600" />
								Kontaktní informace
							</h3>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email
								</label>
								{isEditing ? (
									<Input
										type="email"
										value={formData.contact_email}
										onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
										placeholder="info@hazenasvinov.cz"
										startContent={<EnvelopeIcon className="w-4 h-4 text-gray-400" />}
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.contact_email || 'Email není nastaven'}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Telefon
								</label>
								{isEditing ? (
									<Input
										value={formData.contact_phone}
										onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
										placeholder="+420 123 456 789"
										startContent={<PhoneIcon className="w-4 h-4 text-gray-400" />}
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.contact_phone || 'Telefon není nastaven'}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Adresa
								</label>
								{isEditing ? (
									<Textarea
										value={formData.address}
										onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
										placeholder="Adresa klubu"
										rows={2}
										startContent={<MapPinIcon className="w-4 h-4 text-gray-400" />}
									/>
								) : (
									<p className="text-gray-600">{clubConfig?.address || 'Adresa není nastavena'}</p>
								)}
							</div>
						</div>

						{/* Social Media & Website */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<GlobeAltIcon className="w-5 h-5 text-blue-600" />
								Web a sociální sítě
							</h3>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Webové stránky
								</label>
								{isEditing ? (
									<Input
										type="url"
										value={formData.website_url}
										onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
										placeholder="https://hazenasvinov.cz"
										startContent={<GlobeAltIcon className="w-4 h-4 text-gray-400" />}
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.website_url || 'Web není nastaven'}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Facebook
								</label>
								{isEditing ? (
									<Input
										type="url"
										value={formData.facebook_url}
										onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
										placeholder="https://facebook.com/hazenasvinov"
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.facebook_url || 'Facebook není nastaven'}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Instagram
								</label>
								{isEditing ? (
									<Input
										type="url"
										value={formData.instagram_url}
										onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
										placeholder="https://instagram.com/hazenasvinov"
									/>
								) : (
									<p className="text-gray-900">{clubConfig?.instagram_url || 'Instagram není nastaven'}</p>
								)}
							</div>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
