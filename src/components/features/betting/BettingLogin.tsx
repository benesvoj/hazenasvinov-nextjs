'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Input, Button, Divider, Chip, Alert} from '@heroui/react';

import {Lock, Mail, TrendingUp, Trophy, DollarSign, AlertCircle, CheckCircle} from 'lucide-react';

import {bettingLogin} from '@/utils/supabase/bettingAuth';

import {showToast} from '@/components';
import {translations} from '@/lib';

interface BettingLoginProps {
  onLoginSuccess?: () => void;
}

/**
 * Betting Login Component
 * Real authentication for the betting system using Supabase
 */
export function BettingLogin({onLoginSuccess}: BettingLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations.betting;

  const handleLogin = async () => {
    setIsLoading(true);

    // Validate inputs
    if (!email || !password) {
      showToast.warning(t.loginFailedEmailPassword);
      setIsLoading(false);
      return;
    }

    try {
      const result = await bettingLogin(email, password);

      if (result.success) {
        showToast.success(t.loginSuccess);

        // Call success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // Use window.location.href for hard redirect to ensure
        // full page reload and auth state refresh
        setTimeout(() => {
          window.location.href = '/betting';
        }, 500);
      } else {
        showToast.warning(t.loginFailed);
        setIsLoading(false);
      }
    } catch (err) {
      showToast.danger(t.loginFailedUnexpected);
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="text-white space-y-8">
          <div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <p className="text-xl text-gray-300">{t.appDescription}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t.liveBetting}</h3>
                <p className="text-gray-400 text-sm">{t.liveBettingDescription}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t.leaderboard}</h3>
                <p className="text-gray-400 text-sm">{t.leaderboardDescription}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t.virtualCurrency}</h3>
                <p className="text-gray-400 text-sm">{t.virtualCurrencyDescription}</p>
              </div>
            </div>
          </div>

          <div className="py-4">
            <Alert color="warning" description={t.responsibleGamingDescription} variant="faded" />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="flex flex-col gap-1 px-6 pt-6">
            <h2 className="text-2xl font-bold">{t.welcomeMessage}</h2>
            <p className="text-sm text-center text-gray-500">{t.welcomeDescription}</p>
          </CardHeader>

          <CardBody className="px-6 pb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // NOTE: explicitly ignore the promise return value and silence the TypeScript warning
                void handleLogin();
              }}
              className="space-y-4"
            >
              <Input
                type="email"
                label={t.email}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                startContent={<Mail className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Input
                type="password"
                label={t.password}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Button
                type="submit"
                color="primary"
                className="w-full font-semibold"
                size="lg"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? t.loginLoading : t.login}
              </Button>

              <Divider className="my-4" />

              <div className="text-center text-sm text-gray-500 mt-4">
                <p>
                  {t.registerQuestion}{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => alert('Sign up functionality coming soon!')}
                    disabled={isLoading}
                  >
                    {t.register}
                  </button>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
