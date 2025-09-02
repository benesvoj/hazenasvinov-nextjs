'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { publicRoutes } from "@/routes/routes";
import { createClient } from "@/utils/supabase/client";
import { logSuccessfulLogin, logFailedLogin } from "@/utils/loginLogger";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  LockClosedIcon, 
  UserIcon, 
  AcademicCapIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { Button, Input, Tabs, Tab } from "@heroui/react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("admin");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'coach') {
      setActiveTab('coach');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        let errorMessage = 'Přihlášení se nezdařilo. Zkuste to znovu.';
        let logReason = 'Unknown error';

        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Nesprávný email nebo heslo';
            logReason = 'Invalid credentials';
            break;
          case 'Email not confirmed':
            errorMessage = 'Email není potvrzen. Zkontrolujte svůj email.';
            logReason = 'Email not confirmed';
            break;
          case 'Too many requests':
            errorMessage = 'Příliš mnoho pokusů. Zkuste to znovu později.';
            logReason = 'Too many requests';
            break;
          default:
            logReason = error.message;
        }

        setError(errorMessage);
        
        // Log the failed attempt
        await logFailedLogin(email, logReason);
      } else {
        // Log successful login
        await logSuccessfulLogin(email);
        
        if (activeTab === 'admin') {
          // Redirect to admin panel
          window.location.href = '/admin';
        } else {
          // Check if user has coach role - handle multiple profiles
          const { data: userProfiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, club_id')
            .eq('user_id', data.user.id);

          if (profileError || !userProfiles || userProfiles.length === 0) {
            setError('Uživatelský profil nebyl nalezen. Kontaktujte administrátora.');
            return;
          }

          // Check if user has coach role in any of their profiles
          const hasCoachRole = userProfiles.some((profile: any) => 
            profile.role === 'coach' || profile.role === 'head_coach'
          );

          if (hasCoachRole) {
            // Redirect to coaches dashboard
            window.location.href = '/coaches/dashboard';
          } else {
            setError('Nemáte oprávnění pro přístup do trenérského portálu.');
            // Sign out the user since they don't have coach access
            await supabase.auth.signOut();
          }
        }
      }
    } catch (err) {
      setError('Došlo k neočekávané chybě. Zkuste to znovu.');
      
      // Log the error
      await logFailedLogin(email, 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
    setError(''); // Clear error when switching tabs
  };

  const getTabIcon = (tabKey: string) => {
    if (tabKey === 'admin') {
      return <ShieldCheckIcon className="w-5 h-5" />;
    }
    return <AcademicCapIcon className="w-5 h-5" />;
  };

  const getTabTitle = (tabKey: string) => {
    if (tabKey === 'admin') {
      return 'Admin Portal';
    }
    return 'Trenérský Portal';
  };

  const getTabDescription = (tabKey: string) => {
    if (tabKey === 'admin') {
      return 'Přihlaste se do administračního rozhraní';
    }
    return 'Přihlaste se do trenérského rozhraní';
  };

  const getHeaderIcon = () => {
    if (activeTab === 'admin') {
      return <ShieldCheckIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />;
    }
    return <AcademicCapIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />;
  };

  const getHeaderGradient = () => {
    if (activeTab === 'admin') {
      return 'from-sky-600 to-blue-600';
    }
    return 'from-green-600 to-emerald-600';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${getHeaderGradient()} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
            {getHeaderIcon()}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {getTabTitle(activeTab)}
          </h1>
          <p className="text-gray-600 text-sm">
            {getTabDescription(activeTab)}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* Tabs */}
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={handleTabChange}
            className="mb-6"
            color={activeTab === 'admin' ? 'primary' : 'success'}
            variant="underlined"
          >
            <Tab 
              key="admin" 
              title={
                <div className="flex items-center space-x-2">
                  {getTabIcon('admin')}
                  <span>Admin</span>
                </div>
              }
            />
            <Tab 
              key="coach" 
              title={
                <div className="flex items-center space-x-2">
                  {getTabIcon('coach')}
                  <span>Trenér</span>
                </div>
              }
            />
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  className="pl-10"
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="vas@email.cz"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  size="lg"
                  label="Email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  className="pl-10 pr-12"
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  size="lg"
                  label="Heslo"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 min-h-[44px] min-w-[44px] justify-center z-10"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type='submit'
              className="w-full"
              color={activeTab === 'admin' ? 'primary' : 'success'}
              size="lg"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? 'Přihlašování...' : 'Přihlásit se'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div>
              <Link 
                href="/reset-password" 
                className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                Zapomněli jste heslo?
              </Link>
            </div>
            <div>
              <Link 
                href={publicRoutes.home}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 inline-flex items-center"
              >
                ← Zpět na úvodní stránku
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center px-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            {activeTab === 'admin' 
              ? 'Pro přístup k administračnímu rozhraní kontaktujte správce systému'
              : 'Pro přístup k trenérskému portálu kontaktujte administrátora klubu'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
