'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody } from '@heroui/react';

interface ProtectedCoachRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface UserProfile {
  role: string;
  club_id: string;
}

export default function ProtectedCoachRoute({ 
  children, 
  fallback 
}: ProtectedCoachRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('Uživatel není přihlášen');
          setLoading(false);
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, club_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          setError('Uživatelský profil nebyl nalezen');
          setLoading(false);
          return;
        }

        // Check if user has coach role
        if (profile.role !== 'coach' && profile.role !== 'head_coach') {
          setError('Nemáte oprávnění pro přístup do trenérského portálu');
          setLoading(false);
          return;
        }

        setUserProfile(profile);
        setLoading(false);
      } catch (err) {
        setError('Došlo k neočekávané chybě');
        console.error('Auth check error:', err);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !user || !userProfile) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8">
            <div className="text-red-600 mb-4">
              <AcademicCapIcon className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Přístup zamítnut
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => window.location.href = '/coaches/login'}
              >
                Přihlásit se
              </Button>
              <Button 
                variant="bordered" 
                className="w-full"
                onPress={() => window.location.href = '/'}
              >
                Zpět na hlavní stránku
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
