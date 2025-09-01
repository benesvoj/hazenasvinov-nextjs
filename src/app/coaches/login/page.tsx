'use client';

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { logSuccessfulLogin, logFailedLogin } from "@/utils/loginLogger";
import { EyeIcon, EyeSlashIcon, UserIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "@heroui/react";

export default function CoachesLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        
        // Check if user is a coach and redirect accordingly
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, club_id')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !userProfile) {
          setError('Uživatelský profil nebyl nalezen. Kontaktujte administrátora.');
          return;
        }

        // Check if user has coach role
        if (userProfile.role === 'coach' || userProfile.role === 'head_coach') {
          // Redirect to coaches dashboard
          window.location.href = '/coaches/dashboard';
        } else {
          setError('Nemáte oprávnění pro přístup do trenérského portálu.');
          // Sign out the user since they don't have coach access
          await supabase.auth.signOut();
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <AcademicCapIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Trenérský Portal
          </h1>
          <p className="text-gray-600 text-sm">
            Přihlaste se do trenérského rozhraní
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
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
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  disabled={loading}
                  aria-label="Email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  className="pl-10 pr-10"
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Heslo"
                  required
                  disabled={loading}
                  aria-label="Heslo"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              color="primary"
              className="w-full"
              disabled={loading}
              aria-label="Přihlásit se"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Přihlašování...
                </div>
              ) : (
                'Přihlásit se'
              )}
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="text-sm">
              <Link 
                href="/reset-password" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Zapomněli jste heslo?
              </Link>
            </div>
            
            <div className="text-sm text-gray-600">
              <span>Jste administrátor? </span>
              <Link 
                href="/login" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Přihlaste se zde
              </Link>
            </div>

            <div className="text-sm text-gray-600">
              <span>Zpět na </span>
              <Link 
                href="/" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                hlavní stránku
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2024 TJ Sokol Svinov. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </div>
  );
}
