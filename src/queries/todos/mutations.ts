import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/todos';
import {TodoItem, TodoInsert} from '@/types';

/**
 * CRUD mutations for Todos
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<TodoItem, TodoInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<TodoItem, TodoInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createTodo = (ctx: QueryContext, data: TodoInsert) => getHelpers().create(ctx, data);

export const updateTodo = (ctx: QueryContext, id: string, data: Partial<TodoInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteTodo = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
