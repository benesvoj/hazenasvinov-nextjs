import {Category, Member} from "@/types";

export interface MemberFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** null = create mode, Member = edit mode */
	member: Member | null;
	/** Which form sections to show */
	sections?: MemberFormSections;
	/** Available categories (required when showing category picker) */
	categories?: Category[];
	/** Pre-set category (e.g., when creating from lineup context) */
	defaultCategoryId?: string;
	/** Called after successful create/update */
	onSuccess: (member: Member) => void;
	/** Show payments tab in edit mode */
	showPaymentsTab?: boolean;
}

export interface MemberFormSections {
	basic: boolean;       // always true
	contact: boolean;     // default: false
	parent: boolean;      // default: false
	medical: boolean;     // default: false
	additional: boolean;  // default: false
}