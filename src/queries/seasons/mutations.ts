import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/seasons";
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Season, SeasonInsert} from '@/types';

export async function createSeason(
	ctx: QueryContext,
	data: SeasonInsert
): Promise<QueryResult<Season>> {
	try {
		const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
		const {data: season, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}

		return {
			data: season as unknown as Season,
			error: null,
		};
	} catch (err: any) {
		console.error(`Exception in create${ENTITY.singular}:`, err);
		return {
			data: null,
			error: err.message || 'Unknown error',
		};
	}
}

export async function updateSeason(
	ctx: QueryContext,
	id: string,
	data: Partial<SeasonInsert>
): Promise<QueryResult<Season>> {
	try {
		const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
		const {data: season, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}
		return {
			data: season as unknown as Season,
			error: null,
		};
	} catch (err: any) {
		console.error(`Exception in update${ENTITY.singular}`, err);
		return {
			data: null,
			error: err.message || 'Unknown error',
		};
	}
}

export async function deleteSeason(
	ctx: QueryContext,
	id: string
): Promise<QueryResult<{ success: boolean }>> {
	try {
		const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
		const {error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}

		return {
			data: {success: true},
			error: null,
		};
	} catch (err: any) {
		console.error(`Exception in delete${ENTITY.singular}:`, err);
		return {
			data: null,
			error: err.message || 'Unknown error',
		};
	}
}
