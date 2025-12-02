import {FilterOptions, PaginationOptions, SortOptions} from '@/queries/shared/types';

export interface GetCommitteesOptions {
  sorting?: SortOptions[];
  pagination?: PaginationOptions;
  filters?: FilterOptions;
}
