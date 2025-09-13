'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import {useUser} from '@/contexts/UserContext';
import {UserIcon, VideoCameraIcon, AcademicCapIcon} from '@heroicons/react/24/outline';
import {Button, Card, CardBody, CardHeader} from '@heroui/react';
import MatchSchedule from '@/components/match/MatchSchedule';
import {BirthdayCard} from './components';
import {PageContainer, LoadingSpinner} from '@/components';
import CoachMatchResultFlow from '../matches/components/CoachMatchResultFlow';

export default function CoachesDashboard() {
  const {user, userProfile, loading, error} = useUser();
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);

  // Authentication is handled by ProtectedCoachRoute

  const handleStartResultFlow = (match: any) => {
    setResultFlowMatch(match);
    setIsResultFlowOpen(true);
  };

  const handleCloseResultFlow = () => {
    setIsResultFlowOpen(false);
    setResultFlowMatch(null);
  };

  const handleResultSaved = () => {
    // Refresh matches data
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
          <Button color="primary" onPress={() => (window.location.href = '/coaches/login')}>
            Zpět na přihlášení
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-6">
        {/* Birthday Card */}
        <div className=" hidden sm:block m:col-span-2 xl:col-span-1">
          <BirthdayCard />
        </div>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer hidden sm:block">
          <CardBody className="text-center p-4 sm:p-6">
            <AcademicCapIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Zápasy</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
              Sledujte a spravujte zápasy
            </p>
            <Button color="primary" variant="bordered" size="sm" className="w-full sm:w-auto">
              Zobrazit zápasy
            </Button>
          </CardBody>
        </Card>

        <Link href="/coaches/videos" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer hidden sm:block">
            <CardBody className="text-center p-4 sm:p-6">
              <VideoCameraIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Videa</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                Spravujte videa pro své kategorie
              </p>
              <Button
                color="primary"
                variant="bordered"
                size="sm"
                as="span"
                className="w-full sm:w-auto"
              >
                Zobrazit videa
              </Button>
            </CardBody>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer hidden sm:block">
          <CardBody className="text-center p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Statistiky</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Analýza výkonnosti týmů</p>
            <Button color="primary" variant="bordered" size="sm" className="w-full sm:w-auto">
              Zobrazit statistiky
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MatchSchedule
            showOnlyAssignedCategories={true}
            redirectionLinks={false}
            onStartResultFlow={handleStartResultFlow}
            showResultButton={true}
          />
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Více funkcí brzy k dispozici</h3>
        <p className="text-gray-600">Průběžně přidáváme nové možnosti pro trenéry</p>
      </div>

      {/* Match Result Flow Modal */}
      <CoachMatchResultFlow
        isOpen={isResultFlowOpen}
        onClose={handleCloseResultFlow}
        match={resultFlowMatch}
        onResultSaved={handleResultSaved}
      />
    </PageContainer>
  );
}
