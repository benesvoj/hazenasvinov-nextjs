import {useState, useCallback, useRef} from 'react';

import {showToast} from '@/components';

export interface LineupError {
  id: string;
  type: 'validation' | 'network' | 'database' | 'permission' | 'unknown';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;
}

interface UseLineupErrorHandlerOptions {
  maxErrors?: number;
  autoRetry?: boolean;
  retryDelay?: number;
  onError?: (error: LineupError) => void;
}

export function useLineupErrorHandler({
  maxErrors = 10,
  autoRetry = false,
  retryDelay = 1000,
  onError,
}: UseLineupErrorHandlerOptions = {}) {
  const [errors, setErrors] = useState<LineupError[]>([]);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addError = useCallback(
    (
      type: LineupError['type'],
      message: string,
      context?: Record<string, any>,
      retryable: boolean = false
    ) => {
      const error: LineupError = {
        id: generateErrorId(),
        type,
        message,
        timestamp: new Date(),
        context,
        retryable,
      };

      setErrors((prev) => {
        const newErrors = [error, ...prev].slice(0, maxErrors);
        return newErrors;
      });

      // Call the onError callback
      if (onError) {
        onError(error);
      }

      // Show appropriate toast based on error type
      switch (type) {
        case 'validation':
          showToast.warning(`⚠️ ${message}`);
          break;
        case 'network':
          showToast.danger(`🌐 ${message}`);
          break;
        case 'database':
          showToast.danger(`🗄️ ${message}`);
          break;
        case 'permission':
          showToast.danger(`🔒 ${message}`);
          break;
        default:
          showToast.danger(`❌ ${message}`);
      }

      return error;
    },
    [generateErrorId, maxErrors, onError]
  );

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    retryCountRef.current.clear();
  }, []);

  const retryOperation = useCallback(
    async (operation: () => Promise<any>, errorId: string, maxRetries: number = 3) => {
      const retryCount = retryCountRef.current.get(errorId) || 0;

      if (retryCount >= maxRetries) {
        addError('unknown', 'Maximální počet opakování byl překročen');
        return;
      }

      retryCountRef.current.set(errorId, retryCount + 1);

      try {
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }

        const result = await operation();
        removeError(errorId);
        retryCountRef.current.delete(errorId);
        return result;
      } catch (error) {
        if (retryCount + 1 < maxRetries) {
          addError('network', `Opakování selhalo (${retryCount + 1}/${maxRetries})`);
          return retryOperation(operation, errorId, maxRetries);
        } else {
          addError('unknown', 'Operace se nepodařila ani po opakování');
          throw error;
        }
      }
    },
    [addError, removeError, retryDelay]
  );

  const handleAsyncOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      errorContext: string,
      retryable: boolean = false
    ): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
        const errorType = determineErrorType(error);

        const lineupError = addError(
          errorType,
          `${errorContext}: ${errorMessage}`,
          {
            originalError: error,
            context: errorContext,
          },
          retryable
        );

        if (retryable && autoRetry) {
          try {
            return await retryOperation(operation, lineupError.id);
          } catch (retryError) {
            // Retry failed, error already handled
            return null;
          }
        }

        return null;
      }
    },
    [addError, autoRetry, retryOperation]
  );

  const determineErrorType = useCallback((error: any): LineupError['type'] => {
    if (error?.message?.includes('validation') || error?.message?.includes('Validation')) {
      return 'validation';
    }
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'network';
    }
    if (error?.message?.includes('database') || error?.message?.includes('SQL')) {
      return 'database';
    }
    if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
      return 'permission';
    }
    return 'unknown';
  }, []);

  const getErrorsByType = useCallback(
    (type: LineupError['type']) => {
      return errors.filter((error) => error.type === type);
    },
    [errors]
  );

  const hasErrors = errors.length > 0;
  const hasRetryableErrors = errors.some((error) => error.retryable);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    retryOperation,
    handleAsyncOperation,
    getErrorsByType,
    hasErrors,
    hasRetryableErrors,
  };
}
