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
  Checkbox,
  CheckboxGroup,
  Card,
  CardBody,
  Divider,
  TimeInput,
} from '@heroui/react';
import {CalendarIcon, ClockIcon, PlusIcon} from '@heroicons/react/24/outline';
import {useAttendance} from '@/hooks/attendance/useAttendance';
import {formatDateString, formatTime} from '@/helpers';

interface TrainingSessionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedCategory?: string;
  selectedSeason?: string;
}

interface GeneratedSession {
  date: string;
  time: string;
  title: string;
  category_id: string;
}

export default function TrainingSessionGenerator({
  isOpen,
  onClose,
  onSuccess,
  selectedCategory,
  selectedSeason,
}: TrainingSessionGeneratorProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [trainingTime, setTrainingTime] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('Trénink');
  const [includeNumber, setIncludeNumber] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<GeneratedSession[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAttendanceRecords, setCreateAttendanceRecords] = useState(true);

  const {createTrainingSession, createAttendanceForLineupMembers} = useAttendance();

  // Use userCategories from UserContext instead of local state

  // Function to fetch lineup members directly
  const fetchLineupMembersForCategory = async (categoryId: string, seasonId: string) => {
    try {
      const {createClient} = await import('@/utils/supabase/client');
      const supabase = createClient();

      // First get the lineup for this category and season
      const {data: lineupData, error: lineupError} = await supabase
        .from('category_lineups')
        .select('id')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .single();

      if (lineupError || !lineupData) {
        return [];
      }

      // Then get the lineup members
      const {data: membersData, error: membersError} = await supabase
        .from('category_lineup_members')
        .select(
          `
          member_id,
          members!inner (
            id,
            name,
            surname,
            category_id
          )
        `
        )
        .eq('lineup_id', lineupData.id)
        .eq('is_active', true);

      if (membersError) {
        return [];
      }

      const memberIds = membersData?.map((item: any) => item.member_id).filter(Boolean) || [];
      return memberIds;
    } catch (err) {
      return [];
    }
  };

  // Days of the week options
  const dayOptions = [
    {value: 'monday', label: 'Pondělí'},
    {value: 'tuesday', label: 'Úterý'},
    {value: 'wednesday', label: 'Středa'},
    {value: 'thursday', label: 'Čtvrtek'},
    {value: 'friday', label: 'Pátek'},
    {value: 'saturday', label: 'Sobota'},
    {value: 'sunday', label: 'Neděle'},
  ];

  // Day mapping for JavaScript Date.getDay() to our day values
  const dayMap: {[key: string]: number} = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  // assignedCategories is now provided by UserContext

  // Generate sessions based on criteria
  const generateSessions = () => {
    if (!dateFrom || !dateTo || selectedDays.length === 0 || !trainingTime) {
      setError('Vyplňte všechna povinná pole');
      return;
    }

    const sessions: GeneratedSession[] = [];
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    // Validate date range
    if (startDate >= endDate) {
      setError('Datum do musí být později než datum od');
      return;
    }

    // Generate sessions for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayName = Object.keys(dayMap).find((day) => dayMap[day] === dayOfWeek);

      if (dayName && selectedDays.includes(dayName)) {
        const sessionNumber = sessions.length + 1;
        const title = includeNumber ? `${titleTemplate} ${sessionNumber}` : titleTemplate;

        // Use category ID directly
        sessions.push({
          date: currentDate.toISOString().split('T')[0],
          time: trainingTime,
          title,
          category_id: selectedCategory || '',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setGeneratedSessions(sessions);
    setError(null);
  };

  // Create all generated sessions
  const createAllSessions = async () => {
    if (generatedSessions.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const createdSessionIds: string[] = [];

      // Get lineup members for the selected category and season
      let memberIds: string[] = [];
      if (createAttendanceRecords && selectedCategory && selectedSeason) {
        try {
          memberIds = await fetchLineupMembersForCategory(selectedCategory, selectedSeason);

          // If no lineup members found, try to get all members from the category
          if (memberIds.length === 0) {
            const {createClient} = await import('@/utils/supabase/client');
            const supabase = createClient();

            if (selectedCategory) {
              const {data: membersData, error: membersError} = await supabase
                .from('members')
                .select('id')
                .eq('category_id', selectedCategory);

              if (!membersError && membersData) {
                memberIds = membersData.map((m: any) => m.id);
              }
            }
          }
        } catch (err) {
          // Could not fetch lineup members, skipping attendance creation
        }
      }

      for (const session of generatedSessions) {
        try {
          const createdSession = await createTrainingSession({
            title: session.title,
            session_date: session.date,
            session_time: session.time,
            category_id: session.category_id,
            season_id: selectedSeason || '', // Use the selected season ID
            description: `Automaticky vygenerovaný trénink - ${session.title}`,
          });

          createdSessionIds.push(createdSession.id);
          successCount++;

          // Create attendance records for lineup members if enabled
          if (createAttendanceRecords && memberIds.length > 0) {
            try {
              await createAttendanceForLineupMembers(
                createdSession.id,
                memberIds,
                'present' // Default status for generated sessions
              );
            } catch (attendanceErr) {
              // Don't fail the entire process if attendance creation fails
            }
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setGeneratedSessions([]);
        onSuccess?.();
        onClose();
      }

      if (errorCount > 0) {
        setError(`Vytvořeno ${successCount} tréninků, ${errorCount} se nepodařilo vytvořit`);
      }
    } catch (err) {
      setError('Chyba při vytváření tréninků');
      console.error('Error creating sessions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDays([]);
    setTrainingTime('');
    setTitleTemplate('Trénink');
    setIncludeNumber(false);
    setGeneratedSessions([]);
    setError(null);
    setCreateAttendanceRecords(true);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-blue-600" />
            <span>Generátor tréninků</span>
          </div>
        </ModalHeader>

        <ModalBody>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                placeholder="Vyberte datum"
                label="Datum od"
                isRequired
                aria-label="Datum od"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                placeholder="Vyberte datum"
                label="Datum do"
                isRequired
                aria-label="Datum do"
              />
            </div>
          </div>

          <div>
            <CheckboxGroup
              label="Dny v týdnu"
              orientation="horizontal"
              value={selectedDays}
              onValueChange={(values) => setSelectedDays(values as string[])}
            >
              {dayOptions.map((day) => (
                <Checkbox key={day.value} value={day.value}>
                  {day.label}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          {/* Time Selection */}
          <div>
            <TimeInput
              // value={trainingTime}
              onChange={(e) => setTrainingTime(e?.toString() || '')}
              label="Čas tréninku"
              isRequired
              hourCycle={24}
              aria-label="Čas tréninku"
              startContent={<ClockIcon className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Title Template */}
          <div>
            <Input
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              placeholder="Základní název tréninku"
              label="Název tréninku"
              isRequired
              aria-label="Název tréninku"
            />
            <div className="mt-2">
              <Checkbox
                isSelected={includeNumber}
                onValueChange={setIncludeNumber}
                aria-label="Přidat číslo do názvu"
              >
                Přidat číslo do názvu (např. &quot;Trénink 1&quot;, &quot;Trénink 2&quot;)
              </Checkbox>
            </div>
          </div>

          {/* Attendance Records Option */}
          <div>
            <Checkbox
              isSelected={createAttendanceRecords}
              onValueChange={setCreateAttendanceRecords}
              aria-label="Vytvořit záznamy docházky"
            >
              Automaticky vytvořit záznamy docházky pro členy sestavy (výchozí: přítomen)
            </Checkbox>
            <p className="text-sm text-gray-600 mt-1">
              Pokud je zaškrtnuto, budou automaticky vytvořeny záznamy docházky pro všechny členy
              sestavy vybrané kategorie a sezóny.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              color="primary"
              onPress={generateSessions}
              isDisabled={!dateFrom || !dateTo || selectedDays.length === 0 || !trainingTime}
            >
              Generovat náhled
            </Button>
          </div>

          {/* Generated Sessions Preview */}
          {generatedSessions.length > 0 && (
            <>
              <Divider className="my-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Náhled vygenerovaných tréninků ({generatedSessions.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                  {generatedSessions.map((session, index) => (
                    <Card key={index} className="p-3">
                      <CardBody className="p-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-gray-600">
                              {formatDateString(session.date)} v {formatTime(session.time)}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {
                              dayOptions.find(
                                (d) =>
                                  d.value ===
                                  Object.keys(dayMap).find(
                                    (day) => dayMap[day] === new Date(session.date).getDay()
                                  )
                              )?.label
                            }
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Zrušit
          </Button>
          {generatedSessions.length > 0 && (
            <Button
              color="success"
              onPress={createAllSessions}
              isLoading={isGenerating}
              isDisabled={isGenerating}
            >
              {isGenerating ? 'Vytváření...' : `Vytvořit ${generatedSessions.length} tréninků`}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
