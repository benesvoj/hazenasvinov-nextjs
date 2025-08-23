'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { translations } from '@/lib/translations'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  fallback, 
  requireAuth = true,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            {translations.authenticationRequired || 'Vyžadováno přihlášení'}
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            {translations.loginRequiredForAccess || 'Pro přístup k této stránce se musíte přihlásit.'}
          </p>
          <a
            href={redirectTo}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            {translations.login || 'Přihlásit se'}
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
