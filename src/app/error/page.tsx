'use client';

/**
 * The page auth failures redirect to — an expired password-reset link, a denied
 * OAuth grant, a confirmation that no longer resolves. It reads `error`,
 * `error_code` and `error_description` from the query string and the hash,
 * because Supabase puts them in either depending on the flow.
 *
 * This lived at src/app/error.tsx, which in the App Router is an error
 * boundary and not a route. Ten redirect sites point at /error — the auth
 * callback, the confirm route, the server actions — and every one of them
 * landed on a 404 in production while this file sat one directory up looking
 * like it was serving them.
 */

import {Suspense} from 'react';

import {useRouter, useSearchParams} from 'next/navigation';

import {Button, Card, CardBody} from '@heroui/react';

import {ExclamationTriangleIcon, LockClosedIcon} from '@heroicons/react/24/outline';

import {APP_ROUTES} from '@/lib/app-routes';

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get error parameters from both query params and hash
  const error =
    searchParams.get('error') ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.substring(1)).get('error')
      : null);
  const errorCode =
    searchParams.get('error_code') ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.substring(1)).get('error_code')
      : null);
  const errorDescription =
    searchParams.get('error_description') ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.substring(1)).get('error_description')
      : null);

  // No logging here. This used to print window.location.hash to the console,
  // and on an auth redirect that hash carries access_token and refresh_token —
  // auth/callback reads them from exactly there. An error in the middle of that
  // flow would have put a live token in the browser console. Everything worth
  // seeing is on screen already.

  // Handle specific password reset errors
  if (errorCode === 'otp_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Odkaz vypršel</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Odkaz pro obnovení hesla vypršel. Požádejte o nový odkaz pro obnovení hesla.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Řešení:</strong> Požádejte administrátora o odeslání nového emailu pro
                obnovení hesla.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                color="primary"
                onPress={() => router.push(APP_ROUTES.auth.resetPassword)}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>

              <Button
                variant="light"
                onPress={() => router.push(APP_ROUTES.auth.login)}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Handle missing parameters errors
  if (errorCode === 'missing_parameters') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Neplatný odkaz
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Odkaz pro obnovení hesla neobsahuje všechny potřebné parametry. Požádejte o nový
              odkaz.
            </p>

            <div className="space-y-3">
              <Button
                color="primary"
                onPress={() => router.push(APP_ROUTES.auth.resetPassword)}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>

              <Button
                variant="light"
                onPress={() => router.push(APP_ROUTES.auth.login)}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Handle access denied errors
  if (errorCode === 'access_denied') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Přístup zamítnut
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Odkaz pro obnovení hesla je neplatný nebo vypršel.
            </p>

            <div className="space-y-3">
              <Button
                color="primary"
                onPress={() => router.push(APP_ROUTES.auth.resetPassword)}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>

              <Button
                variant="light"
                onPress={() => router.push(APP_ROUTES.auth.login)}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Generic error fallback
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardBody className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Něco se pokazilo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {errorDescription || 'Došlo k neočekávané chybě. Zkuste to prosím znovu.'}
          </p>

          <div className="space-y-3">
            <Button
              color="primary"
              onPress={() => router.push(APP_ROUTES.public.home)}
              className="w-full"
            >
              Přejít na úvodní stránku
            </Button>

            <Button
              variant="light"
              onPress={() => router.push(APP_ROUTES.auth.login)}
              className="w-full"
            >
              Přejít na přihlášení
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <Card className="w-full max-w-md">
            <CardBody className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Načítání...</p>
            </CardBody>
          </Card>
        </div>
      }
    >
      <ErrorPageContent />
    </Suspense>
  );
}
