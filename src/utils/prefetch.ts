import {dehydrate, DehydratedState} from '@tanstack/react-query';

import {getQueryClient} from '@/lib/getQueryClient';

/**
 * Prefetch a query on the server and return dehydrated state
 *
 * Use this in Server Components to fetch data on the server,
 * then hydrate it to the client via HydrationBoundary.
 *
 * @param queryKey - React Query key (e.g., ['seasons'])
 * @param queryFn - Function that fetches the data
 * @returns Dehydrated state to pass to HydrationBoundary
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function SeasonsPage() {
 *   const dehydratedState = await prefetchQuery(['seasons'], fetchSeasons);
 *
 *   return (
 *     <HydrationBoundary state={dehydratedState}>
 *       <SeasonsPageClient />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export async function prefetchQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>
): Promise<DehydratedState> {
  const queryClient = getQueryClient();

  // Prefetch the query on the server
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });

  // Return dehydrated state to pass to client
  return dehydrate(queryClient);
}

/**
 * Prefetch multiple queries on the server
 *
 * @example
 * ```typescript
 * const state = await prefetchQueries([
 *   {queryKey: ['seasons'], queryFn: fetchSeasons},
 *   {queryKey: ['categories'], queryFn: fetchCategories},
 * ]);
 * ```
 */
export async function prefetchQueries(
  queries: Array<{queryKey: string[]; queryFn: () => Promise<any>}>
): Promise<DehydratedState> {
  const queryClient = getQueryClient();

  // Prefetch all queries in parallel
  await Promise.all(
    queries.map(({queryKey, queryFn}) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
      })
    )
  );

  return dehydrate(queryClient);
}
