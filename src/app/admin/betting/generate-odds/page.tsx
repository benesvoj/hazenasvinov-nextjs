'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Button, Input, Spinner} from '@heroui/react';

import {generateOddsForUpcomingMatches, getMatchesWithOdds} from '@/services';

/**
 * Admin page to generate odds for upcoming matches
 * Navigate to: /admin/betting/generate-odds
 */
export default function GenerateOddsPage() {
  const [days, setDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{count: number; matchIds: string[]} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🎲 Generating odds for next ${days} days...`);
      const count = await generateOddsForUpcomingMatches(days);

      // Get all matches with odds
      const matchIds = await getMatchesWithOdds(100);

      setResult({count, matchIds});
      console.log(`✅ Success! Generated odds for ${count} matches`);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Generate Betting Odds</h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Generate Odds for Upcoming Matches</h2>
        </CardHeader>
        <CardBody className="gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              Look ahead (days)
            </label>
            <Input
              type="number"
              value={days.toString()}
              onChange={(e) => setDays(parseInt(e.target.value) || 7)}
              min={1}
              max={90}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate odds for matches in the next {days} days
            </p>
          </div>

          <Button
            color="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" color="white" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              'Generate Odds'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
              <p className="font-semibold text-lg mb-2">✅ Success!</p>
              <p className="text-sm">Generated odds for {result.count} matches</p>
              <p className="text-sm mt-2">Total matches with odds: {result.matchIds.length}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">How it works</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">1. Analyzes Team Performance</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Reviews last 15 matches for each team (wins, draws, losses, goals)
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2. Calculates Probabilities</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Uses statistical models and Poisson distribution for accurate predictions
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">3. Generates Odds</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Converts probabilities to odds with 5% bookmaker margin
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">4. Saves to Database</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Stores 1X2, Both Teams Score, and Over/Under 2.5 odds
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>💡 Tip:</strong> Run this daily to keep odds up-to-date with latest team
          performance. Odds are automatically displayed on the betting page.
        </p>
      </div>
    </div>
  );
}
