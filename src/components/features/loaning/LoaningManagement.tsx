'use client';

import {useState, useEffect, useCallback} from 'react';

import {PlayerLoanFilters} from '@/types/entities/member/business/playerLoan';

import {usePlayerLoans} from '@/hooks/entities/player/usePlayerLoans';
import {useUnifiedPlayers} from '@/hooks/entities/player/useUnifiedPlayers';

import PlayerLoansList from './PlayerLoansList';

interface LoaningManagementProps {
  clubId?: string;
  playerId?: string;
}

export default function LoaningManagement({clubId, playerId}: LoaningManagementProps) {
  const {getLoanStats, loading: statsLoading} = usePlayerLoans();
  const {getPlayersByClub} = useUnifiedPlayers();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<PlayerLoanFilters>({});
  const [stats, setStats] = useState({
    total_loans: 0,
    active_loans: 0,
    expired_loans: 0,
    loaned_in: 0,
    loaned_out: 0,
  });

  const loadStats = useCallback(async () => {
    const statsData = await getLoanStats(clubId);
    setStats(statsData);
  }, [getLoanStats, clubId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLoanCreated = () => {
    loadStats();
    setShowCreateModal(false);
  };

  const handleFilterChange = (newFilters: Partial<PlayerLoanFilters>) => {
    setFilters((prev) => ({...prev, ...newFilters}));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Správa půjček hráčů</h2>
          <p className="text-sm text-gray-600">Spravujte půjčky hráčů mezi kluby</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nová půjčka
        </button>
      </div>

      {/* Statistics */}
      {!statsLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{stats.total_loans}</div>
            <div className="text-sm text-gray-600">Celkem půjček</div>
          </div>
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.active_loans}</div>
            <div className="text-sm text-gray-600">Aktivní</div>
          </div>
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-600">{stats.expired_loans}</div>
            <div className="text-sm text-gray-600">Ukončené</div>
          </div>
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.loaned_in}</div>
            <div className="text-sm text-gray-600">Půjčeno dovnitř</div>
          </div>
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{stats.loaned_out}</div>
            <div className="text-sm text-gray-600">Půjčeno ven</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Filtry</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({status: (e.target.value as any) || undefined})}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Všechny</option>
              <option value="active">Aktivní</option>
              <option value="expired">Ukončené</option>
              <option value="terminated">Zrušené</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Typ půjčky</label>
            <select
              value={filters.loan_type || ''}
              onChange={(e) =>
                handleFilterChange({loan_type: (e.target.value as any) || undefined})
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Všechny</option>
              <option value="temporary">Dočasná</option>
              <option value="permanent">Trvalá</option>
              <option value="youth">Mládežnická</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Od data</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange({date_from: e.target.value || undefined})}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Do data</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange({date_to: e.target.value || undefined})}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Loans List */}
      <PlayerLoansList filters={filters} onLoanUpdated={loadStats} />

      {/* Create Loan Modal - TODO: Implement PlayerLoanModal component */}
    </div>
  );
}
