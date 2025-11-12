'use client';
/**
 * Performance monitoring and metrics collection for match queries
 */

import {useState, useEffect, useCallback} from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface QueryPerformanceData {
  queryType: string;
  cacheHit: boolean;
  duration: number;
  resultCount: number;
  error?: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private queryMetrics: QueryPerformanceData[] = [];
  private maxMetrics = 1000; // Keep only last 1000 metrics

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      name,
      startTime: performance.now(),
      metadata,
    });
    return id;
  }

  /**
   * End timing a performance metric
   */
  endTiming(id: string): number | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`Performance metric ${id} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Clean up old metrics
    if (this.metrics.size > this.maxMetrics) {
      const oldestKey = this.metrics.keys().next().value;
      if (oldestKey) {
        this.metrics.delete(oldestKey);
      }
    }

    return duration;
  }

  /**
   * Record query performance data
   */
  recordQueryPerformance(data: Omit<QueryPerformanceData, 'timestamp'>): void {
    this.queryMetrics.push({
      ...data,
      timestamp: Date.now(),
    });

    // Keep only last 1000 query metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalMetrics: number;
    averageQueryDuration: number;
    cacheHitRate: number;
    errorRate: number;
    recentQueries: QueryPerformanceData[];
    slowestQueries: QueryPerformanceData[];
  } {
    const recentQueries = this.queryMetrics.slice(-50); // Last 50 queries
    const totalQueries = this.queryMetrics.length;

    if (totalQueries === 0) {
      return {
        totalMetrics: this.metrics.size,
        averageQueryDuration: 0,
        cacheHitRate: 0,
        errorRate: 0,
        recentQueries: [],
        slowestQueries: [],
      };
    }

    const averageQueryDuration =
      this.queryMetrics.reduce((sum, query) => sum + query.duration, 0) / totalQueries;

    const cacheHits = this.queryMetrics.filter((query) => query.cacheHit).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;

    const errors = this.queryMetrics.filter((query) => query.error).length;
    const errorRate = (errors / totalQueries) * 100;

    const slowestQueries = [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.size,
      averageQueryDuration,
      cacheHitRate,
      errorRate,
      recentQueries,
      slowestQueries,
    };
  }

  /**
   * Get query performance by type
   */
  getQueryPerformanceByType(): Record<
    string,
    {
      count: number;
      averageDuration: number;
      cacheHitRate: number;
      errorRate: number;
    }
  > {
    const byType: Record<string, QueryPerformanceData[]> = {};

    this.queryMetrics.forEach((query) => {
      if (!byType[query.queryType]) {
        byType[query.queryType] = [];
      }
      byType[query.queryType].push(query);
    });

    const result: Record<string, any> = {};

    Object.entries(byType).forEach(([type, queries]) => {
      const count = queries.length;
      const averageDuration = queries.reduce((sum, q) => sum + q.duration, 0) / count;
      const cacheHits = queries.filter((q) => q.cacheHit).length;
      const cacheHitRate = (cacheHits / count) * 100;
      const errors = queries.filter((q) => q.error).length;
      const errorRate = (errors / count) * 100;

      result[type] = {
        count,
        averageDuration,
        cacheHitRate,
        errorRate,
      };
    });

    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.queryMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    queryMetrics: QueryPerformanceData[];
    stats: ReturnType<PerformanceMonitor['getStats']>;
  } {
    return {
      metrics: Array.from(this.metrics.values()),
      queryMetrics: [...this.queryMetrics],
      stats: this.getStats(),
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to wrap query functions with performance monitoring
 */
export function withPerformanceMonitoring<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  queryType: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    let cacheHit = false;
    let error: string | undefined;

    try {
      const result = await queryFn(...args);
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = performance.now() - startTime;

      performanceMonitor.recordQueryPerformance({
        queryType,
        cacheHit,
        duration,
        resultCount: 0, // This would need to be passed from the query function
        error,
      });
    }
  };
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const [stats, setStats] = useState(performanceMonitor.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clear();
    setStats(performanceMonitor.getStats());
  }, []);

  const exportMetrics = useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);

  return {
    stats,
    clearMetrics,
    exportMetrics,
  };
}

/**
 * Performance timing decorator for class methods
 */
export function timed(metadata?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timingId = performanceMonitor.startTiming(
        `${target.constructor.name}.${propertyName}`,
        metadata
      );

      try {
        const result = await method.apply(this, args);
        return result;
      } finally {
        performanceMonitor.endTiming(timingId);
      }
    };

    return descriptor;
  };
}

export default performanceMonitor;
