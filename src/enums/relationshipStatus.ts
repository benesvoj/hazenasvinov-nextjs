import {translations} from '@/lib/translations';

const t = translations.relationshipStatus;

export enum RelationshipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  [RelationshipStatus.ACTIVE]: t.active,
  [RelationshipStatus.INACTIVE]: t.inactive,
  [RelationshipStatus.EXPIRED]: t.expired,
  [RelationshipStatus.TERMINATED]: t.terminated,
};

export const getRelationshipStatusOptions = () =>
  Object.entries(RELATIONSHIP_STATUS_LABELS).map(([value, label]) => ({
    value: value as RelationshipStatus,
    label,
  }));
