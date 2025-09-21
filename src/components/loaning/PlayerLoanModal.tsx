'use client';

import {useState} from 'react';

interface PlayerLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId?: string;
  onLoanCreated?: () => void;
}

export default function PlayerLoanModal({
  isOpen,
  onClose,
  playerId,
  onLoanCreated,
}: PlayerLoanModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement loan creation logic
    console.log('Creating loan for player:', playerId);

    setTimeout(() => {
      setLoading(false);
      onLoanCreated?.();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vytvořit půjčku hráče</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cílový klub</label>
            <select
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Vyberte klub</option>
              {/* TODO: Load clubs from API */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Typ půjčky</label>
            <select
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Vyberte typ</option>
              <option value="temporary">Dočasná</option>
              <option value="permanent">Trvalá</option>
              <option value="youth">Mládežnická</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Datum začátku</label>
            <input
              type="date"
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Datum konce</label>
            <input
              type="date"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Vytváření...' : 'Vytvořit půjčku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
