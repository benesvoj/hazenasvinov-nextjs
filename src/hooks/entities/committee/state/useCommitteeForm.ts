'use client';

import {createFormHook} from "@/hooks";
import {translations} from '@/lib';
import {Committee, CommitteeFormData} from '@/types';

const t = translations.admin.committees.responseMessages;
const initialFormData: CommitteeFormData = {
	code: '',
	name: '',
	description: '',
	is_active: true,
	sort_order: 0,
};

/**
 * Hook for managing committee form state
 * Handles: form data, validation, reset
 */
export const useCommitteeForm = createFormHook<Committee, CommitteeFormData>({
	initialFormData,
	validationRules: [
		{'field': 'code', 'message': t.mandatoryCode},
		{'field': 'name', 'message': t.mandatoryName}
	]
});