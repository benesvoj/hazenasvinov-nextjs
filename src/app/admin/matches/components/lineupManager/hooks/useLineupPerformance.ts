import {useEffect, useRef, useCallback} from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

interface UseLineupPerformanceOptions {
  componentName: string;
  logPerformance?: boolean;
  threshold?: number; // Warning threshold in ms
}

export function useLineupPerformance({
  componentName,
  logPerformance = false,
  threshold = 16, // 16ms = 60fps
}: UseLineupPerformanceOptions) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });

  const startTimeRef = useRef<number>(0);

  // Start timing before render
  useEffect(() => {
    startTimeRef.current = performance.now();
  });

  // Measure render time after render
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;

    const metrics = metricsRef.current;
    metrics.renderCount += 1;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    if (logPerformance) {
      console.log(`[${componentName}] Render #${metrics.renderCount}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
        totalRenders: metrics.renderCount,
      });
    }

    if (renderTime > threshold) {
      console.warn(
        `[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  });

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
    };
  }, []);

  const getMetrics = useCallback(() => {
    return {...metricsRef.current};
  }, []);

  return {
    metrics: metricsRef.current,
    resetMetrics,
    getMetrics,
  };
}

// Hook for monitoring specific operations
export function useOperationTimer(operationName: string) {
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;

    console.log(`[${operationName}] Operation completed in ${duration.toFixed(2)}ms`);

    return duration;
  }, [operationName]);

  const measureAsync = useCallback(
    async <T>(asyncOperation: () => Promise<T>): Promise<T> => {
      startTimer();
      try {
        const result = await asyncOperation();
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    },
    [startTimer, endTimer]
  );

  return {
    startTimer,
    endTimer,
    measureAsync,
  };
}
