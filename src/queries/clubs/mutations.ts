import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/clubs";
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Club, ClubInsert} from '@/types';

export async function createClub(ctx: QueryContext, data: ClubInsert): Promise<QueryResult<Club>> {
	try {
		const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
		const {data: club, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}

		return {
			data: club as unknown as Club,
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

export async function updateClub(
	ctx: QueryContext,
	id: string,
	data: Partial<ClubInsert>
): Promise<QueryResult<Club>> {
	try {
		const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
		const {data: club, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}
		return {
			data: club as unknown as Club,
			error: null,
		};
	} catch (err: any) {
		console.error(`Exception in update${ENTITY.singular}:`, err);
		return {
			data: null,
			error: err.message || 'Unknown error',
		};
	}
}

export async function deleteClub(
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
