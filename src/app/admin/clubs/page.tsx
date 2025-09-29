'use client';

import React, {useState, useEffect, useCallback} from 'react';

import Link from 'next/link';

import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

import LogoUpload from '@/components/ui/forms/LogoUpload';

import {createClient} from '@/utils/supabase/client';

import {Club} from '@/types';

export default function ClubsAdminPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filtered clubs to prevent unnecessary re-renders
  const filteredClubs = React.useMemo(() => {
    if (!searchTerm.trim()) return clubs;
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.short_name && club.short_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (club.city && club.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clubs, searchTerm]);

  // Memoize search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Modal states
  const {isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose} = useDisclosure();
  const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    short_name: '',
    city: '',
    founded_year: '',
    logo_url: '',
    venue: '',
    web: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    contact_person: '',
    is_own_club: false,
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    short_name: '',
    city: '',
    founded_year: '',
    logo_url: '',
    venue: '',
    web: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    contact_person: '',
    is_own_club: false,
  });

  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);

  const supabase = createClient();

  // Fetch clubs
  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const {data, error} = await supabase.from('clubs').select('*').order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      setError('Chyba při načítání klubů');
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create club
  const handleCreateClub = async () => {
    try {
      if (!createForm.name.trim()) {
        setError('Název klubu je povinný');
        return;
      }

      const {error} = await supabase.from('clubs').insert({
        name: createForm.name.trim(),
        short_name: createForm.short_name.trim() || null,
        city: createForm.city.trim() || null,
        founded_year: createForm.founded_year ? parseInt(createForm.founded_year) : null,
        logo_url: createForm.logo_url.trim() || null,
        venue: createForm.venue.trim() || null,
        web: createForm.web.trim() || null,
        email: createForm.email.trim() || null,
        phone: createForm.phone.trim() || null,
        address: createForm.address.trim() || null,
        description: createForm.description.trim() || null,
        contact_person: createForm.contact_person.trim() || null,
        is_own_club: createForm.is_own_club,
      });

      if (error) throw error;

      onCreateClose();
      setCreateForm({
        name: '',
        short_name: '',
        city: '',
        founded_year: '',
        logo_url: '',
        venue: '',
        web: '',
        email: '',
        phone: '',
        address: '',
        description: '',
        contact_person: '',
        is_own_club: false,
      });
      fetchClubs();
      setError('');
    } catch (error) {
      setError('Chyba při vytváření klubu');
      console.error('Error creating club:', error);
    }
  };

  // Update club
  const handleUpdateClub = async () => {
    try {
      if (!editForm.name.trim()) {
        setError('Název klubu je povinný');
        return;
      }

      const {error} = await supabase
        .from('clubs')
        .update({
          name: editForm.name.trim(),
          short_name: editForm.short_name.trim() || null,
          city: editForm.city.trim() || null,
          founded_year: editForm.founded_year ? parseInt(editForm.founded_year) : null,
          logo_url: editForm.logo_url && editForm.logo_url.trim() ? editForm.logo_url.trim() : null,
          venue: editForm.venue.trim() || null,
          web: editForm.web.trim() || null,
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null,
          description: editForm.description.trim() || null,
          contact_person: editForm.contact_person.trim() || null,
          is_own_club: editForm.is_own_club,
        })
        .eq('id', editForm.id);

      if (error) {
        throw error;
      }

      // Refresh the clubs list first
      await fetchClubs();

      // Then close the modal and reset form
      onEditClose();
      setEditForm({
        id: '',
        name: '',
        short_name: '',
        city: '',
        founded_year: '',
        logo_url: '',
        venue: '',
        web: '',
        email: '',
        phone: '',
        address: '',
        description: '',
        contact_person: '',
        is_own_club: false,
      });
      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci klubu');
      console.error('Error updating club:', error);
    }
  };

  // Delete club
  const handleDeleteClub = async () => {
    if (!clubToDelete) return;

    try {
      const {error} = await supabase.from('clubs').delete().eq('id', clubToDelete.id);

      if (error) throw error;

      onDeleteClose();
      setClubToDelete(null);
      fetchClubs();
      setError('');
    } catch (error) {
      setError('Chyba při mazání klubu');
      console.error('Error deleting club:', error);
    }
  };

  // Open edit modal
  const openEditModal = (club: Club) => {
    setEditForm({
      id: club.id,
      name: club.name,
      short_name: club.short_name || '',
      city: club.city || '',
      founded_year: club.founded_year?.toString() || '',
      logo_url: club.logo_url || '',
      venue: club.venue || '',
      web: club.web || '',
      email: club.email || '',
      phone: club.phone || '',
      address: club.address || '',
      description: club.description || '',
      contact_person: club.contact_person || '',
      is_own_club: club.is_own_club || false,
    });
    onEditOpen();
  };

  // Open delete modal
  const openDeleteModal = (club: Club) => {
    setClubToDelete(club);
    onDeleteOpen();
  };

  // Filtered clubs

  // Initial fetch
  useEffect(() => {
    const loadClubs = async () => {
      try {
        await fetchClubs();
      } catch (error) {
        console.error('Error loading clubs:', error);
      }
    };

    loadClubs();
  }, [fetchClubs]);

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Správa klubů</h2>
          </div>

          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onCreateOpen}
            size="sm"
            aria-label="Přidat nový klub"
          >
            Přidat klub
          </Button>
        </CardHeader>

        <CardBody>
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Hledat kluby..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="space-y-4">
              {filteredClubs.map((club) => (
                <div
                  key={club.id}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {club.logo_url && (
                        <Image
                          src={club.logo_url}
                          alt={`${club.name} logo`}
                          className="object-contain rounded"
                          width={48}
                          height={48}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-800">{club.name}</h3>
                          {club.is_own_club && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Domácí klub
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {club.short_name && club.short_name !== club.name && (
                            <p>Krátký název: {club.short_name}</p>
                          )}
                          {club.city && <p>Město: {club.city}</p>}
                          {club.founded_year && <p>Založen: {club.founded_year}</p>}
                          {club.venue && <p>Hřiště: {club.venue}</p>}
                          {club.web && <p>Web: {club.web}</p>}
                          {club.email && <p>Email: {club.email}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/clubs/${club.id}`}
                        prefetch={true}
                        scroll={false}
                        replace={false}
                      >
                        <Button
                          size="sm"
                          color="primary"
                          variant="light"
                          startContent={<EyeIcon className="w-4 h-4" />}
                          aria-label={`Zobrazit detail klubu ${club.name}`}
                        >
                          Detail
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        color="primary"
                        variant="light"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={() => openEditModal(club)}
                        aria-label={`Upravit klub ${club.name}`}
                      >
                        Upravit
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        onPress={() => openDeleteModal(club)}
                        aria-label={`Smazat klub ${club.name}`}
                      >
                        Smazat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredClubs.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {searchTerm ? 'Žádné kluby nenalezeny' : 'Žádné kluby'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Zkuste změnit vyhledávací termín'
                      : 'Začněte přidáním prvního klubu'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Club Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalContent>
          <ModalHeader>Přidat nový klub</ModalHeader>
          <ModalBody>
            <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Název klubu *"
                placeholder="např. Hazena Švínov"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
              />
              <Input
                label="Krátký název"
                placeholder="např. Švínov"
                value={createForm.short_name}
                onChange={(e) => setCreateForm({...createForm, short_name: e.target.value})}
              />
              <Input
                label="Město"
                placeholder="např. Švínov"
                value={createForm.city}
                onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
              />
              <Input
                label="Rok založení"
                type="number"
                placeholder="např. 1920"
                value={createForm.founded_year}
                onChange={(e) => setCreateForm({...createForm, founded_year: e.target.value})}
              />
              <LogoUpload
                value={createForm.logo_url}
                onChange={(logoUrl) => setCreateForm({...createForm, logo_url: logoUrl})}
                label="Logo klubu"
                description="Nahrajte logo klubu (max 5MB, JPG/PNG)"
              />
              <Input
                label="Hřiště/venue"
                placeholder="např. Sportovní hala Švínov"
                value={createForm.venue}
                onChange={(e) => setCreateForm({...createForm, venue: e.target.value})}
              />
              <Input
                label="Webové stránky"
                placeholder="https://example.com"
                value={createForm.web}
                onChange={(e) => setCreateForm({...createForm, web: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                placeholder="info@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
              />
              <Input
                label="Telefon"
                placeholder="+420 123 456 789"
                value={createForm.phone}
                onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
              />
              <Input
                label="Adresa"
                placeholder="ulice, město, PSČ"
                value={createForm.address}
                onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
              />
              <Input
                label="Popis"
                placeholder="Krátký popis klubu..."
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
              />
              <Input
                label="Kontaktní osoba"
                placeholder="Jméno a příjmení"
                value={createForm.contact_person}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    contact_person: e.target.value,
                  })
                }
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create-is-own-club"
                  checked={createForm.is_own_club}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      is_own_club: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="create-is-own-club" className="text-sm font-medium text-gray-700">
                  Tento klub je náš domácí klub (pro filtrování zápasů a tabulek)
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onCreateClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleCreateClub}>
              Vytvořit klub
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Club Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader>Upravit klub</ModalHeader>
          <ModalBody>
            <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Název klubu *"
                placeholder="např. Hazena Švínov"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
              <Input
                label="Krátký název"
                placeholder="např. Švínov"
                value={editForm.short_name}
                onChange={(e) => setEditForm({...editForm, short_name: e.target.value})}
              />
              <Input
                label="Město"
                placeholder="např. Švínov"
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
              />
              <Input
                label="Rok založení"
                type="number"
                placeholder="např. 1920"
                value={editForm.founded_year}
                onChange={(e) => setEditForm({...editForm, founded_year: e.target.value})}
              />
              <LogoUpload
                value={editForm.logo_url}
                onChange={(logoUrl) => {
                  setEditForm({...editForm, logo_url: logoUrl});
                }}
                label="Logo klubu"
                description="Nahrajte logo klubu (max 5MB, JPG/PNG)"
              />
              <Input
                label="Hřiště/venue"
                placeholder="např. Sportovní hala Švínov"
                value={editForm.venue}
                onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
              />
              <Input
                label="Webové stránky"
                placeholder="https://example.com"
                value={editForm.web}
                onChange={(e) => setEditForm({...editForm, web: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                placeholder="info@example.com"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
              <Input
                label="Telefon"
                placeholder="+420 123 456 789"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
              <Input
                label="Adresa"
                placeholder="ulice, město, PSČ"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              />
              <Input
                label="Popis"
                placeholder="Krátký popis klubu..."
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
              <Input
                label="Kontaktní osoba"
                placeholder="Jméno a příjmení"
                value={editForm.contact_person}
                onChange={(e) => setEditForm({...editForm, contact_person: e.target.value})}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-own-club"
                  checked={editForm.is_own_club}
                  onChange={(e) => setEditForm({...editForm, is_own_club: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit-is-own-club" className="text-sm font-medium text-gray-700">
                  Tento klub je náš domácí klub (pro filtrování zápasů a tabulek)
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateClub}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalContent>
          <ModalHeader>Potvrdit smazání klubu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat klub <strong>{clubToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Tato akce je nevratná a smaže všechny související údaje o klubu.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onDeleteClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteClub}>
              Smazat klub
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
