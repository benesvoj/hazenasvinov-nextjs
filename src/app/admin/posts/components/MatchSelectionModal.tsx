'use client';

import React, {useMemo, useState} from 'react';

import {Button, Chip, Input, Select, SelectItem,} from '@heroui/react';

import {formatTime} from '@/helpers/formatTime';

import {UnifiedModal, UnifiedTable} from "@/components";
import {matchStatuses} from '@/constants';
import {formatDateString} from '@/helpers';
import {useFetchMatches, useSeasons} from '@/hooks';
import {Match} from '@/types';

interface MatchSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (match: Match | null) => void;
	selectedMatchId?: string;
	categoryId?: string;
}

export default function MatchSelectionModal({
												isOpen,
												onClose,
												onSelect,
												selectedMatchId,
												categoryId,
											}: MatchSelectionModalProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	// Get active season
	const {activeSeason} = useSeasons();

	// Use the existing hook to fetch matches (only when modal is open, categoryId is provided, and active season exists)
	const {
		matches: seasonalMatches,
		loading,
		error,
	} = useFetchMatches(
		isOpen && categoryId && activeSeason?.id ? categoryId : '',
		activeSeason?.id, // Use active season ID explicitly
		{
			ownClubOnly: true, // Only show own club matches
			includeTeamDetails: true,
		}
	);

	// Flatten seasonal matches into a single array and sort by date (newest first)
	const allMatches = useMemo(() => {
		try {
			const all = [...(seasonalMatches?.autumn || []), ...(seasonalMatches?.spring || [])];
			const sorted = all.sort((a, b) => {
				try {
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				} catch (dateError) {
					console.warn('Date sorting error:', dateError);
					return 0;
				}
			});

			// Debug logging removed - component now has proper error handling

			return sorted;
		} catch (error) {
			console.error('Error processing matches:', error);
			return [];
		}
	}, [seasonalMatches]);

	// Filter matches based on search and status
	const filteredMatches = useMemo(() => {
		try {
			return allMatches.filter((match) => {
				// Ensure match has required data
				if (!match || !match.home_team || !match.away_team) {
					return false;
				}

				const matchesSearch =
					!searchTerm ||
					match.home_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					match.away_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					match.competition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					match.venue?.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesStatus = statusFilter === 'all' || match.status === statusFilter;

				return matchesSearch && matchesStatus;
			});
		} catch (error) {
			console.error('Error filtering matches:', error);
			return [];
		}
	}, [allMatches, searchTerm, statusFilter]);

	if (!categoryId || !activeSeason) {
		return (
			<UnifiedModal
				isOpen={isOpen}
				onClose={onClose}
				title={'Vyberte zápas'}
				size="5xl"
				scrollBehavior="inside"
				footer={
					<Button variant="light" onPress={onClose}>
						Zavřít
					</Button>
				}
			>
				if (!categoryId) {
				<div className="text-center py-8 text-gray-500">Nejdříve vyberte kategorii článku</div>
			} else {
				<div className="text-center py-8 text-gray-500">Není k dispozici aktivní sezóna</div>
			}
			</UnifiedModal>
		);
	}

	const handleSelect = (match: Match) => {
		onSelect(match);
		onClose();
	};

	const handleClear = () => {
		onSelect(null);
		onClose();
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case matchStatuses.completed:
				return 'success';
			case matchStatuses.upcoming:
				return 'primary';
			default:
				return 'default';
		}
	};

	const columns = [
		{key: 'date', label: 'Datum'},
		{key: 'time', label: 'Čas'},
		{key: 'match', label: 'Zápas'},
		{key: 'result', label: 'Výsledek'},
		{key: 'status', label: 'Stav'},
		{
			key: 'actions', label: 'Akce', isActionColumn: true,
		}
	]

	const renderCells = (match: Match, columnKey: string) => {
		switch (columnKey) {
			case 'date':
				return formatDateString(match.date);
			case 'time':
				return formatTime(match.time);
			case 'match':
				return (
					<div className="space-y-1">
						<div className="font-medium">
							{match.home_team?.name || 'Neznámý tým'} - {match.away_team?.name || 'Neznámý tým'}
						</div>
					</div>
				);
			case 'result':
				return match.status === 'completed' && match.home_score !== null && match.away_score !== null ? (
					<div className="space-y-1">
						<div className="text-lg font-bold">
							{match.home_score} : {match.away_score}
						</div>
					</div>
				) : (
					<span className="text-gray-400">-</span>
				);
			case 'status':
				return (
					<Chip size="sm" color={getStatusColor(match.status)} variant="flat">
						{matchStatuses[match.status]}
					</Chip>
				);
			case 'actions':
				return (
					<Button
						size="sm"
						color="primary"
						variant={selectedMatchId === match.id ? 'solid' : 'bordered'}
						onPress={() => handleSelect(match)}
					>
						{selectedMatchId === match.id ? 'Vybraný' : 'Vybrat'}
					</Button>
				)
		}
	}

	return (
		<UnifiedModal
			isOpen={isOpen}
			onClose={onClose}
			title={'Vyberte zápas'}
			size="5xl"
			scrollBehavior="inside"
			footer={
				<Button variant="light" onPress={onClose}>
					Zavřít
				</Button>
			}
		>
			<div className="flex gap-4 mb-4">
				<Input
					placeholder="Hledat zápasy..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="flex-1"
				/>
				<Select
					placeholder="Stav zápasu"
					selectedKeys={[statusFilter]}
					onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
					className="w-48"
				>
					<>
						<SelectItem key="all">Všechny stavy</SelectItem>
						{Object.entries(matchStatuses).map(([key, value]) => (
							<SelectItem key={key}>{value}</SelectItem>
						))}
					</>
				</Select>
			</div>

			<UnifiedTable
				columns={columns}
				data={filteredMatches}
				renderCell={renderCells}
				isLoading={loading}
				emptyContent={'Žádné zápasy nenalezeny'}
				ariaLabel="Matches table"
			/>
		</UnifiedModal>
	);
}
