'use client';

import React, { useState } from "react";
import { Button, Field, Input, Label } from "@headlessui/react";
import { clsx } from "clsx";
import Link from "next/link";
import { publicRoutes } from "@/routes/routes";
import { translations } from "@/lib/translations";
import { createClient } from "@/utils/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const inputStyle = clsx('mt-3 block w-full rounded-lg border-2 bg-white/5 px-3 py-1.5 text-sm/6 focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25')
const buttonStyle = 'rounded bg-sky-600 px-4 py-2 text-sm text-white data-active:bg-sky-700 data-hover:bg-sky-500'
const labelStyle = 'text-sm/6 font-medium'

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
        // Handle different error types
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
        // Successful login - redirect to dashboard
        window.location.href = '/admin';
      }
    } catch (err) {
      setError('Došlo k neočekávané chybě. Zkuste to znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-2 items-center rounded-lg p-4 bg-white w-1/4">
      <form onSubmit={handleSubmit}>
        <Field className='py-4'>
          <Label className={labelStyle} htmlFor="email">{translations.email}</Label>
          <Input 
            className={inputStyle} 
            id="email" 
            name="email" 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <Label className={labelStyle} htmlFor="password">{translations.password}</Label>
          <div className="relative">
            <Input 
              className={inputStyle} 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </Field>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className='flex gap-2 py-4'>
          <Button 
            type='submit'
            className={buttonStyle}
            disabled={loading}
          >
            <span>{loading ? 'Přihlašování...' : translations.login}</span>
          </Button>
        </div>
      </form>
      <Link href={publicRoutes.home}>{translations.returnBackToHomepage}</Link>
    </div>
  );
}