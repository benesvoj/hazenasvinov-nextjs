import {Genders} from '@/enums';

import {PlayerSearchResult} from './unifiedPlayer';

export interface CreateExternalPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerCreated: (player: PlayerSearchResult) => void;
  teamName?: string;
  categoryId?: string; // Add categoryId to determine gender
}

export interface ExternalPlayerFormData {
  name: string;
  surname: string;
  registration_number: string;
  position: 'goalkeeper' | 'field_player';
  jersey_number: string;
  club_name: string;
  is_captain: boolean;
  sex: Genders;
}
