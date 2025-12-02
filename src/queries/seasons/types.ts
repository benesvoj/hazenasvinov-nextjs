import {FilterOptions, PaginationOptions, SortOptions} from '@/queries/shared/types';

export interface GetSeasonsOptions {
  sorting?: SortOptions[];
  pagination?: PaginationOptions;
  filters?: FilterOptions;
}
