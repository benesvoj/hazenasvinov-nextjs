import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/categories";
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Category, CategoryInsert} from '@/types';

export async function createCategory(
	ctx: QueryContext,
	data: CategoryInsert
): Promise<QueryResult<Category>> {
	try {
		const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
		const {data: category, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}

		return {
			data: category as unknown as Category,
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

export async function updateCategory(
	ctx: QueryContext,
	id: string,
	data: Partial<CategoryInsert>
): Promise<QueryResult<Category>> {
	try {
		const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
		const {data: category, error} = await query;

		if (error) {
			return {
				data: null,
				error: error.message,
			};
		}
		return {
			data: category as unknown as Category,
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

export async function deleteCategory(
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
		console.error(`Exception in delete${ENTITY.singular}: `, err);
		return {
			data: null,
			error: err.message || 'Unknown error',
		};
	}
}
