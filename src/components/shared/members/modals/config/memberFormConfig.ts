// Quick creation (matches context) — just basic fields
import {MemberFormSections} from "../types/memberFormModal";

export const QUICK_CREATE: MemberFormSections = {
	basic: true, contact: false, parent: false, medical: false, additional: false
};

// Full creation (lineups context) — all sections
export const FULL_CREATE: MemberFormSections = {
	basic: true, contact: true, parent: true, medical: true, additional: true
};

// Full edit (admin context) — all sections + payments tab
export const FULL_EDIT: MemberFormSections = {
	basic: true, contact: true, parent: true, medical: true, additional: true
};