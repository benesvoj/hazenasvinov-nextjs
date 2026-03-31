'use client';

import React from 'react';

import {useRouter} from 'next/navigation';

import {Button} from '@heroui/button';
import {Card, CardBody} from '@heroui/card';

import {APP_ROUTES} from '@/lib/app-routes';
import {PortalVariant} from '@/lib/portal';
import {translations} from '@/lib/translations';

import {Heading, LoadingSpinner} from '@/components';
import {useAuthorization, UserRoles} from '@/shared/auth';
import {commonCopy} from '@/shared/copy';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  variant?: PortalVariant;
}

export default function ProtectedRoute({
  children,
  fallback,
  redirectTo = APP_ROUTES.public.home,
  variant,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {loading, hasAccess, isAuthenticated} = useAuthorization(variant);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label={translations.common.loading} />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8">
            <Heading size={1}>{commonCopy.labels.accessDenied}</Heading>

            <p className="text-gray-600 mb-6">
              {!isAuthenticated
                ? commonCopy.labels.isNotAuthenticated
                : commonCopy.labels.insufficientRights}
            </p>

            <div className="space-y-3">
              {!isAuthenticated && (
                <Button
                  color="primary"
                  className="w-full"
                  onPress={() => router.push(APP_ROUTES.coaches.login)}
                >
                  {commonCopy.actions.login}
                </Button>
              )}

              <Button variant="bordered" className="w-full" onPress={() => router.push(redirectTo)}>
                {commonCopy.actions.back}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
