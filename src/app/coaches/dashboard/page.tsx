'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserIcon, VideoCameraIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';

interface UserProfile {
  id: string;
  user_id: string;
  role: string;
  club_id: string;
  club_name?: string;
  created_at: string;
}

export default function CoachesDashboard() {
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
          window.location.href = '/coaches/login';
          return;
        }

        setUser(user);

        // Get user profiles - handle multiple profiles
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            user_id,
            role,
            club_id,
            clubs(name)
          `)
          .eq('user_id', user.id);

        if (profileError || !profiles || profiles.length === 0) {
          setError('Uživatelský profil nebyl nalezen.');
          return;
        }

        // Find coach profile
        const coachProfile = profiles.find((profile: any) => 
          profile.role === 'coach' || profile.role === 'head_coach'
        );

        if (!coachProfile) {
          setError('Nemáte oprávnění pro přístup do trenérského portálu.');
          return;
        }

        // Transform the profile data
        const transformedProfile: UserProfile = {
          id: coachProfile.id,
          user_id: coachProfile.user_id,
          role: coachProfile.role,
          club_id: coachProfile.club_id,
          club_name: coachProfile.clubs?.name,
          created_at: coachProfile.created_at || new Date().toISOString(),
        };

        setUserProfile(transformedProfile);
      } catch (err) {
        setError('Došlo k neočekávané chybě.');
        console.error('Auth check error:', err);
      } finally {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AcademicCapIcon className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Chyba přístupu</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button color="primary" onPress={() => window.location.href = '/coaches/login'}>
            Zpět na přihlášení
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vítejte v trenérském portálu
          </h2>
          <p className="text-gray-600">
            Spravujte své týmy, sledujte zápasy a vedte statistiky
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Informace o účtu</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <p className="text-gray-900">
                  {userProfile?.role === 'head_coach' ? 'Hlavní trenér' : 'Trenér'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klub
                </label>
                <p className="text-gray-900">{userProfile?.club_name || 'Neznámý klub'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Členem od
                </label>
                <p className="text-gray-900">
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('cs-CZ') : 'Neznámé'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody className="text-center p-6">
              <UserIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Moje týmy</h3>
              <p className="text-gray-600 text-sm mb-4">
                Spravujte své týmy a hráče
              </p>
              <Button color="primary" variant="bordered" size="sm">
                Zobrazit týmy
              </Button>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody className="text-center p-6">
              <AcademicCapIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zápasy</h3>
              <p className="text-gray-600 text-sm mb-4">
                Sledujte a spravujte zápasy
              </p>
              <Button color="primary" variant="bordered" size="sm">
                Zobrazit zápasy
              </Button>
            </CardBody>
          </Card>

          <Link href="/coaches/videos" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardBody className="text-center p-6">
                <VideoCameraIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Videa</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Spravujte videa pro své kategorie
                </p>
                <Button 
                  color="primary" 
                  variant="bordered" 
                  size="sm"
                  as="span"
                >
                  Zobrazit videa
                </Button>
              </CardBody>
            </Card>
          </Link>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiky</h3>
              <p className="text-gray-600 text-sm mb-4">
                Analýza výkonnosti týmů
              </p>
              <Button color="primary" variant="bordered" size="sm">
                Zobrazit statistiky
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Více funkcí brzy k dispozici
          </h3>
          <p className="text-gray-600">
            Průběžně přidáváme nové možnosti pro trenéry
          </p>
        </div>
    </div>
  );
}
