'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import LineupManager from './LineupManager';
import { Match, Member } from '@/types';

interface LineupManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMatch: Match | null;
    members: Member[];
}

export default function LineupManagerModal({ 
    isOpen, 
    onClose, 
    selectedMatch, 
    members 
}: LineupManagerModalProps) {
    if (!selectedMatch) return null;

    const lineupManagerProps = {
        matchId: selectedMatch.id,
        homeTeamId: selectedMatch.home_team_id,
        awayTeamId: selectedMatch.away_team_id,
        homeTeamName: selectedMatch.home_team?.name || 'Neznámý tým',
        awayTeamName: selectedMatch.away_team?.name || 'Neznámý tým',
        members: members,
        categoryId: selectedMatch.category_id,
        onClose: onClose,
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalContent>
                <ModalHeader>
                    Správa sestav - {selectedMatch.home_team?.name} vs {selectedMatch.away_team?.name}
                </ModalHeader>
                <ModalBody>
                    <LineupManager 
                        key={selectedMatch.id} 
                        {...lineupManagerProps} 
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="flat" onPress={onClose}>
                        Zavřít
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}