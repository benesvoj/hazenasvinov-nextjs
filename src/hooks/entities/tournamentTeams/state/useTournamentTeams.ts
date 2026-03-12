'use client';

import {useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';

export function useTournamentTeams(tournamentId: string) {
  const [loading, setLoading] = useState<boolean>(false);

  const addTeam = async (teamId: string, seedOrder: number) => {
    setLoading(true);

    try {
      await fetch(API_ROUTES.tournaments.teams(tournamentId), {
        method: 'POST',
        body: JSON.stringify({team_id: teamId, seed_order: seedOrder}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error adding team to tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTeam = async (teamId: string) => {
    setLoading(true);
    try {
      await fetch(API_ROUTES.tournaments.teamById(tournamentId, teamId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error removing team from tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSeedOrder = async (teams: Array<{teamId: string; seedOrder: number}>) => {
    setLoading(true);
    try {
      await fetch(API_ROUTES.tournaments.teams(tournamentId), {
        method: 'PATCH',
        body: JSON.stringify({teams}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error updating seed order:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    addTeam,
    removeTeam,
    updateSeedOrder,
  };
}
