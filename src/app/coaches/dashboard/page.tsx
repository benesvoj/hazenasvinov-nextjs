'use client';

import React, {useEffect, useState, useMemo} from 'react';
import Link from 'next/link';
import {useUser} from '@/contexts/UserContext';
import {useCategories, useUserRoles} from '@/hooks';
import {UserIcon, VideoCameraIcon, AcademicCapIcon} from '@heroicons/react/24/outline';
import {Button, Card, CardBody, CardHeader, Tab, Tabs} from '@heroui/react';
import MatchSchedule from '@/components/match/MatchSchedule';
import {BirthdayCard, TopScorersCard, YellowCardsCard, RedCardsCard} from './components';
import {PageContainer, LoadingSpinner} from '@/components';
import CoachMatchResultFlow from '../matches/components/CoachMatchResultFlow';

export default function CoachesDashboard() {
  const {user, userProfile, loading, error} = useUser();
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);

  const {categories, fetchCategories} = useCategories();
  const {getCurrentUserCategories} = useUserRoles();

  // Filter category based on assigned category
  const availableCategories = useMemo(() => {
    return categories.filter((cat) => assignedCategoryIds.includes(cat.id));
  }, [categories, assignedCategoryIds]);

  // Auto-select first category if none selected and only one available
  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategory]);

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch assigned category if available
  useEffect(() => {
    if (getCurrentUserCategories) {
      getCurrentUserCategories().then(setAssignedCategoryIds);
    }
  }, [getCurrentUserCategories]);

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
    // Refresh matches data - the MatchSchedule component will handle its own refresh
    // No need to reload the entire page
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
      {/* Category Selection */}
      {availableCategories.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="overflow-x-auto">
            <Tabs
              selectedKey={selectedCategory}
              onSelectionChange={(key) => setSelectedCategory(key as string)}
              className="w-full min-w-max"
            >
              {availableCategories.map((category) => (
                <Tab key={category.id} title={category.name} />
              ))}
            </Tabs>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-6">
        {/* Birthday Card */}
        <div className=" hidden sm:block md:col-span-2 xl:col-span-1">
          <BirthdayCard categoryId={selectedCategory} />
        </div>

        <TopScorersCard categoryId={selectedCategory} />

        <YellowCardsCard categoryId={selectedCategory} />

        <RedCardsCard categoryId={selectedCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MatchSchedule
            showOnlyAssignedCategories={true}
            redirectionLinks={false}
            onStartResultFlow={handleStartResultFlow}
            showResultButton={true}
            selectedCategoryId={selectedCategory}
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
