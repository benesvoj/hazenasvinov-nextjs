import {FilterOptions, PaginationOptions, SortOptions} from '@/queries/shared/types';

export interface GetCommentsOptions {
  sorting?: SortOptions[];
  pagination?: PaginationOptions;
  filters?: FilterOptions;
}
