'use client';

import React, {useState} from 'react';
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
  NumberInput,
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

  const t = translations.match;
  const totalSteps = 3;

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
          formData.awayScoreHalftime >= 0
        );
      case 2:
        return formData.matchPhoto !== null;
      case 3:
        return formData.coachNotes.trim() !== '';
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
      const {error: updateError} = await supabase
        .from('matches')
        .update({
          home_score: formData.homeScore,
          away_score: formData.awayScore,
          home_score_halftime: formData.homeScoreHalftime,
          away_score_halftime: formData.awayScoreHalftime,
          coach_notes: formData.coachNotes,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      if (updateError) throw updateError;

      // If photo was uploaded, we could store the photo URL in a separate table
      // or add it to the match record if needed
      if (photoUrl) {
        // For now, we'll just log it - you might want to store this in a match_photos table
        console.log('Photo uploaded:', photoUrl);
      }

      onResultSaved?.();
      handleClose();
    } catch (error) {
      console.error('Error saving match result:', error);
      setError('Chyba při ukládání výsledku zápasu. Zkuste to prosím znovu.');
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
                <NumberInput
                  label={t.homeTeam}
                  placeholder="0"
                  value={formData.homeScore}
                  onChange={(value) => handleInputChange('homeScore', value as number)}
                  className="w-full"
                  min={0}
                />
                <NumberInput
                  label={t.awayTeam}
                  placeholder="0"
                  value={formData.awayScore}
                  onChange={(value) => handleInputChange('awayScore', value as number)}
                  className="w-full"
                  min={0}
                />
              </div>
            </div>

            {/* Halftime Score */}
            <div className="space-y-4">
              <Heading size={4}>Poločasové skóre</Heading>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label={t.homeTeam}
                  placeholder="0"
                  value={formData.homeScoreHalftime}
                  onChange={(value) => handleInputChange('homeScoreHalftime', value as number)}
                  className="w-full"
                  min={0}
                />
                <NumberInput
                  label={t.awayTeam}
                  placeholder="0"
                  value={formData.awayScoreHalftime}
                  onChange={(value) => handleInputChange('awayScoreHalftime', value as number)}
                  className="w-full"
                  min={0}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CameraIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fotografie ze zápasu</h3>
              <p className="text-sm text-gray-600">Pořiďte nebo nahrajte fotografii ze zápasu</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="matchPhoto"
                capture="environment"
              />
              <label htmlFor="matchPhoto" className="cursor-pointer">
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <CameraIcon className="mx-auto h-16 w-16" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klikněte pro nahrání
                    </span>{' '}
                    nebo pořiďte fotografii
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
            <div className="text-center">
              <DocumentTextIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Poznámky trenéra</h3>
              <p className="text-sm text-gray-600">Zadejte své poznámky a pozorování ze zápasu</p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Zadejte své poznámky o zápase, výkonu hráčů, taktice, atd..."
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
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = ['Výsledek zápasu', 'Fotografie', 'Poznámky trenéra'];
    return titles[currentStep - 1] || '';
  };

  if (!match) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      classNames={{
        base: 'max-w-[95vw] mx-2',
        wrapper: 'items-start justify-center p-2 sm:p-4 pt-20',
        backdrop: 'bg-black/50',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <Heading size={2}>Záznam výsledku zápasu</Heading>
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

        <ModalBody>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {renderStep()}
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <div className="flex gap-2">
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
