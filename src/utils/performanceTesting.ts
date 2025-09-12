/**
 * Performance testing utilities for match queries
 */

import {performance} from 'perf_hooks';
import {
  getMatchesBasicOptimized,
  getMatchesWithTeamsOptimized,
  getMatchesSeasonalOptimized,
  getOwnClubMatchesOptimized,
} from '@/services/optimizedMatchQueries';
import {performanceMonitor} from '@/lib/performanceMonitor';
import type {MatchQueryOptions} from '@/services/matchQueries';

interface PerformanceTestResult {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  resultCount: number;
  cacheHit: boolean;
}

interface PerformanceTestSuite {
  name: string;
  tests: PerformanceTestResult[];
  totalDuration: number;
  averageDuration: number;
  successRate: number;
}

/**
 * Run a single performance test
 */
async function runPerformanceTest(
  testName: string,
  testFn: () => Promise<any>,
  expectedResultCount?: number
): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  let success = false;
  let error: string | undefined;
  let resultCount = 0;
  let cacheHit = false;

  try {
    const result = await testFn();
    resultCount = Array.isArray(result) ? result.length : result?.data?.length || 0;
    success = true;

    // Check if result count matches expectation
    if (expectedResultCount !== undefined && resultCount !== expectedResultCount) {
      console.warn(`Expected ${expectedResultCount} results, got ${resultCount}`);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    success = false;
  }

  const duration = performance.now() - startTime;

  // Record in performance monitor
  performanceMonitor.recordQueryPerformance({
    queryType: testName,
    cacheHit,
    duration,
    resultCount,
    error,
  });

  return {
    testName,
    duration,
    success,
    error,
    resultCount,
    cacheHit,
  };
}

/**
 * Run basic match query performance tests
 */
export async function runBasicMatchTests(
  categoryId: string,
  seasonId: string
): Promise<PerformanceTestResult[]> {
  const tests: PerformanceTestResult[] = [];

  // Test 1: Basic matches without team details
  tests.push(
    await runPerformanceTest('basic-matches-no-teams', () =>
      getMatchesBasicOptimized({categoryId, seasonId})
    )
  );

  // Test 2: Basic matches with limit
  tests.push(
    await runPerformanceTest('basic-matches-with-limit', () =>
      getMatchesBasicOptimized({categoryId, seasonId, limit: 10})
    )
  );

  // Test 3: Basic matches with date filter
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - 6);
  tests.push(
    await runPerformanceTest('basic-matches-date-filter', () =>
      getMatchesBasicOptimized({
        categoryId,
        seasonId,
        dateFrom: dateFrom.toISOString().split('T')[0],
      })
    )
  );

  return tests;
}

/**
 * Run team details match query performance tests
 */
export async function runTeamDetailsMatchTests(
  categoryId: string,
  seasonId: string
): Promise<PerformanceTestResult[]> {
  const tests: PerformanceTestResult[] = [];

  // Test 1: Matches with team details
  tests.push(
    await runPerformanceTest('matches-with-teams', () =>
      getMatchesWithTeamsOptimized({categoryId, seasonId})
    )
  );

  // Test 2: Matches with team details and own club filter
  tests.push(
    await runPerformanceTest('matches-with-teams-own-club', () =>
      getMatchesWithTeamsOptimized({categoryId, seasonId, ownClubOnly: true})
    )
  );

  // Test 3: Seasonal matches
  tests.push(
    await runPerformanceTest('seasonal-matches', () =>
      getMatchesSeasonalOptimized(categoryId, seasonId)
    )
  );

  // Test 4: Own club matches
  tests.push(
    await runPerformanceTest('own-club-matches', () =>
      getOwnClubMatchesOptimized(categoryId, seasonId)
    )
  );

  return tests;
}

/**
 * Run cache performance tests
 */
export async function runCachePerformanceTests(
  categoryId: string,
  seasonId: string
): Promise<PerformanceTestResult[]> {
  const tests: PerformanceTestResult[] = [];

  // Test 1: First query (cache miss)
  tests.push(
    await runPerformanceTest('cache-miss', () =>
      getMatchesWithTeamsOptimized({categoryId, seasonId})
    )
  );

  // Test 2: Second query (cache hit)
  tests.push(
    await runPerformanceTest('cache-hit', () =>
      getMatchesWithTeamsOptimized({categoryId, seasonId})
    )
  );

  // Test 3: Third query (cache hit)
  tests.push(
    await runPerformanceTest('cache-hit-2', () =>
      getMatchesWithTeamsOptimized({categoryId, seasonId})
    )
  );

  return tests;
}

/**
 * Run pagination performance tests
 */
