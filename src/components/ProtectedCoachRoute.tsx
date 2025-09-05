'use client';

import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody } from '@heroui/react';
import { useUser } from '@/contexts/UserContext';

interface ProtectedCoachRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}


export default function ProtectedCoachRoute({ 
  children, 
  fallback 
}: ProtectedCoachRouteProps) {
  const { user, userProfile, loading, isAuthenticated, isAdmin, isCoach, error } = useUser();

  // Check if user has access to coaches portal
  const hasAccess = isAuthenticated && (isCoach || isAdmin);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8">
            <div className="text-red-600 mb-4">
              <AcademicCapIcon className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Přístup zamítnut
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'Nemáte oprávnění pro přístup do trenérského portálu'}
            </p>
            <div className="space-y-3">
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => window.location.href = '/login?tab=coach'}
              >
                Přihlásit se
              </Button>
              <Button 
                variant="bordered" 
                className="w-full"
                onPress={() => window.location.href = '/'}
              >
                Zpět na hlavní stránku
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
