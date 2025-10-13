import React from 'react';

import {translations} from '@/lib';

/**
 * Betting Layout
 * Separate layout for the betting app without topbar/header
 * This provides a clean, focused experience for the betting system
 */
export default function BettingLayout({children}: {children: React.ReactNode}) {
  const t = translations.betting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* No Header/Topbar for betting app */}
      <main className="w-full">{children}</main>

      {/* Optional: Minimal footer for betting app */}
      <footer className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t.titleFooter} © 2025</span>
            <span>{t.playResponsibly}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
