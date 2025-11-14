'use client';

import {createFormHook} from "@/hooks";
import {translations} from "@/lib";
import {Season, SeasonFormData} from "@/types";

const t = translations.admin.seasons.responseMessages
const initialFormData: SeasonFormData = {
	name: '',
	start_date: '',
	end_date: '',
	is_active: false,
	is_closed: false,
}

export const useSeasonForm = createFormHook<Season, SeasonFormData>({
	initialFormData,
	validationRules: [
		{field: 'name', message: t.mandatoryName},
		{field: 'start_date', message: t.mandatoryStartDate},
	],
});