export async function runPaginationTests(
  categoryId: string,
  seasonId: string
): Promise<PerformanceTestResult[]> {
  const tests: PerformanceTestResult[] = [];

  // Test different page sizes
  const pageSizes = [5, 10, 20, 50];

  for (const pageSize of pageSizes) {
    tests.push(
      await runPerformanceTest(`pagination-${pageSize}`, () =>
        getMatchesWithTeamsOptimized({
          categoryId,
          seasonId,
          limit: pageSize,
        })
      )
    );
  }

  return tests;
}

/**
 * Run concurrent query performance tests
 */
export async function runConcurrentTests(
  categoryId: string,
  seasonId: string,
  concurrency: number = 5
): Promise<PerformanceTestResult[]> {
  const tests: PerformanceTestResult[] = [];

  // Create concurrent queries
  const concurrentQueries = Array(concurrency)
    .fill(null)
    .map((_, index) =>
      runPerformanceTest(`concurrent-${index}`, () =>
        getMatchesWithTeamsOptimized({categoryId, seasonId})
      )
    );

  // Run all queries concurrently
  const results = await Promise.all(concurrentQueries);
  tests.push(...results);

  return tests;
}

/**
 * Run complete performance test suite
 */
export async function runPerformanceTestSuite(
  categoryId: string,
  seasonId: string
): Promise<PerformanceTestSuite> {
  const startTime = performance.now();
  const tests: PerformanceTestResult[] = [];

  console.log('🚀 Starting performance test suite...');

  // Run all test categories
  const basicTests = await runBasicMatchTests(categoryId, seasonId);
  tests.push(...basicTests);

  const teamDetailsTests = await runTeamDetailsMatchTests(categoryId, seasonId);
  tests.push(...teamDetailsTests);

  const cacheTests = await runCachePerformanceTests(categoryId, seasonId);
  tests.push(...cacheTests);

  const paginationTests = await runPaginationTests(categoryId, seasonId);
  tests.push(...paginationTests);

  const concurrentTests = await runConcurrentTests(categoryId, seasonId, 3);
  tests.push(...concurrentTests);

  const totalDuration = performance.now() - startTime;
  const averageDuration = tests.reduce((sum, test) => sum + test.duration, 0) / tests.length;
  const successRate = (tests.filter((test) => test.success).length / tests.length) * 100;

  const suite: PerformanceTestSuite = {
    name: 'Match Query Performance Test Suite',
    tests,
    totalDuration,
    averageDuration,
    successRate,
  };

  console.log('✅ Performance test suite completed');
  console.log(`Total duration: ${totalDuration.toFixed(2)}ms`);
  console.log(`Average duration: ${averageDuration.toFixed(2)}ms`);
  console.log(`Success rate: ${successRate.toFixed(1)}%`);

  return suite;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(suite: PerformanceTestSuite): string {
  const report = `
# Performance Test Report

## Summary
- **Test Suite**: ${suite.name}
- **Total Tests**: ${suite.tests.length}
- **Total Duration**: ${suite.totalDuration.toFixed(2)}ms
- **Average Duration**: ${suite.averageDuration.toFixed(2)}ms
- **Success Rate**: ${suite.successRate.toFixed(1)}%

## Test Results

${suite.tests
  .map(
    (test) => `
### ${test.testName}
- **Duration**: ${test.duration.toFixed(2)}ms
- **Success**: ${test.success ? '✅' : '❌'}
- **Result Count**: ${test.resultCount}
- **Cache Hit**: ${test.cacheHit ? '✅' : '❌'}
${test.error ? `- **Error**: ${test.error}` : ''}
`
  )
  .join('')}

## Performance Monitor Stats
${JSON.stringify(performanceMonitor.getStats(), null, 2)}
`;

  return report;
}

/**
 * Export performance test results to file
 */
export function exportPerformanceResults(suite: PerformanceTestSuite, filename?: string): void {
  const report = generatePerformanceReport(suite);
  const blob = new Blob([report], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `performance-test-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * React hook for running performance tests
 */
export function usePerformanceTesting() {
  const runTests = async (categoryId: string, seasonId: string) => {
    const suite = await runPerformanceTestSuite(categoryId, seasonId);
    return suite;
  };

  const runQuickTests = async (categoryId: string, seasonId: string) => {
    const tests = await runBasicMatchTests(categoryId, seasonId);
    return tests;
  };

  const exportResults = (suite: PerformanceTestSuite) => {
    exportPerformanceResults(suite);
  };

  return {
    runTests,
    runQuickTests,
    exportResults,
  };
}

const performanceTestingUtils = {
  runPerformanceTestSuite,
  runBasicMatchTests,
  runTeamDetailsMatchTests,
  runCachePerformanceTests,
  runPaginationTests,
  runConcurrentTests,
  generatePerformanceReport,
  exportPerformanceResults,
  usePerformanceTesting,
};

export default performanceTestingUtils;
