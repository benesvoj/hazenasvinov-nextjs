'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { UserIcon, VideoCameraIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import MatchSchedule from '@/components/match/MatchSchedule';
import { BirthdayCard } from './components';


export default function CoachesDashboard() {
  const { user, userProfile, loading, error } = useUser();


  // Authentication is handled by ProtectedCoachRoute

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Birthday Card */}
          <div className="lg:col-span-1">
            <BirthdayCard />
          </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <MatchSchedule showOnlyAssignedCategories={true} redirectionLinks={false} />
          </div>
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
