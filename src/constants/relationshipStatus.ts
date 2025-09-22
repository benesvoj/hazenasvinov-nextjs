export const RELATIONSHIP_STATUS = ['active', 'inactive', 'expired', 'terminated'] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUS)[number];
