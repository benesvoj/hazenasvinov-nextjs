'use client';

import {useState, useEffect, useCallback, useRef} from 'react';

import {Input, Select, SelectItem, Button} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {Member} from '@/types';

interface LineupCoachSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoachSelected: (coach: {member_id: string; role: string}) => void;
  coaches: Member[];
  editingCoachIndex?: number | null;
  currentCoach?: {member_id: string; role: string} | null;
}

export default function LineupCoachSelectionModal({
  isOpen,
  onClose,
  onCoachSelected,
  coaches,
  editingCoachIndex,
  currentCoach,
}: LineupCoachSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('assistant_coach');
  const [filteredCoaches, setFilteredCoaches] = useState<Member[]>(coaches);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEditing = editingCoachIndex !== null && editingCoachIndex !== undefined;

  // Filter coaches based on search term
  const filterCoaches = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setFilteredCoaches(coaches);
        return;
      }

      const filtered = coaches.filter(
        (coach) =>
          coach.name.toLowerCase().includes(term.toLowerCase()) ||
          coach.surname.toLowerCase().includes(term.toLowerCase()) ||
          coach.registration_number?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCoaches(filtered);
    },
    [coaches]
  );

  // Debounced search
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        filterCoaches(term);
      }, 300);
    },
    [filterCoaches]
  );

  // Initialize with current coach data when editing
  useEffect(() => {
    if (isEditing && currentCoach) {
      setSelectedCoach(currentCoach.member_id);
      setSelectedRole(currentCoach.role);
    } else {
      setSelectedCoach('');
      setSelectedRole('assistant_coach');
    }
  }, [isEditing, currentCoach]);

  // Initialize filtered coaches
  useEffect(() => {
    setFilteredCoaches(coaches);
  }, [coaches]);

  const handleSave = () => {
    if (selectedCoach && selectedRole) {
      onCoachSelected({
        member_id: selectedCoach,
        role: selectedRole,
      });
      onClose();
    }
  };

  const getCoachName = (coach: Member) => {
    return `${coach.surname} ${coach.name} (${coach.registration_number})`;
  };

  const modalTitle = isEditing ? 'Upravit trenéra' : 'Vybrat trenéra';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      isFooterWithActions
      onPress={handleSave}
      isDisabled={!selectedCoach || !selectedRole}
    >
      <div className="space-y-6">
        {/* Search */}
        <Input
          label="Hledat trenéra"
          type="search"
          placeholder="Jméno, příjmení nebo registrační číslo..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Coach Selection */}
        <Select
          label="Trenér"
          placeholder="Vyberte trenéra"
          selectedKeys={selectedCoach ? [selectedCoach] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            setSelectedCoach(selectedKey);
          }}
          isRequired
        >
          {filteredCoaches.map((coach) => (
            <SelectItem key={coach.id} textValue={getCoachName(coach)}>
              {getCoachName(coach)}
            </SelectItem>
          ))}
        </Select>

        {/* Role Selection */}
        <Select
          label="Funkce"
          placeholder="Vyberte funkci"
          selectedKeys={selectedRole ? [selectedRole] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            setSelectedRole(selectedKey);
          }}
          isRequired
        >
          <SelectItem key="head_coach" textValue="Hlavní trenér">
            Hlavní trenér
          </SelectItem>
          <SelectItem key="assistant_coach" textValue="Asistent trenéra">
            Asistent trenéra
          </SelectItem>
          <SelectItem key="team_manager" textValue="Vedoucí týmu">
            Vedoucí týmu
          </SelectItem>
        </Select>
      </div>
    </UnifiedModal>
  );
}
