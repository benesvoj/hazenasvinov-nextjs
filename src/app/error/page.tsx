'use client'

import { useSearchParams } from 'next/navigation'
import { Button, Card, CardBody, CardHeader } from '@heroui/react'
import { LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get error parameters from both query params and hash
  const error = searchParams.get('error') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)).get('error') : null)
  const errorCode = searchParams.get('error_code') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)).get('error_code') : null)
  const errorDescription = searchParams.get('error_description') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)).get('error_description') : null)
  
  // Debug logging
  console.log('Error page parameters:', { error, errorCode, errorDescription, hash: typeof window !== 'undefined' ? window.location.hash : 'N/A' })
  
  // Handle specific password reset errors
  if (errorCode === 'otp_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Odkaz vypršel
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Odkaz pro obnovení hesla vypršel. Požádejte o nový odkaz pro obnovení hesla.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Řešení:</strong> Požádejte administrátora o odeslání nového emailu pro obnovení hesla.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                color="primary" 
                onPress={() => router.push('/reset-password')}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>
              
              <Button 
                variant="light" 
                onPress={() => router.push('/login')}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }
  
  // Handle missing parameters errors
  if (errorCode === 'missing_parameters') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Neplatný odkaz
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Odkaz pro obnovení hesla neobsahuje všechny potřebné parametry. Požádejte o nový odkaz.
            </p>
            
            <div className="space-y-3">
              <Button 
                color="primary" 
                onPress={() => router.push('/reset-password')}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>
              
              <Button 
                variant="light" 
                onPress={() => router.push('/login')}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }
  
  // Handle access denied errors
  if (errorCode === 'access_denied') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
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
                onPress={() => router.push('/reset-password')}
                className="w-full"
              >
                Požádat o nový odkaz
              </Button>
              
              <Button 
                variant="light" 
                onPress={() => router.push('/login')}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }
  
  // Generic error fallback
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardBody className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Oops! Něco se pokazilo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {errorDescription || 'Došlo k neočekávané chybě. Zkuste to prosím znovu.'}
          </p>
          
          <div className="space-y-3">
            <Button 
              color="primary" 
              onPress={() => router.push('/')}
              className="w-full"
            >
              Přejít na úvodní stránku
            </Button>
            
            <Button 
              variant="light" 
              onPress={() => router.push('/login')}
              className="w-full"
            >
              Přejít na přihlášení
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Načítání...</p>
          </CardBody>
        </Card>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  )
}