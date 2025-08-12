'use client';

import React, { useState } from "react";
import Link from "next/link";
import { publicRoutes } from "@/routes/routes";
import { createClient } from "@/utils/supabase/client";
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "@heroui/react";

export default function LoginPage() {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        switch (error.message) {
          case 'Invalid login credentials':
            setError('Nesprávný email nebo heslo');
            break;
          case 'Email not confirmed':
            setError('Email není potvrzen. Zkontrolujte svůj email.');
            break;
          case 'Too many requests':
            setError('Příliš mnoho pokusů. Zkuste to znovu později.');
            break;
          default:
            setError('Přihlášení se nezdařilo. Zkuste to znovu.');
        }
      } else {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError('Došlo k neočekávané chybě. Zkuste to znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <LockClosedIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600 text-sm">
            Přihlaste se do administračního rozhraní
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
              color="primary"
              size="lg"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? 'Přihlašování...' : 'Přihlásit se'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link 
              href={publicRoutes.home}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors duration-200 inline-flex items-center min-h-[44px] px-2"
            >
              ← Zpět na úvodní stránku
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center px-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Pro přístup k administračnímu rozhraní kontaktujte správce systému
          </p>
        </div>
      </div>
    </div>
  );
}
