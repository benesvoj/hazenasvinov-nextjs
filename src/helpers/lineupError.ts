import {LineupErrorType} from '@/enums';
import {LineupError, UnknownErrorShape} from '@/types';

export const classifyLineupError = (error: UnknownErrorShape): LineupError => {
  const message = error?.message || error?.details || error?.hint || 'Neznámá chyba';

  // Primary classification based on error structure and codes
  if (error?.code === LineupErrorType.VALIDATION || error?.type === 'validation') {
    return {
      type: LineupErrorType.VALIDATION,
      message,
      code: error?.code,
    };
  }

  // Database error classification
  if (
    error?.code?.startsWith('23') || // PostgreSQL constraint violations
    error?.code?.startsWith('42') || // PostgreSQL syntax errors
    error?.code?.startsWith('22') || // PostgreSQL data type errors
    error?.code?.startsWith('25') || // PostgreSQL invalid transaction state
    error?.code?.startsWith('26') || // PostgreSQL invalid name
    error?.code?.startsWith('27') || // PostgreSQL triggered data change violation
    error?.code?.startsWith('28') || // PostgreSQL invalid authorization specification
    error?.code?.startsWith('2D') || // PostgreSQL invalid transaction termination
    error?.code?.startsWith('2F') || // PostgreSQL SQL routine exception
    error?.code?.startsWith('34') || // PostgreSQL invalid cursor name
    error?.code?.startsWith('38') || // PostgreSQL external routine exception
    error?.code?.startsWith('39') || // PostgreSQL external routine invocation exception
    error?.code?.startsWith('3B') || // PostgreSQL savepoint exception
    error?.code?.startsWith('40') || // PostgreSQL transaction rollback
    error?.code?.startsWith('42') || // PostgreSQL syntax error or access rule violation
    error?.code?.startsWith('44') || // PostgreSQL with check option violation
    error?.code?.startsWith('53') || // PostgreSQL insufficient resources
    error?.code?.startsWith('54') || // PostgreSQL program limit exceeded
    error?.code?.startsWith('55') || // PostgreSQL object not in prerequisite state
    error?.code?.startsWith('57') || // PostgreSQL operator intervention
    error?.code?.startsWith('58') || // PostgreSQL system error
    error?.code?.startsWith('72') || // PostgreSQL snapshot too old
    error?.code?.startsWith('F0') || // PostgreSQL configuration file error
    error?.code?.startsWith('HV') || // PostgreSQL foreign data wrapper error
    error?.code?.startsWith('P0') || // PostgreSQL PL/pgSQL error
    error?.code?.startsWith('XX') || // PostgreSQL internal error
    message.includes('duplicate key') ||
    message.includes('constraint') ||
    message.includes('violates') ||
    message.includes('foreign key') ||
    message.includes('unique constraint')
  ) {
    return {
      type: LineupErrorType.DATABASE,
      message,
      code: error?.code,
    };
  }

  // Network error classification
  if (
    error?.name === 'NetworkError' ||
    (error?.name === 'TypeError' && message.includes('fetch')) ||
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ENOTFOUND' ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ENOTFOUND')
  ) {
    return {
      type: LineupErrorType.NETWORK,
      message,
      code: error?.code,
    };
  }

  // Fallback: Check for validation patterns in message (less reliable but better than nothing)
  if (
    message.includes('Musí být alespoň') ||
    message.includes('Nemůže být více než') ||
    message.includes('Celkem musí být') ||
    message.includes('brankář') ||
    message.includes('hráč') ||
    message.includes('trenér')
  ) {
    return {
      type: LineupErrorType.VALIDATION,
      message,
      code: error?.code,
    };
  }

  // Default to unknown error
  return {
    type: LineupErrorType.UNKNOWN,
    message,
    code: error?.code,
  };
};
