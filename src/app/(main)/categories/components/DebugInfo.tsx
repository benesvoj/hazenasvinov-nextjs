'use client';

import { Card, CardHeader, CardBody, Button } from '@heroui/react';
import { useState } from 'react';

interface DebugInfoProps {
  categorySlug: string;
  debugInfo: any;
  error: Error | null;
}

export function DebugInfo({ categorySlug, debugInfo, error }: DebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!debugInfo && !error) return null;

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-orange-800">
            🐛 Debug Information
          </h3>
          <Button
            size="sm"
            variant="light"
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardBody>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Category Slug:</strong> {categorySlug}
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 rounded border border-red-200">
                <strong className="text-red-800">Error:</strong>
                <div className="text-red-700 mt-1">{error.message}</div>
              </div>
            )}
            
            {debugInfo && (
              <div className="space-y-2">
                {debugInfo.category && (
                  <div>
                    <strong>Category:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(debugInfo.category, null, 2)}
                    </pre>
                  </div>
                )}
                
                {debugInfo.season && (
                  <div>
                    <strong>Season:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(debugInfo.season, null, 2)}
                    </pre>
                  </div>
                )}
                
                {debugInfo.totalMatches !== undefined && (
                  <div>
                    <strong>Matches Summary:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>Total: {debugInfo.totalMatches}</li>
                      <li>Own Club: {debugInfo.ownClubMatches || 0}</li>
                      <li>Autumn: {debugInfo.autumnCount}</li>
                      <li>Spring: {debugInfo.springCount}</li>
                    </ul>
                  </div>
                )}
                
                {debugInfo.filtering && (
                  <div>
                    <strong>Filtering:</strong>
                    <div className="mt-1 p-2 bg-green-100 rounded text-xs">
                      {debugInfo.filtering}
                    </div>
                  </div>
                )}
                
                {debugInfo.error && (
                  <div className="p-3 bg-yellow-100 rounded border border-yellow-200">
                    <strong className="text-yellow-800">Debug Error:</strong>
                    <div className="text-yellow-700 mt-1">{debugInfo.error}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
              <strong className="text-blue-800">Troubleshooting Tips:</strong>
              <ul className="mt-2 ml-4 list-disc text-blue-700 text-xs space-y-1">
                <li>Check if the 'categories' table exists in your database</li>
                <li>Verify there's an active season (is_active = true)</li>
                <li>Ensure the 'teams' table exists with at least one team marked as 'is_own_club = true'</li>
                <li>Ensure the 'matches' table exists and has data with proper team_id references</li>
                <li>Check browser console for detailed error logs</li>
                <li>Verify your Supabase connection and environment variables</li>
              </ul>
            </div>
          </div>
        </CardBody>
      )}
    </Card>
  );
}
