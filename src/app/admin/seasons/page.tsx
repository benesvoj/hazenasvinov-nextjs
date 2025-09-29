'use client';

import React, {useState, useEffect, useCallback} from 'react';

import {Badge} from '@heroui/badge';
import {Button} from '@heroui/button';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Input} from '@heroui/input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal';

import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {createClient} from '@/utils/supabase/client';

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export default function SeasonsAdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Modal states
  const {
    isOpen: isAddSeasonOpen,
    onOpen: onAddSeasonOpen,
    onClose: onAddSeasonClose,
  } = useDisclosure();
  const {
    isOpen: isEditSeasonOpen,
    onOpen: onEditSeasonOpen,
    onClose: onEditSeasonClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteSeasonOpen,
    onOpen: onDeleteSeasonOpen,
    onClose: onDeleteSeasonClose,
  } = useDisclosure();

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    is_closed: false,
  });

  const supabase = createClient();

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const {data, error} = await supabase
        .from('seasons')
        .select('*')
        .order('name', {ascending: false});

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      setError('Chyba při načítání sezón');
      console.error('Error fetching seasons:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // Add new season
  const handleAddSeason = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.start_date || !formData.end_date) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      // Check if start date is before end date
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        setError('Datum začátku musí být před datem konce');
        return;
      }

      // If setting as active, deactivate other seasons
      if (formData.is_active) {
        await supabase.from('seasons').update({is_active: false}).eq('is_active', true);
      }

      const {error} = await supabase.from('seasons').insert({
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        is_closed: formData.is_closed,
      });

      if (error) throw error;

      onAddSeasonClose();
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
        is_closed: false,
      });
      fetchSeasons();
      setError('');
    } catch (error) {
      setError('Chyba při přidávání sezóny');
      console.error('Error adding season:', error);
    }
  };

  // Update season
  const handleUpdateSeason = async () => {
    if (!selectedSeason) return;

    try {
      // Validate form data
      if (!formData.name || !formData.start_date || !formData.end_date) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      // Check if start date is before end date
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        setError('Datum začátku musí být před datem konce');
        return;
      }

      // If setting as active, deactivate other seasons
      if (formData.is_active) {
        await supabase
          .from('seasons')
          .update({is_active: false})
          .eq('is_active', true)
          .neq('id', selectedSeason.id);
      }

      const {error} = await supabase
        .from('seasons')
        .update({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: formData.is_active,
          is_closed: formData.is_closed,
        })
        .eq('id', selectedSeason.id);

      if (error) throw error;

      onEditSeasonClose();
      setSelectedSeason(null);
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
        is_closed: false,
      });
      fetchSeasons();
      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci sezóny');
      console.error('Error updating season:', error);
    }
  };

  // Delete season
  const handleDeleteSeason = async () => {
    if (!selectedSeason) return;

    try {
      const {error} = await supabase.from('seasons').delete().eq('id', selectedSeason.id);

      if (error) throw error;

      onDeleteSeasonClose();
      setSelectedSeason(null);
      fetchSeasons();
    } catch (error) {
      setError('Chyba při mazání sezóny');
      console.error('Error deleting season:', error);
    }
  };

  // Open edit modal
  const openEditModal = (season: Season) => {
    setSelectedSeason(season);
    setFormData({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      is_active: season.is_active,
      is_closed: season.is_closed,
    });
    onEditSeasonOpen();
  };

  // Open delete modal
  const openDeleteModal = (season: Season) => {
    setSelectedSeason(season);
    onDeleteSeasonOpen();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
      is_closed: false,
    });
    setError('');
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Sezóny</h2>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onAddSeasonOpen();
            }}
          >
            Přidat sezónu
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Název</th>
                    <th className="text-left py-3 px-4">Začátek</th>
                    <th className="text-left py-3 px-4">Konec</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season) => (
                    <tr
                      key={season.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4 font-medium">{season.name}</td>
                      <td className="py-3 px-4">
                        {new Date(season.start_date).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(season.end_date).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge color={season.is_active ? 'success' : 'default'} variant="flat">
                            {season.is_active ? (
                              <>
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Aktivní
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="w-3 h-3 mr-1" />
                                Neaktivní
                              </>
                            )}
                          </Badge>
                          <Badge color={season.is_closed ? 'danger' : 'default'} variant="flat">
                            {season.is_closed ? (
                              <>
                                <XMarkIcon className="w-3 h-3 mr-1" />
                                Uzavřená
                              </>
                            ) : (
                              <>
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Otevřená
                              </>
                            )}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => openEditModal(season)}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => openDeleteModal(season)}
                          >
                            Smazat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {seasons.length === 0 && (
                <div className="text-center py-8 text-gray-500">Žádné sezóny nebyly nalezeny</div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Season Modal */}
      <Modal isOpen={isAddSeasonOpen} onClose={onAddSeasonClose}>
        <ModalContent>
          <ModalHeader>Přidat sezónu</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název sezóny"
                placeholder="např. 2024/2025"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isRequired
              />

              <Input
                label="Datum začátku"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                isRequired
              />

              <Input
                label="Datum konce"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                isRequired
              />

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Aktivní sezóna
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_closed}
                  onChange={(e) => setFormData({...formData, is_closed: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Uzavřená sezóna
                </span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddSeasonClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddSeason}>
              Přidat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Season Modal */}
      <Modal isOpen={isEditSeasonOpen} onClose={onEditSeasonClose}>
        <ModalContent>
          <ModalHeader>Upravit sezónu</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název sezóny"
                placeholder="např. 2024/2025"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isRequired
              />

              <Input
                label="Datum začátku"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                isRequired
              />

              <Input
                label="Datum konce"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                isRequired
              />

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Aktivní sezóna
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_closed}
                  onChange={(e) => setFormData({...formData, is_closed: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Uzavřená sezóna
                </span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditSeasonClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateSeason}>
              Uložit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Season Modal */}
      <Modal isOpen={isDeleteSeasonOpen} onClose={onDeleteSeasonClose}>
        <ModalContent>
          <ModalHeader>Smazat sezónu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat sezónu <strong>{selectedSeason?.name}</strong>? Tato akce je
              nevratná a může ovlivnit související data.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteSeasonClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteSeason}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
