'use client';

import { Tabs, Tab, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Badge, Spinner } from '@heroui/react';
import { Match } from '@/types/types';
import { formatDate, formatTimeString } from '@/helpers/formatDate';
import { SeasonalMatchesFallback } from './SeasonalMatchesFallback';

interface SeasonalMatchesProps {
  categoryId: string;
  categoryName: string;
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  loading: boolean;
}

export function SeasonalMatches({ categoryId, categoryName, matches, loading }: SeasonalMatchesProps) {
  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'upcoming':
        return 'primary';
      default:
        return 'default';
    }
  };

  // TODO: make a helper for this
  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Odehráno';
      case 'upcoming':
        return 'Neodehráno';
      default:
        return status;
    }
  };

  // TODO: use helper from @/helpers/formatDate
  const formatMatchDate = (dateString: string) => {
    try {
      return formatDate(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const renderMatchesTable = (seasonMatches: Match[], seasonName: string) => {
    if (seasonMatches.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>Pro {seasonName} zatím nejsou k dispozici žádné zápasy.</p>
          <p className="text-sm mt-2">
            Zápasy se zobrazí po jejich naplánování.
          </p>
        </div>
      );
    }

            return (
          <Table aria-label={`Zápasy ${seasonName} pro ${categoryName}`}>
            <TableHeader>
              <TableColumn>Datum & Čas</TableColumn>
              <TableColumn>Kolo</TableColumn>
              <TableColumn>Domácí</TableColumn>
              <TableColumn>Hosté</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Skóre</TableColumn>
            </TableHeader>
            <TableBody>
              {seasonMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{formatMatchDate(match.date)}</div>
                      {match.time && (
                        <div className="text-sm text-gray-600">{formatTimeString(match.time)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {match.matchweek ? `${match.matchweek}. kolo` : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {match.home_team?.name || 'Neznámý tým'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {match.away_team?.name || 'Neznámý tým'}
                  </TableCell>
                  <TableCell>
                    <Badge color={getMatchStatusColor(match.status)}>
                      {getMatchStatusText(match.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {match.status === 'completed' ? (
                      <span className="font-bold">
                        {match.home_score} : {match.away_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Zápasy - {categoryName}</h2>
        </CardHeader>
        <CardBody className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  // Check if there are any matches at all
  if (matches.autumn.length === 0 && matches.spring.length === 0) {
    return <SeasonalMatchesFallback categoryName={categoryName} />;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Zápasy - {categoryName}</h2>
      </CardHeader>
      <CardBody>
        <Tabs aria-label="Sezónní zápasy">
          <Tab key="autumn" title="Podzim">
            <div className="pt-4">
              {renderMatchesTable(matches.autumn, 'podzim')}
            </div>
          </Tab>
          <Tab key="spring" title="Jaro">
            <div className="pt-4">
              {renderMatchesTable(matches.spring, 'jaro')}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}
