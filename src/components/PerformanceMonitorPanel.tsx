/**
 * Performance monitoring component for development
 */

import React from 'react';
import {usePerformanceMonitoring} from '@/lib/performanceMonitor';

export function PerformanceMonitorPanel() {
  const {stats, clearMetrics, exportMetrics} = usePerformanceMonitoring();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <h4 style={{margin: '0 0 10px 0'}}>Performance Monitor</h4>
      <div>Total Metrics: {stats.totalMetrics}</div>
      <div>Avg Query Duration: {stats.averageQueryDuration.toFixed(2)}ms</div>
      <div>Cache Hit Rate: {stats.cacheHitRate.toFixed(1)}%</div>
      <div>Error Rate: {stats.errorRate.toFixed(1)}%</div>
      <div>Recent Queries: {stats.recentQueries.length}</div>

      <div style={{marginTop: '10px'}}>
        <button onClick={clearMetrics} style={{marginRight: '5px', fontSize: '10px'}}>
          Clear
        </button>
        <button onClick={() => console.log(exportMetrics())} style={{fontSize: '10px'}}>
          Export
        </button>
      </div>
    </div>
  );
}

export default PerformanceMonitorPanel;
