'use client';

import {useState, useEffect} from 'react';
import {usePlayerLoans} from '@/hooks/player/usePlayerLoans';
import {PlayerLoanWithDetails, PlayerLoanFilters} from '@/types/playerLoan';

interface PlayerLoansListProps {
  filters?: PlayerLoanFilters;
  showActions?: boolean;
  onLoanUpdated?: () => void;
}

export default function PlayerLoansList({
  filters = {},
  showActions = true,
  onLoanUpdated,
}: PlayerLoansListProps) {
  const {getLoans, endLoan, updateLoan, loading, error} = usePlayerLoans();
  const [loans, setLoans] = useState<PlayerLoanWithDetails[]>([]);

  useEffect(() => {
    loadLoans();
  }, [filters]);

  const loadLoans = async () => {
    const data = await getLoans(filters);
    setLoans(data);
  };

  const handleEndLoan = async (loanId: string) => {
    if (confirm('Opravdu chcete ukončit tuto půjčku?')) {
      const success = await endLoan(loanId);
      if (success) {
        loadLoans();
        onLoanUpdated?.();
      }
    }
  };

  const handleUpdateStatus = async (
    loanId: string,
    status: 'active' | 'expired' | 'terminated'
  ) => {
    const success = await updateLoan(loanId, {status});
    if (success) {
      loadLoans();
      onLoanUpdated?.();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      active: 'Aktivní',
      expired: 'Ukončená',
      terminated: 'Zrušená',
    };

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}
      >
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const getLoanTypeLabel = (type: string) => {
    const typeLabels = {
      temporary: 'Dočasná',
      permanent: 'Trvalá',
      youth: 'Mládežnická',
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Načítání půjček...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 p-4">
        <div className="text-sm text-red-800">Chyba při načítání půjček: {error}</div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="rounded bg-gray-50 p-8 text-center">
        <div className="text-sm text-gray-500">Žádné půjčky nenalezeny</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <div key={loan.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {loan.player.name} {loan.player.surname}
                </h3>
                <span className="text-xs text-gray-500">({loan.player.registration_number})</span>
                {getStatusBadge(loan.status)}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>
                    <strong>Z:</strong> {loan.from_club?.name || 'Neznámý klub'}
                  </span>
                  <span>→</span>
                  <span>
                    <strong>Do:</strong> {loan.to_club.name}
                  </span>
                </div>

                <div className="mt-1 flex items-center space-x-4">
                  <span>
                    <strong>Od:</strong> {formatDate(loan.loan_start_date)}
                  </span>
                  {loan.loan_end_date && (
                    <span>
                      <strong>Do:</strong> {formatDate(loan.loan_end_date)}
                    </span>
                  )}
                  <span>
                    <strong>Typ:</strong> {getLoanTypeLabel(loan.loan_type)}
                  </span>
                </div>

                {loan.notes && (
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Poznámky:</strong> {loan.notes}
                  </div>
                )}
              </div>
            </div>

            {showActions && loan.status === 'active' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEndLoan(loan.id)}
                  className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  Ukončit
                </button>
                <button
                  onClick={() => handleUpdateStatus(loan.id, 'terminated')}
                  className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  Zrušit
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
