'use client';

import React, {useState} from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Checkbox,
  Progress,
} from '@heroui/react';

import {XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon} from '@heroicons/react/24/outline';

interface MatchProcessWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: any; // You can type this properly based on your match structure
}

const MatchProcessWizardModal: React.FC<MatchProcessWizardModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    homeScore: '',
    awayScore: '',
    matchDocument: null as File | null,
    matchPhotos: [] as File[],
    blogTitle: '',
    blogContent: '',
    distribution: {
      web: false,
      instagram: false,
      facebook: false,
      whatsapp: false,
    },
  });

  const totalSteps = 5;

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
      homeScore: '',
      awayScore: '',
      matchDocument: null,
      matchPhotos: [],
      blogTitle: '',
      blogContent: '',
      distribution: {
        web: false,
        instagram: false,
        facebook: false,
        whatsapp: false,
      },
    });
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDistributionChange = (platform: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        [platform]: checked,
      },
    }));
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (files) {
      if (field === 'matchDocument') {
        setFormData((prev) => ({
          ...prev,
          matchDocument: files[0],
        }));
      } else if (field === 'matchPhotos') {
        setFormData((prev) => ({
          ...prev,
          matchPhotos: Array.from(files),
        }));
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Výsledek zápasu</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match?.home_team?.name || 'Domácí tým'}
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.homeScore}
                  onChange={(e) => handleInputChange('homeScore', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match?.away_team?.name || 'Hostující tým'}
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.awayScore}
                  onChange={(e) => handleInputChange('awayScore', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fotografie dokumentu zápasu</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('matchDocument', e.target.files)}
                className="hidden"
                id="matchDocument"
              />
              <label htmlFor="matchDocument" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klikněte pro nahrání
                    </span>{' '}
                    nebo přetáhněte soubor
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG až 10MB</p>
                </div>
              </label>
            </div>
            {formData.matchDocument && (
              <div className="text-sm text-green-600">
                ✓ Nahraný soubor: {formData.matchDocument.name}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fotografie ze zápasu</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload('matchPhotos', e.target.files)}
                className="hidden"
                id="matchPhotos"
              />
              <label htmlFor="matchPhotos" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Klikněte pro nahrání
                    </span>{' '}
                    nebo přetáhněte soubory
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG až 10MB (více souborů)</p>
                </div>
              </label>
            </div>
            {formData.matchPhotos.length > 0 && (
              <div className="text-sm text-green-600">
                ✓ Nahrané soubory: {formData.matchPhotos.length} souborů
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Blog post</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nadpis</label>
              <Input
                placeholder="Zadejte nadpis blog postu..."
                value={formData.blogTitle}
                onChange={(e) => handleInputChange('blogTitle', e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Obsah</label>
              <Textarea
                placeholder="Zadejte obsah blog postu..."
                value={formData.blogContent}
                onChange={(e) => handleInputChange('blogContent', e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribuce postu</h3>
            <p className="text-sm text-gray-600 mb-4">Vyberte, kde chcete zveřejnit blog post:</p>
            <div className="space-y-3">
              <Checkbox
                isSelected={formData.distribution.web}
                onValueChange={(checked) => handleDistributionChange('web', checked)}
              >
                Web
              </Checkbox>
              <Checkbox
                isSelected={formData.distribution.instagram}
                onValueChange={(checked) => handleDistributionChange('instagram', checked)}
              >
                Instagram
              </Checkbox>
              <Checkbox
                isSelected={formData.distribution.facebook}
                onValueChange={(checked) => handleDistributionChange('facebook', checked)}
              >
                Facebook
              </Checkbox>
              <Checkbox
                isSelected={formData.distribution.whatsapp}
                onValueChange={(checked) => handleDistributionChange('whatsapp', checked)}
              >
                WhatsApp
              </Checkbox>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      'Výsledek zápasu',
      'Dokument zápasu',
      'Fotografie ze zápasu',
      'Blog post',
      'Distribuce',
    ];
    return titles[currentStep - 1] || '';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.homeScore !== '' && formData.awayScore !== '';
      case 2:
        return formData.matchDocument !== null;
      case 3:
        return formData.matchPhotos.length > 0;
      case 4:
        return formData.blogTitle.trim() !== '' && formData.blogContent.trim() !== '';
      case 5:
        return Object.values(formData.distribution).some((value) => value);
      default:
        return false;
    }
  };

  const handleFinish = () => {
    // Here you would typically send the data to your backend
    console.log('Process completed:', formData);
    handleClose();
  };

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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Kompletní proces zápasu</h2>
            <Button
              isIconOnly
              variant="light"
              onPress={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
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

        <ModalBody>{renderStep()}</ModalBody>

        <ModalFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="bordered"
                onPress={handlePrevious}
                startContent={<ChevronLeftIcon className="w-4 h-4" />}
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
                isDisabled={!canProceed()}
                endContent={<ChevronRightIcon className="w-4 h-4" />}
              >
                Další
              </Button>
            ) : (
              <Button
                color="success"
                onPress={handleFinish}
                isDisabled={!canProceed()}
                startContent={<CheckIcon className="w-4 h-4" />}
              >
                Dokončit proces
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MatchProcessWizardModal;
