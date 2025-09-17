'use client';

import React, {useState, useEffect} from 'react';
import {Input, NumberInput, Select, SelectItem, Button} from '@heroui/react';
import {MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import {Match, Nullish, Video, EditMatchFormData} from '@/types';
import {UnifiedModal, Heading} from '@/components';
import {translations} from '@/lib/translations';
import {matchStatuses} from '@/constants';
import VideoSelectionModal from './VideoSelectionModal';

interface FilteredTeam {
  id: string;
  name: string;
  display_name?: string;
  venue?: string;
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatch: Match | null;
  editData: EditMatchFormData;
  onEditDataChange: (data: EditMatchFormData) => void;
  onUpdateMatch: () => void;
  teams: FilteredTeam[];
  getMatchweekOptions: (categoryId?: string) => Array<{value: string; label: string}>;
  isSeasonClosed: boolean;
}

export default function EditMatchModal({
  isOpen,
  onClose,
  selectedMatch,
  editData,
  onEditDataChange,
  onUpdateMatch,
  teams,
  getMatchweekOptions,
  isSeasonClosed,
}: EditMatchModalProps) {
  const t = translations.matches;
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Handle video selection
  const handleVideoSelect = (video: Video | null) => {
    setSelectedVideo(video);
    onEditDataChange({
      ...editData,
      video_id: video?.id || '',
    });
  };

  // Load selected video when editData.video_id changes
  useEffect(() => {
    if (editData.video_id) {
      // In a real implementation, you would fetch the video data here
      // For now, we'll just set a placeholder
      setSelectedVideo({
        id: editData.video_id,
        title: 'Loading...',
        youtube_url: '',
        youtube_id: '',
        category_id: '',
        is_active: true,
        created_at: '',
        updated_at: '',
      } as Video);
    } else {
      setSelectedVideo(null);
    }
  }, [editData.video_id]);

  const handleInputChange = (
    field: string,
    value: string | number | React.ChangeEvent<HTMLInputElement>
  ) => {
    // Handle NumberInput which can return either a number or ChangeEvent
    let actualValue: string | number;

    actualValue =
      typeof value === 'object' && value !== null && 'target' in value ? value.target.value : value;

    onEditDataChange({
      ...editData,
      [field]: actualValue,
    });
  };

  const handleSelectChange = (field: string, keys: any) => {
    const selectedValue = Array.from(keys)[0] as string;

    // Auto-populate venue when home team is selected
    if (field === 'home_team_id' && selectedValue) {
      const selectedTeam = teams.find((team) => team.id === selectedValue);
      if (selectedTeam?.venue) {
        onEditDataChange({
          ...editData,
          [field]: selectedValue || '',
          venue: selectedTeam.venue,
        });
        return;
      }
    }

    onEditDataChange({
      ...editData,
      [field]: selectedValue || '',
    });
  };

  return (
    <>
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={t.actions.editMatch}
        size="xl"
        hSize={2}
        isFooterWithActions
        onPress={onUpdateMatch}
        isDisabled={isSeasonClosed}
      >
        <>
          {selectedMatch && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">
                    Základní údaje
                  </h4>
                  <Input
                    label="Datum"
                    type="date"
                    value={editData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    isDisabled={isSeasonClosed}
                    isRequired
                  />
                  <Input
                    label="Čas"
                    type="time"
                    value={editData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    isDisabled={isSeasonClosed}
                    isRequired
                  />
                  <Input
                    label="Místo konání"
                    value={editData.venue || ''}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    isDisabled={isSeasonClosed}
                    placeholder="Místo konání se automaticky vyplní podle domácího týmu"
                  />
                  <div>
                    <Select
                      label="Kolo"
                      placeholder="Vyberte kolo"
                      selectedKeys={editData.matchweek ? [editData.matchweek] : []}
                      onSelectionChange={(keys) => handleSelectChange('matchweek', keys)}
                      className="w-full"
                      isDisabled={isSeasonClosed}
                    >
                      {getMatchweekOptions(editData.category_id).map((option) => (
                        <SelectItem key={option.value}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <Input
                    label="Číslo zápasu"
                    placeholder="např. 1, 2, Finále, Semifinále"
                    value={editData.match_number}
                    onChange={(value) => handleInputChange('match_number', value)}
                    isDisabled={isSeasonClosed}
                  />
                  <div>
                    <Select
                      label="Status"
                      placeholder="Vyberte status"
                      selectedKeys={editData.status ? [editData.status] : []}
                      onSelectionChange={(keys) => handleSelectChange('status', keys)}
                      className="w-full"
                      isDisabled={isSeasonClosed}
                    >
                      {Object.entries(matchStatuses).map(([key, value]) => (
                        <SelectItem key={key}>{value}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Right Column - Teams & Scores */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">
                    Týmy & Skóre
                  </h4>
                  <div>
                    <Select
                      label="Domácí tým"
                      placeholder="Vyberte domácí tým"
                      selectedKeys={editData.home_team_id ? [editData.home_team_id] : []}
                      onSelectionChange={(keys) => handleSelectChange('home_team_id', keys)}
                      className="w-full"
                      isDisabled={isSeasonClosed}
                      isRequired
                    >
                      {teams.map((team) => (
                        <SelectItem key={team.id}>{team.display_name || team.name}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Select
                      label="Hostující tým"
                      placeholder="Vyberte hostující tým"
                      selectedKeys={editData.away_team_id ? [editData.away_team_id] : []}
                      onSelectionChange={(keys) => handleSelectChange('away_team_id', keys)}
                      className="w-full"
                      isDisabled={isSeasonClosed}
                      isRequired
                    >
                      {teams.map((team) => (
                        <SelectItem key={team.id}>{team.display_name || team.name}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Scores - only show if match is completed */}
                  {editData.status === 'completed' && (
                    <div className="space-y-4 pt-4 border-t">
                      <Heading size={5}>Skóre</Heading>
                      <div className="flex items-center space-x-4">
                        <NumberInput
                          label="Domácí"
                          value={editData.home_score ?? undefined}
                          onChange={(value) => handleInputChange('home_score', value)}
                          isDisabled={isSeasonClosed}
                        />
                        <span className="text-2xl font-bold">:</span>
                        <NumberInput
                          label="Hosté"
                          value={editData.away_score ?? undefined}
                          onChange={(value) => handleInputChange('away_score', value)}
                          isDisabled={isSeasonClosed}
                        />
                      </div>
                      <Heading size={6}>Poločas</Heading>
                      <div className="flex items-center space-x-4">
                        <NumberInput
                          label="Domácí"
                          value={editData.home_score_halftime ?? undefined}
                          onChange={(value) => handleInputChange('home_score_halftime', value)}
                          isDisabled={isSeasonClosed}
                        />
                        <span className="text-2xl font-bold">:</span>
                        <NumberInput
                          label="Hosté"
                          value={editData.away_score_halftime ?? undefined}
                          onChange={(value) => handleInputChange('away_score_halftime', value)}
                          isDisabled={isSeasonClosed}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Selection Section */}
              <div className="col-span-1 lg:col-span-2">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2 mb-4">
                  Související video
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video (volitelné)
                  </label>
                  {selectedVideo ? (
                    <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedVideo.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedVideo.category?.name} •{' '}
                            {selectedVideo.recording_date
                              ? new Date(selectedVideo.recording_date).toLocaleDateString('cs-CZ')
                              : 'Neznámé datum'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleVideoSelect(null)}
                          isDisabled={isSeasonClosed}
                        >
                          Odstranit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="bordered"
                      startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                      onPress={() => setIsVideoModalOpen(true)}
                      className="w-full justify-start"
                      isDisabled={isSeasonClosed}
                    >
                      Vybrat video
                    </Button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Vyberte video pro propojení se zápasem
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      </UnifiedModal>

      {/* Video Selection Modal */}
      <VideoSelectionModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSelect={handleVideoSelect}
        selectedVideoId={selectedVideo?.id}
        categoryId={editData.category_id}
        opponentTeamId={editData.away_team_id}
      />
    </>
  );
}
