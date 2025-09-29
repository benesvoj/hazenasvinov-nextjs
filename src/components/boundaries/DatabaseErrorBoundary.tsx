'use client';

import React, {Component, ErrorInfo, ReactNode} from 'react';

import {translations} from '@/lib/translations';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'users' | 'general' | 'other';
}

export default class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null, errorType: 'other'};
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a database permission error
    if (
      error.message.includes('permission denied') ||
      error.message.includes('permission denied for table')
    ) {
      // Log the error details to help with debugging
      console.log('DatabaseErrorBoundary caught permission error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Determine the specific type of permission error
      let errorType: 'users' | 'general' | 'other' = 'general';

      if (error.message.includes('permission denied for table users')) {
        errorType = 'users';
      } else if (error.message.includes('permission denied')) {
        errorType = 'general';
      }

      return {hasError: true, error, errorType};
    }

    // For other errors, let them bubble up
    return {hasError: false, error: null, errorType: 'other'};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DatabaseErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback for database permission errors
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Different messages based on error type
      const getErrorMessage = () => {
        switch (this.state.errorType) {
          case 'users':
            return {
              title: 'Omezený přístup k uživatelským datům',
              description:
                'Tato stránka se pokusila načíst informace o uživatelích, ale nemá k nim přístup.',
              note: 'Chyba "permission denied for table users" je normální pro nepřihlášené uživatele. Aplikace používá fallback uživatele pro správné fungování.',
            };
          case 'general':
            return {
              title: 'Omezený přístup k datům',
              description: 'Některá data nejsou dostupná pro nepřihlášené uživatele.',
              note: 'Pro plný přístup se přihlaste pomocí Supabase Auth.',
            };
          default:
            return {
              title: 'Chyba databáze',
              description: 'Došlo k neočekávané chybě při přístupu k datům.',
              note: 'Zkuste stránku obnovit nebo kontaktujte správce.',
            };
        }
      };

      const errorInfo = getErrorMessage();

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-blue-800 mb-2">{errorInfo.title}</h3>
            <p className="text-sm text-blue-700 mb-4">{errorInfo.description}</p>
            <div className="space-y-2">
              <p className="text-xs text-blue-600">
                <strong>Poznámka:</strong> {errorInfo.note}
              </p>
              {this.state.errorType !== 'other' && (
                <a
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Přihlásit se
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
