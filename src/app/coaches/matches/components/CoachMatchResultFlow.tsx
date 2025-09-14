'use client';

import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Progress,
  Card,
  CardBody,
  Image,
  Input,
} from '@heroui/react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CameraIcon,
  DocumentTextIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import {Match} from '@/types';
import {formatDateString} from '@/helpers';
import {createClient} from '@/utils/supabase/client';
import {translations} from '@/lib/translations';
import {Heading} from '@/components';
import {showToast} from '@/components/Toast';
import {invalidateMatchCache} from '@/services/optimizedMatchQueries';
import {useQueryClient} from '@tanstack/react-query';
import {refreshMaterializedViewWithCallback} from '@/utils/refreshMaterializedView';

interface CoachMatchResultFlowProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onResultSaved?: () => void;
}

interface ResultData {
  homeScore: number;
  awayScore: number;
  homeScoreHalftime: number;
  awayScoreHalftime: number;
  matchPhoto: File | null;
  coachNotes: string;
}

const CoachMatchResultFlow: React.FC<CoachMatchResultFlowProps> = ({
  isOpen,
  onClose,
  match,
  onResultSaved,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ResultData>({
    homeScore: 0,
    awayScore: 0,
    homeScoreHalftime: 0,
    awayScoreHalftime: 0,
    matchPhoto: null,
    coachNotes: '',
  });
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const t = translations.match;
  const totalSteps = 3;

  // Handle keyboard events and scroll to active input
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' && modalBodyRef.current) {
        // Multiple attempts to ensure proper scrolling
        const scrollToInput = () => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        };

        // Immediate scroll
        scrollToInput();

        // Delayed scrolls to handle keyboard animation
        setTimeout(scrollToInput, 100);
        setTimeout(scrollToInput, 300);
        setTimeout(scrollToInput, 600);
        setTimeout(scrollToInput, 1000);

        // Also scroll the modal body to ensure visibility
        setTimeout(() => {
          if (modalBodyRef.current) {
            modalBodyRef.current.scrollTop = modalBodyRef.current.scrollHeight;
          }
        }, 500);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      homeScore: 0,
      awayScore: 0,
      homeScoreHalftime: 0,
      awayScoreHalftime: 0,
      matchPhoto: null,
      coachNotes: '',
    });
    setError('');
    onClose();
  };

  const handleInputChange = (field: keyof ResultData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Soubor je příliš velký. Maximální velikost je 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Pouze obrázky jsou povoleny.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        matchPhoto: file,
      }));
      setError('');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.homeScore >= 0 &&
          formData.awayScore >= 0 &&
          formData.homeScoreHalftime >= 0 &&
          formData.awayScoreHalftime >= 0 &&
          formData.homeScoreHalftime <= formData.homeScore &&
          formData.awayScoreHalftime <= formData.awayScore
        );
      case 2:
        return formData.matchPhoto !== null;
      case 3:
        return true; // Coach notes are now optional
      default:
        return false;
    }
  };

  const handleFinish = async () => {
    if (!match) return;

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Upload photo to storage if provided
      let photoUrl = null;
      if (formData.matchPhoto) {
        const fileExt = formData.matchPhoto.name.split('.').pop();
        const fileName = `${match.id}-${Date.now()}.${fileExt}`;
        const filePath = `match-photos/${fileName}`;

        const {error: uploadError} = await supabase.storage
          .from('club-assets')
          .upload(filePath, formData.matchPhoto);

        if (uploadError) throw uploadError;

        const {
          data: {publicUrl},
        } = supabase.storage.from('club-assets').getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      // Update match with result data
      const updateData: any = {
        home_score: formData.homeScore,
        away_score: formData.awayScore,
        home_score_halftime: formData.homeScoreHalftime,
        away_score_halftime: formData.awayScoreHalftime,
        coach_notes: formData.coachNotes,
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      // Add photo URL if uploaded
      if (photoUrl) {
        updateData.match_photo_url = photoUrl;
      }

      console.log('Updating match with data:', updateData);
      console.log('Match ID:', match.id);
      console.log('Match before update:', {
        id: match.id,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
        home_score_halftime: match.home_score_halftime,
        away_score_halftime: match.away_score_halftime,
        coach_notes: match.coach_notes,
      });

      const {error: updateError} = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Match updated successfully');
      console.log('Updated match data:', updateData);

      // Refresh materialized view to ensure it has the latest data
      await refreshMaterializedViewWithCallback('coach result update');

      // Invalidate cache to ensure fresh data
      if (match?.category_id && match?.season_id) {
        console.log(
          'Invalidating cache for category:',
          match.category_id,
          'season:',
          match.season_id
        );

        // Clear the service cache completely to force fresh data
        await invalidateMatchCache(match.category_id, match.season_id);

        // Invalidate React Query cache with more aggressive invalidation
        await queryClient.invalidateQueries({
          queryKey: ['matches', 'ownClub', match.category_id, match.season_id],
        });

        // Invalidate all match-related queries
        await queryClient.invalidateQueries({
          queryKey: ['matches'],
        });

        // Force refetch by removing the query from cache
        await queryClient.removeQueries({
          queryKey: ['matches', 'ownClub', match.category_id, match.season_id],
        });
      }

      showToast.success('Výsledek zápasu byl úspěšně uložen!');

      // Small delay to ensure cache invalidation completes
      setTimeout(() => {
        onResultSaved?.();
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Error saving match result:', error);
      const errorMessage = 'Chyba při ukládání výsledku zápasu. Zkuste to prosím znovu.';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Match info */}
            <Card className="bg-gray-50">
              <CardBody className="p-4">
                <div className="flex flex-col items-center">
                  <Heading size={4}>
                    {match?.home_team?.name || 'Domácí tým'} vs{' '}
                    {match?.away_team?.name || 'Hostující tým'}
                  </Heading>
                  <p className="text-sm text-gray-600">{formatDateString(match?.date || '')}</p>
                </div>
              </CardBody>
            </Card>

            {/* Final Score */}
            <div className="space-y-4">
              <Heading size={4}>Konečné skóre</Heading>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t.homeTeam}
                    type="number"
                    placeholder="0"
                    value={formData.homeScore.toString()}
                    onChange={(e) => handleInputChange('homeScore', parseInt(e.target.value) || 0)}
                    className="w-full"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                <div>
                  <Input
                    label={t.awayTeam}
                    type="number"
                    placeholder="0"
                    value={formData.awayScore.toString()}
                    onChange={(e) => handleInputChange('awayScore', parseInt(e.target.value) || 0)}
                    className="w-full"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
              </div>
            </div>

            {/* Halftime Score */}
            <div className="space-y-4 mt-8">
              <Heading size={4}>Poločasové skóre</Heading>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t.homeTeam}
                    type="number"
                    placeholder="0"
                    value={formData.homeScoreHalftime.toString()}
                    onChange={(e) =>
                      handleInputChange('homeScoreHalftime', parseInt(e.target.value) || 0)
                    }
                    className="w-full"
                    min="0"
                    max={formData.homeScore}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    color={formData.homeScoreHalftime > formData.homeScore ? 'danger' : 'default'}
                    errorMessage={
                      formData.homeScoreHalftime > formData.homeScore
                        ? 'Poločasové skóre nemůže být vyšší než konečné skóre'
                        : undefined
                    }
                  />
                </div>
                <div>
                  <Input
                    label={t.awayTeam}
                    type="number"
                    placeholder="0"
                    value={formData.awayScoreHalftime.toString()}
                    onChange={(e) =>
                      handleInputChange('awayScoreHalftime', parseInt(e.target.value) || 0)
                    }
                    className="w-full"
                    min="0"
                    max={formData.awayScore}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    color={formData.awayScoreHalftime > formData.awayScore ? 'danger' : 'default'}
                    errorMessage={
                      formData.awayScoreHalftime > formData.awayScore
                        ? 'Poločasové skóre nemůže být vyšší než konečné skóre'
                        : undefined
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Poločasové skóre musí být menší nebo rovno konečnému skóre pro každý tým
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="matchPhoto"
              />
              <label htmlFor="matchPhoto" className="cursor-pointer">
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <CameraIcon className="mx-auto h-16 w-16" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klikněte pro výběr zápisu utkání
                    </span>{' '}
                    z galerie nebo pořiďte novou fotografii zápisu utkání
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG až 5MB</p>
                </div>
              </label>
            </div>

            {formData.matchPhoto && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Nahraný soubor: {formData.matchPhoto.name}
                </p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={URL.createObjectURL(formData.matchPhoto)}
                    alt="Match photo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poznámky trenéra <span className="text-gray-400">(volitelné)</span>
                </label>
                <Textarea
                  placeholder="Zadejte své poznámky o zápase, výkonu hráčů, taktice, atd... (volitelné)"
                  value={formData.coachNotes}
                  onChange={(e) => handleInputChange('coachNotes', e.target.value)}
                  rows={8}
                  className="w-full"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 text-right">
                  {formData.coachNotes.length}/1000 znaků
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = ['Výsledek zápasu', 'Fotografie', 'Poznámky trenéra (volitelné)'];
    return titles[currentStep - 1] || '';
  };

  if (!match) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={undefined}
      size="2xl"
      classNames={{
        base: 'max-w-[95vw] mx-2 max-h-[85vh]',
        wrapper: 'items-start justify-start p-2 sm:p-4 pt-4 pb-4',
        backdrop: 'bg-black/50',
      }}
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-between items-start w-full">
            <Heading size={2}>Záznam výsledku zápasu</Heading>
          </div>
          <div className="w-full">
            <Progress value={(currentStep / totalSteps) * 100} className="w-full" color="primary" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                Krok {currentStep} z {totalSteps}
              </span>
              <span>{getStepTitle()}</span>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div ref={modalBodyRef}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {renderStep()}
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button color="secondary" variant="light" onPress={handleClose} isDisabled={isLoading}>
              Zrušit
            </Button>
            {currentStep > 1 && (
              <Button
                variant="bordered"
                onPress={handlePrevious}
                startContent={<ChevronLeftIcon className="w-4 h-4" />}
                isDisabled={isLoading}
              >
                Zpět
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button
                color="primary"
                onPress={handleNext}
                isDisabled={!canProceed() || isLoading}
                endContent={<ChevronRightIcon className="w-4 h-4" />}
              >
                Další
              </Button>
            ) : (
              <Button
                color="success"
                onPress={handleFinish}
                isDisabled={!canProceed() || isLoading}
                isLoading={isLoading}
                startContent={!isLoading ? <CheckIcon className="w-4 h-4" /> : undefined}
              >
                {isLoading ? 'Ukládám...' : 'Dokončit'}
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CoachMatchResultFlow;
