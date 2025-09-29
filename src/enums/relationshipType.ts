import {translations} from '@/lib/translations';

const t = translations.relationshipType;

export enum RelationshipType {
  PERMANENT = 'permanent',
  LOAN = 'loan',
  TEMPORARY = 'temporary',
  YOUTH_LOAN = 'youth_loan',
}

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  [RelationshipType.PERMANENT]: t.permanent,
  [RelationshipType.LOAN]: t.loan,
  [RelationshipType.TEMPORARY]: t.temporary,
  [RelationshipType.YOUTH_LOAN]: t.youthLoan,
};

export const getRelationshipTypeOptions = () =>
  Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => ({
    value: value as RelationshipType,
    label,
  }));
