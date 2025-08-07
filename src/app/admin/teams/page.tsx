'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  HomeIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

interface Team {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  region?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  founded_year?: number;
  home_venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Modal states
  const { isOpen: isAddTeamOpen, onOpen: onAddTeamOpen, onClose: onAddTeamClose } = useDisclosure();
  const { isOpen: isEditTeamOpen, onOpen: onEditTeamOpen, onClose: onEditTeamClose } = useDisclosure();
  const { isOpen: isViewTeamOpen, onOpen: onViewTeamOpen, onClose: onViewTeamClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    city: '',
    region: '',
    logo_url: '',
    website: '',
    email: '',
    phone: '',
    contact_person: '',
    founded_year: '',
    home_venue: '',
    is_active: true
  });

  const supabase = createClient();

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      setError('Chyba při načítání týmů');
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Add new team
  const handleAddTeam = async () => {
    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          name: formData.name,
          short_name: formData.short_name || null,
          city: formData.city || null,
          region: formData.region || null,
          logo_url: formData.logo_url || null,
          website: formData.website || null,
          email: formData.email || null,
          phone: formData.phone || null,
          contact_person: formData.contact_person || null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          home_venue: formData.home_venue || null,
          is_active: formData.is_active
        });

      if (error) throw error;
      
      onAddTeamClose();
      setFormData({
        name: '',
        short_name: '',
        city: '',
        region: '',
        logo_url: '',
        website: '',
        email: '',
        phone: '',
        contact_person: '',
        founded_year: '',
        home_venue: '',
        is_active: true
      });
      fetchTeams();
    } catch (error) {
      setError('Chyba při přidávání týmu');
      console.error('Error adding team:', error);
    }
  };

  // Update team
  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          short_name: formData.short_name || null,
          city: formData.city || null,
          region: formData.region || null,
          logo_url: formData.logo_url || null,
          website: formData.website || null,
          email: formData.email || null,
          phone: formData.phone || null,
          contact_person: formData.contact_person || null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          home_venue: formData.home_venue || null,
          is_active: formData.is_active
        })
        .eq('id', selectedTeam.id);

      if (error) throw error;
      
      onEditTeamClose();
      setSelectedTeam(null);
      setFormData({
        name: '',
        short_name: '',
        city: '',
        region: '',
        logo_url: '',
        website: '',
        email: '',
        phone: '',
        contact_person: '',
        founded_year: '',
        home_venue: '',
        is_active: true
      });
      fetchTeams();
    } catch (error) {
      setError('Chyba při aktualizaci týmu');
      console.error('Error updating team:', error);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Opravdu chcete smazat tento tým?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      fetchTeams();
    } catch (error) {
      setError('Chyba při mazání týmu');
      console.error('Error deleting team:', error);
    }
  };

  // Open edit modal
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      short_name: team.short_name || '',
      city: team.city || '',
      region: team.region || '',
      logo_url: team.logo_url || '',
      website: team.website || '',
      email: team.email || '',
      phone: team.phone || '',
      contact_person: team.contact_person || '',
      founded_year: team.founded_year?.toString() || '',
      home_venue: team.home_venue || '',
      is_active: team.is_active
    });
    onEditTeamOpen();
  };

  // Open view modal
  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    onViewTeamOpen();
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge color="success" variant="flat">Aktivní</Badge>
    ) : (
      <Badge color="danger" variant="flat">Neaktivní</Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Správa týmů
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spravujte informace o všech týmech v soutěžích
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seznam týmů</h2>
        <Button 
          color="primary" 
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={onAddTeamOpen}
        >
          Přidat tým
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Teams List */}
      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        {team.short_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.short_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(team.is_active)}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {team.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPinIcon className="w-4 h-4 text-gray-500" />
                        <span>{team.city}</span>
                        {team.region && <span className="text-gray-500">({team.region})</span>}
                      </div>
                    )}
                    {team.home_venue && (
                      <div className="flex items-center gap-2 text-sm">
                        <HomeIcon className="w-4 h-4 text-gray-500" />
                        <span>{team.home_venue}</span>
                      </div>
                    )}
                    {team.contact_person && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>{team.contact_person}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<EyeIcon className="w-3 h-3" />}
                        onPress={() => handleViewTeam(team)}
                      >
                        Zobrazit
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        startContent={<PencilIcon className="w-3 h-3" />}
                        onPress={() => handleEditTeam(team)}
                      >
                        Upravit
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<TrashIcon className="w-3 h-3" />}
                      onPress={() => handleDeleteTeam(team.id)}
                    >
                      Smazat
                    </Button>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Žádné týmy nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Team Modal */}
      <Modal isOpen={isAddTeamOpen} onClose={onAddTeamClose}>
        <ModalContent>
          <ModalHeader>Přidat nový tým</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název týmu *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Zkratka"
                value={formData.short_name}
                onChange={(e) => setFormData({...formData, short_name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Město"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
                <Input
                  label="Kraj"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                />
              </div>
              <Input
                label="Domácí hala"
                value={formData.home_venue}
                onChange={(e) => setFormData({...formData, home_venue: e.target.value})}
              />
              <Input
                label="Webové stránky"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <Input
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Input
                label="Kontaktní osoba"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              />
              <Input
                label="Rok založení"
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
              />
              <Input
                label="Logo URL"
                value={formData.logo_url}
                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onAddTeamClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddTeam}>
              Přidat tým
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={isEditTeamOpen} onClose={onEditTeamClose}>
        <ModalContent>
          <ModalHeader>Upravit tým</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název týmu *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Zkratka"
                value={formData.short_name}
                onChange={(e) => setFormData({...formData, short_name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Město"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
                <Input
                  label="Kraj"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                />
              </div>
              <Input
                label="Domácí hala"
                value={formData.home_venue}
                onChange={(e) => setFormData({...formData, home_venue: e.target.value})}
              />
              <Input
                label="Webové stránky"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <Input
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Input
                label="Kontaktní osoba"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              />
              <Input
                label="Rok založení"
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
              />
              <Input
                label="Logo URL"
                value={formData.logo_url}
                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditTeamClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateTeam}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Team Modal */}
      <Modal isOpen={isViewTeamOpen} onClose={onViewTeamClose}>
        <ModalContent>
          <ModalHeader>Detail týmu</ModalHeader>
          <ModalBody>
            {selectedTeam && (
              <div className="space-y-6">
                <div className="text-center">
                  <BuildingOfficeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">{selectedTeam.name}</h3>
                  {selectedTeam.short_name && (
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {selectedTeam.short_name}
                    </p>
                  )}
                  {getStatusBadge(selectedTeam.is_active)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Základní informace</h4>
                    <div className="space-y-3">
                      {selectedTeam.city && (
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedTeam.city}</span>
                          {selectedTeam.region && <span className="text-gray-500">({selectedTeam.region})</span>}
                        </div>
                      )}
                      {selectedTeam.home_venue && (
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedTeam.home_venue}</span>
                        </div>
                      )}
                      {selectedTeam.founded_year && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>Založen {selectedTeam.founded_year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Kontakt</h4>
                    <div className="space-y-3">
                      {selectedTeam.contact_person && (
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedTeam.contact_person}</span>
                        </div>
                      )}
                      {selectedTeam.email && (
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedTeam.email}</span>
                        </div>
                      )}
                      {selectedTeam.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedTeam.phone}</span>
                        </div>
                      )}
                      {selectedTeam.website && (
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4 text-gray-500" />
                          <a href={selectedTeam.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedTeam.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onViewTeamClose}>
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
