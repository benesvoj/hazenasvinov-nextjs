'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { translations } from "@/lib/translations";
import { useSponsorshipData, MediaPartner } from "@/hooks/useSponsorshipData";
import { 
	PlusIcon, 
	PencilIcon, 
	TrashIcon, 
	EyeIcon,
	MegaphoneIcon,
	GlobeAltIcon,
	PhoneIcon,
	EnvelopeIcon,
	CalendarIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Image } from "@heroui/image";

export const MediaPartnersTab = () => {
	const { 
		mediaPartners, 
		loading, 
		error, 
		refreshAll 
	} = useSponsorshipData();
	
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const getMediaTypeBadge = (type: string) => {
		const typeColors = {
			newspaper: 'bg-blue-100 text-blue-800',
			radio: 'bg-purple-100 text-purple-800',
			tv: 'bg-red-100 text-red-800',
			online: 'bg-green-100 text-green-800',
			social: 'bg-pink-100 text-pink-800',
			other: 'bg-gray-100 text-gray-800'
		};
		
		const typeLabels = {
			newspaper: 'Noviny',
			radio: 'Rádio',
			tv: 'Televize',
			online: 'Online',
			social: 'Sociální sítě',
			other: 'Jiné'
		};
		
		return (
			<Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
				{typeLabels[type as keyof typeof typeLabels]}
			</Badge>
		);
	};

	const getCoverageBadge = (coverage: string) => {
		const coverageColors = {
			local: 'bg-green-100 text-green-800',
			regional: 'bg-blue-100 text-blue-800',
			national: 'bg-purple-100 text-purple-800'
		};
		
		const coverageLabels = {
			local: 'Místní',
			regional: 'Regionální',
			national: 'Národní'
		};
		
		return (
			<Badge className={coverageColors[coverage as keyof typeof coverageColors] || 'bg-gray-100 text-gray-800'}>
				{coverageLabels[coverage as keyof typeof coverageLabels]}
			</Badge>
		);
	};

	const getStatusBadge = (status: string) => {
		const statusColors = {
			active: 'bg-green-100 text-green-800',
			inactive: 'bg-gray-100 text-gray-800',
			pending: 'bg-yellow-100 text-yellow-800'
		};
		
		return (
			<Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
				{status === 'active' ? 'Aktivní' : status === 'inactive' ? 'Neaktivní' : 'Čekající'}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('cs-CZ');
	};

	if (loading) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Načítání mediálních partnerů...</p>
				</CardBody>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="text-red-500 mb-4">
						<MegaphoneIcon className="w-16 h-16 mx-auto" />
					</div>
					<div className="mb-2 text-red-600">Chyba při načítání dat</div>
					<div className="text-sm text-gray-500 mb-4">{error}</div>
					<Button 
						color="primary" 
						onPress={refreshAll}
						startContent={<PlusIcon className="w-5 h-5" />}
					>
						Zkusit znovu
					</Button>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between w-full items-center">
					<div>
						<h3 className="text-xl font-semibold">{translations.sponsorship.mediaPartners}</h3>
						<p className="text-sm text-gray-600">{translations.sponsorship.mediaPartnersDescription}</p>
					</div>
					<Button 
						color="primary" 
						startContent={<PlusIcon className="w-5 h-5" />}
					>
						{translations.sponsorship.button.addPartner}
					</Button>
				</div>
			</CardHeader>
			<CardBody>
				{mediaPartners.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<MegaphoneIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<div className="mb-2">Žádní mediální partneři</div>
						<div className="text-sm text-gray-400">
							Začněte přidáváním prvního mediálního partnera
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table aria-label="Media partners table">
							<TableHeader>
								<TableColumn>Název</TableColumn>
								<TableColumn>Typ média</TableColumn>
								<TableColumn>Pokrytí</TableColumn>
								<TableColumn>Kontakt</TableColumn>
								<TableColumn>Web</TableColumn>
								<TableColumn>Datum začátku</TableColumn>
								<TableColumn>Status</TableColumn>
								<TableColumn>Akce</TableColumn>
							</TableHeader>
							<TableBody>
								{mediaPartners.map((partner) => (
									<TableRow key={partner.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												{partner.logo_url ? (
													<Image 
														src={partner.logo_url} 
														alt={partner.name}
														className="rounded-lg object-cover"
														width={40}
														height={40}
													/>
												) : (
													<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
														<MegaphoneIcon className="w-5 h-5 text-white" />
													</div>
												)}
												<div className="flex flex-col">
													<span className="font-medium text-gray-900">{partner.name}</span>
													<span className="text-xs text-gray-500">{partner.description}</span>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{getMediaTypeBadge(partner.media_type)}
										</TableCell>
										<TableCell>
											{getCoverageBadge(partner.coverage)}
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												{partner.email && (
													<div className="flex items-center gap-2 text-xs">
														<EnvelopeIcon className="w-3 h-3 text-gray-400" />
														<span className="truncate">{partner.email}</span>
													</div>
												)}
												{partner.phone && (
													<div className="flex items-center gap-2 text-xs">
														<PhoneIcon className="w-3 h-3 text-gray-400" />
														<span className="truncate">{partner.phone}</span>
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											{partner.website_url ? (
												<a 
													href={partner.website_url} 
													target="_blank" 
													rel="noopener noreferrer"
													className="text-blue-600 hover:text-blue-800 text-sm"
												>
													Navštívit
												</a>
											) : (
												<span className="text-gray-400 text-sm">-</span>
											)}
										</TableCell>
										<TableCell>
											<span className="text-sm">{formatDate(partner.start_date)}</span>
										</TableCell>
										<TableCell>
											{getStatusBadge(partner.status)}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													size="sm"
													color="primary"
													variant="light"
													isIconOnly
												>
													<EyeIcon className="w-4 h-4" />
												</Button>
												<Button
													size="sm"
													color="primary"
													variant="light"
													isIconOnly
												>
													<PencilIcon className="w-4 h-4" />
												</Button>
												<Button
													size="sm"
													color="danger"
													variant="light"
													isIconOnly
													isLoading={deletingId === partner.id}
												>
													<TrashIcon className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardBody>
		</Card>
	);
};
