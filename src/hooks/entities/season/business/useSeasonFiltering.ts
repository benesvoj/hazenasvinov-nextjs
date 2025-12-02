import {Season} from "@/types";
import {useMemo} from "react";

interface SeasonFilteringProps {
	seasons: Season[];
}

export const useSeasonFiltering = ({seasons}:SeasonFilteringProps) => {

	const activeSeason = seasons.find(season => season.is_active);

	const sortedSeasons = useMemo(() => {
		return (
			seasons?.sort((a, b) => {
				if (!a.start_date) return 1;
				if (!b.start_date) return -1;
				return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
			}) || []
		);
	}, [seasons]);

	return {
		activeSeason,
		sortedSeasons,
	}
}