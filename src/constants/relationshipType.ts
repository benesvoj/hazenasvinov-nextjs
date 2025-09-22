export const RELATIONSHIP_TYPE = ['permanent', 'loan', 'temporary', 'youth_loan'] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPE)[number];
