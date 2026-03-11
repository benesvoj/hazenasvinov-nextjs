import {Genders, MemberFunction} from '@/enums';

/**
 * Represents the filters used for a member table query. Each property of this type
 * can be utilized to filter the dataset based on various criteria such as sex, category,
 * or function.
 *
 * @property gender - Specifies the gender to filter members by. Supports predefined gender values.
 * @property category_id - Represents the identifier for a specific category to filter members.
 * @property function - Indicates a specific role or function to filter members.
 * @property isActive - A boolean flag to filter members based on their active status.
 */
export type MemberTableFilters = {
  gender?: Genders;
  category_id?: string;
  function?: MemberFunction;
  isActive?: boolean;
};
