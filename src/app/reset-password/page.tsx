'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Check for Supabase error parameters
  const supabaseError = searchParams.get('error');
  const supabaseErrorCode = searchParams.get('error_code');
  const supabaseErrorDescription = searchParams.get('error_description');

  // Check if we have the required parameters (Supabase uses different parameter names)
  const accessToken = searchParams.get('access_token') || searchParams.get('token');
  const refreshToken = searchParams.get('refresh_token') || searchParams.get('type');
  
  // For password reset flow, users are redirected from auth/confirm route
  // They should already be authenticated, so we don't require access_token in URL

  useEffect(() => {
    console.log('Reset password page loaded with params:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      supabaseError,
      supabaseErrorCode,
      supabaseErrorDescription,
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Handle Supabase errors
    if (supabaseError) {
      let errorMessage = 'Odkaz pro obnovení hesla je neplatný nebo vypršel.';
      
      if (supabaseErrorCode === 'otp_expired') {
        errorMessage = 'Odkaz pro obnovení hesla vypršel. Požádejte o nový odkaz.';
      } else if (supabaseErrorCode === 'access_denied') {
        errorMessage = 'Přístup byl zamítnut. Odkaz může být neplatný nebo vypršel.';
      }
      
      setError(errorMessage);
    } else if (!accessToken && !supabaseError) {
      // Only show error if we have neither access token nor supabase error
      // This allows the page to work when redirected from auth/confirm route
      console.log('No access token found, but no error either - user may be redirected from auth/confirm');
    }
  }, [accessToken, refreshToken, searchParams, supabaseError, supabaseErrorCode, supabaseErrorDescription]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Hesla se neshodují');
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Heslo nesplňuje požadavky na bezpečnost');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error) {
      console.error('Error updating password:', error);
      setError('Chyba při aktualizaci hesla. Zkuste to znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Heslo bylo úspěšně změněno!</h1>
            <p className="text-gray-600 mb-6">
              Vaše nové heslo bylo uloženo. Budete přesměrováni na přihlašovací stránku.
            </p>
            <Button 
              color="primary" 
              onPress={() => router.push('/login')}
              className="w-full"
            >
              Přejít na přihlášení
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (supabaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {supabaseErrorCode === 'otp_expired' ? 'Odkaz vypršel' : 'Neplatný odkaz'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'Odkaz pro obnovení hesla je neplatný nebo vypršel.'}
            </p>
            
            {supabaseErrorCode === 'otp_expired' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Řešení:</strong> Požádejte administrátora o odeslání nového emailu pro obnovení hesla.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                color="primary" 
                onPress={() => router.push('/login')}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
              
              <Button 
                variant="light" 
                onPress={() => router.push('/')}
                className="w-full"
              >
                Přejít na úvodní stránku
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nastavit nové heslo</h1>
          <p className="text-gray-600 text-sm">
            Zadejte své nové heslo pro přístup do systému
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <div className="relative">
                <Input
                  isRequired
                  label="Nové heslo"
                  labelPlacement="outside"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startContent={<LockClosedIcon className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">Požadavky na heslo:</p>
                <div className="space-y-1">
                  {Object.entries(passwordStrength).map(([key, met]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
                        {key === 'length' && 'Minimálně 8 znaků'}
                        {key === 'uppercase' && 'Velké písmeno (A-Z)'}
                        {key === 'lowercase' && 'Malé písmeno (a-z)'}
                        {key === 'number' && 'Číslo (0-9)'}
                        {key === 'special' && 'Speciální znak (!@#$%^&*)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <Input
                isRequired
                label="Potvrdit heslo"
                labelPlacement="outside"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                startContent={<LockClosedIcon className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              color="primary" 
              className="w-full" 
              size="lg"
              isLoading={isLoading}
              isDisabled={!password || !confirmPassword || !Object.values(passwordStrength).every(Boolean)}
            >
              Nastavit nové heslo
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Button 
                variant="light" 
                onPress={() => router.push('/login')}
                className="text-sm"
              >
                ← Zpět na přihlášení
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání...</p>
          </CardBody>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
