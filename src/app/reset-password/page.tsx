'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Heading1 } from '@/components';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [user, setUser] = useState<any>(null);
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

    const checkAuthStatus = async () => {
      const supabase = createClient();
      
      try {
        // First check if there's a session to avoid AuthSessionMissingError
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, get the user
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting user:', userError);
            if (!supabaseError) {
              setError('Chyba při ověření uživatele. Zkuste to znovu.');
            }
          } else if (currentUser) {
            setUser(currentUser);
          }
        } else if (!supabaseError) {
          // No session and no error - this is normal for email request flow
          setUser(null);
        }
      } catch (err) {
        // Handle any errors silently for unauthenticated users
        if (err instanceof Error && (
          err.message.includes('AuthSessionMissingError') ||
          err.message.includes('session_not_found') ||
          err.message.includes('not authenticated') ||
          err.name === 'AuthSessionMissingError'
        )) {
          // This is expected for unauthenticated users, don't log as error
          setUser(null);
        } else {
          console.error('Error checking auth status:', err);
          if (!supabaseError) {
            setError('Chyba při ověření uživatele. Zkuste to znovu.');
          }
        }
      }

      // Handle Supabase errors
      if (supabaseError) {
        let errorMessage = 'Odkaz pro obnovení hesla je neplatný nebo vypršel.';
        
        if (supabaseErrorCode === 'otp_expired') {
          errorMessage = 'Odkaz pro obnovení hesla vypršel. Požádejte o nový odkaz.';
        } else if (supabaseErrorCode === 'access_denied') {
          errorMessage = 'Přístup byl zamítnut. Odkaz může být neplatný nebo vypršel.';
        } else if (supabaseError === 'NEXT_REDIRECT') {
          // This is a redirect error, not a real error - clear it
          console.log('NEXT_REDIRECT error detected, clearing error state');
          setError('');
          return;
        }
        
        setError(errorMessage);
      }
    };

    checkAuthStatus();
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

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Zadejte prosím svou emailovou adresu');
      return;
    }

    setIsRequestingReset(true);
    setError('');

    try {
      // Use the simple reset-password API route
      const response = await fetch('/api/simple-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError('Chyba při odesílání emailu pro obnovení hesla. Zkuste to znovu.');
    } finally {
      setIsRequestingReset(false);
    }
  };

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
      
      // First, check if there's a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Uživatel není přihlášen. Zkontrolujte svůj odkaz pro obnovení hesla.');
      }
      
      // Get the user from the session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Uživatel není přihlášen. Zkontrolujte svůj odkaz pro obnovení hesla.');
      }
      
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Úspěšně dokončeno!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isRequestingReset ? 'Pokud je emailová adresa v systému registrována, byl odeslán email pro obnovení hesla. Zkontrolujte svou poštovní schránku.' : 'Vaše nové heslo bylo uloženo. Budete přesměrováni na přihlašovací stránku.'}
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {supabaseErrorCode === 'otp_expired' ? 'Odkaz vypršel' : 'Neplatný odkaz'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'Odkaz pro obnovení hesla je neplatný nebo vypršel.'}
            </p>
            
            {supabaseErrorCode === 'otp_expired' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2 flex flex-col items-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <div>
          <Heading1>
            {!user && !supabaseError ? 'Obnovit heslo' : 'Nastavit nové heslo'}
          </Heading1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {!user && !supabaseError 
              ? 'Zadejte svou emailovou adresu a my vám pošleme odkaz pro obnovení hesla'
              : 'Zadejte své nové heslo pro přístup do systému'
            }
          </p>
          </div>
        </CardHeader>
        <CardBody>
          {/* Show email request form if user is not authenticated */}
          {!user && !supabaseError ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              {/* Email Field */}
              <div>
                <Input
                  isRequired
                  label="Emailová adresa"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                color="primary" 
                className="w-full" 
                size="lg"
                isLoading={isRequestingReset}
                isDisabled={!email}
              >
                Odeslat email pro obnovení hesla
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
          ) : (
            /* Show password reset form if user is authenticated */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div>
                <div className="relative">
                  <Input
                    isRequired
                    label="Nové heslo"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    startContent={<LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                    endContent={
                      <button
                        type="button"
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Požadavky na heslo:</p>
                <div className="space-y-1">
                  {Object.entries(passwordStrength).map(([key, met]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <span className={`text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                startContent={<LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                endContent={
                  <button
                    type="button"
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Načítání...</p>
          </CardBody>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
