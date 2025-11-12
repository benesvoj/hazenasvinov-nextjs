'use client';

import React, {createContext, useContext, useMemo} from 'react';

import {useFetchCategories, useFetchClubs, useFetchMembers, useFetchSeasons} from '@/hooks';
import {Category, Club, Member, Season} from '@/types';

// Type for each entity's state
interface EntityState<T> {
	data: T[];
	loading: boolean;
	error: string | Error | null;
	refetch: () => Promise<void> | void;
}

interface SeasonsState extends EntityState<Season> {
	activeSeason: Season | null;
}

interface CategoriesState extends EntityState<Category> {
	activeCategories: Category[];
}

interface MembersState extends EntityState<Member> {
	sortedMembers: Member[];
}

interface ClubsState extends EntityState<Club> {
}

interface AppDataContextType {
	seasons: SeasonsState;
	categories: CategoriesState;
	members: MembersState;
	clubs: ClubsState;

	// Global states
	loading: boolean;
	error: string | null;
	refreshAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({children}: { children: React.ReactNode }) {
	const {
		data: seasonsData,
		loading: seasonsLoading,
		error: seasonsError,
		refetch: seasonsRefetch
	} = useFetchSeasons();

	const {
		data: categoriesData,
		loading: categoriesLoading,
		error: categoriesError,
		refetch: categoriesRefetch
	} = useFetchCategories();

	const {
		data: membersData,
		loading: membersLoading,
		error: membersError,
		refetch: membersRefetch
	} = useFetchMembers();

	const {
		data: clubsData,
		loading: clubsLoading,
		errors: clubsError,
		refetch: clubsRefetch
	} = useFetchClubs();

	// Computed properties for categories
	const activeCategories = useMemo(
		() => categoriesData.filter((c: Category) => c.is_active),
		[categoriesData]
	);

	// Computed properties for members
	const sortedMembers = useMemo(
		() => [...membersData].sort((a, b) =>
			`${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`)
		),
		[membersData]
	);

	const activeSeason = useMemo(() => seasonsData.find((s: Season) => s.is_active) || null, [seasonsData]);

	// Global loading state
	const loading = useMemo(() =>
			seasonsLoading ||
			categoriesLoading ||
			membersLoading ||
			clubsLoading,
		[seasonsLoading, categoriesLoading, membersLoading, clubsLoading]
	);

	// Global error state
	const error = useMemo(() => {
		const errors = [
			seasonsError,
			categoriesError,
			membersError,
			clubsError,
		].filter(Boolean);

		return errors.length > 0
			? errors.map(e => e instanceof Error ? e.message : e).join('; ')
			: null;
	}, [seasonsError, categoriesError, membersError, clubsError]);

	// Global refresh
	const refreshAll = async () => {
		await Promise.all([
			seasonsRefetch(),
			categoriesRefetch(),
			membersRefetch(),
			clubsRefetch(),
		]);
	};

	const value: AppDataContextType = {
		seasons: {
			data: seasonsData,
			loading: seasonsLoading,
			error: seasonsError,
			refetch: seasonsRefetch,
			activeSeason
		},
		categories: {
			data: categoriesData,
			loading: categoriesLoading,
			error: categoriesError,
			refetch: categoriesRefetch,
			activeCategories,
		},
		members: {
			data: membersData,
			loading: membersLoading,
			error: membersError,
			refetch: membersRefetch,
			sortedMembers,
		},
		clubs: {
			data: clubsData,
			loading: clubsLoading,
			error: clubsError,
			refetch: clubsRefetch,
		},
		loading,
		error,
		refreshAll,
	};

	return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// Custom hook to use app data context
export function useAppData() {
	const context = useContext(AppDataContext);
	if (context === undefined) {
		throw new Error('useAppData must be used within an AppDataProvider');
	}
	return context;
}

// Safe version that returns undefined instead of throwing
export function useAppDataSafe() {
	const context = useContext(AppDataContext);
	return context;
}