'use client';

import React, {useState, useEffect, useCallback} from 'react';

import {
  Input,
  Button,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';

import LogoUpload from '@/components/ui/forms/LogoUpload';

import {translations} from '@/lib/translations';

import {createClient} from '@/utils/supabase/client';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes} from '@/enums';
import {Club} from '@/types';

const initialFormData: Club = {
  id: '',
  name: '',
  short_name: '',
  city: '',
  founded_year: null,
  logo_url: '',
  venue: '',
  web: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  contact_person: '',
  is_own_club: false,
  is_active: true,
  created_at: '',
  updated_at: '',
};

export default function ClubsAdminPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const tAction = translations.action;

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
  const [createForm, setCreateForm] = useState(initialFormData);

  const [editForm, setEditForm] = useState(initialFormData);

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
        short_name: createForm.short_name?.trim() || null,
        city: createForm.city?.trim() || null,
        founded_year: createForm.founded_year ? createForm.founded_year : null,
        logo_url: createForm.logo_url?.trim() || null,
        venue: createForm.venue?.trim() || null,
        web: createForm.web?.trim() || null,
        email: createForm.email?.trim() || null,
        phone: createForm.phone?.trim() || null,
        address: createForm.address?.trim() || null,
        description: createForm.description?.trim() || null,
        contact_person: createForm.contact_person?.trim() || null,
        is_own_club: createForm.is_own_club,
      });

      if (error) throw error;

      onCreateClose();
      setCreateForm(initialFormData);
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
          short_name: editForm.short_name?.trim() || null,
          city: editForm.city?.trim() || null,
          founded_year: editForm.founded_year ? editForm.founded_year : null,
          logo_url: editForm.logo_url && editForm.logo_url.trim() ? editForm.logo_url.trim() : null,
          venue: editForm.venue?.trim() || null,
          web: editForm.web?.trim() || null,
          email: editForm.email?.trim() || null,
          phone: editForm.phone?.trim() || null,
          address: editForm.address?.trim() || null,
          description: editForm.description?.trim() || null,
          contact_person: editForm.contact_person?.trim() || null,
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
      setEditForm(initialFormData);
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
      founded_year: club.founded_year || null,
      logo_url: club.logo_url || '',
      venue: club.venue || '',
      web: club.web || '',
      email: club.email || '',
      phone: club.phone || '',
      address: club.address || '',
      description: club.description || '',
      contact_person: club.contact_person || '',
      is_own_club: club.is_own_club || false,
      is_active: club.is_active,
      created_at: club.created_at,
      updated_at: club.updated_at,
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

  const t = translations.admin.clubs;

  const filters = (
    <Input
      placeholder={t.filters.placeholder}
      value={searchTerm}
      onChange={handleSearchChange}
      className="max-w-md"
    />
  );

  const clubColumns = [
    {key: 'logo', label: t.table.logo},
    {key: 'name', label: t.table.name},
    {key: 'short_name', label: t.table.shortName},
    {key: 'city', label: t.table.city},
    {key: 'founded_year', label: t.table.foundedYear},
    {key: 'venue', label: t.table.venue},
    {
      key: 'actions',
      label: t.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: openEditModal, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: openDeleteModal, title: tAction.delete},
      ],
    },
  ];

  const renderClubCell = (club: Club, columnKey: string) => {
    switch (columnKey) {
      case 'logo':
        return <Image src={club.logo_url} alt={club.name} width={48} height={48} />;
      case 'name':
        return <span className="font-medium">{club.name}</span>;
      case 'short_name':
        return <span className="font-medium">{club.short_name}</span>;
      case 'city':
        return <span className="font-medium">{club.city}</span>;
      case 'founded_year':
        return <span className="font-medium">{club.founded_year}</span>;
      case 'venue':
        return <span className="font-medium">{club.venue}</span>;
    }
  };

  return (
    <AdminContainer
      actions={[
        {
          label: t.addClub,
          onClick: onCreateOpen,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ]}
      loading={loading}
      filters={filters}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <UnifiedTable
        isLoading={loading}
        columns={clubColumns}
        data={filteredClubs}
        ariaLabel={t.title}
        renderCell={renderClubCell}
        getKey={(club: Club) => club.id}
        emptyContent={t.table.noClubs}
        isStriped
      />

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
                value={createForm.founded_year?.toString() || ''}
                onChange={(e) =>
                  setCreateForm({...createForm, founded_year: parseInt(e.target.value)})
                }
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
                value={editForm.founded_year?.toString() || ''}
                onChange={(e) => setEditForm({...editForm, founded_year: parseInt(e.target.value)})}
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
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteClub}
        title={t.deleteClub}
        message={t.deleteClubMessage}
      />
    </AdminContainer>
  );
}
