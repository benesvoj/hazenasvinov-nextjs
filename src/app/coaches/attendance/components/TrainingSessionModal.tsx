"use client";

import {
  Input,
  Textarea,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { TrainingSession, TrainingSessionFormData } from "@/types";
import { useState, useEffect } from "react";

interface TrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TrainingSessionFormData) => void;
  session?: TrainingSession | null;
  selectedCategory: string;
  selectedSeason: string;
}

export default function TrainingSessionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  session,
  selectedCategory,
  selectedSeason
}: TrainingSessionModalProps) {
  const [sessionFormData, setSessionFormData] = useState<TrainingSessionFormData>({
    title: "",
    description: "",
    session_date: "",
    session_time: "",
    category: selectedCategory,
    season_id: selectedSeason,
    location: "",
  });

  // Update form data when session prop changes (for editing)
  useEffect(() => {
    if (session) {
      setSessionFormData({
        title: session.title,
        description: session.description || "",
        session_date: session.session_date,
        session_time: session.session_time || "",
        category: session.category,
        season_id: session.season_id,
        location: session.location || ""
      });
    } else {
      // Reset form for new session
      setSessionFormData({
        title: "",
        description: "",
        session_date: "",
        session_time: "",
        category: selectedCategory,
        season_id: selectedSeason,
        location: ""
      });
    }
  }, [session, selectedCategory, selectedSeason]);

  // Reset form when modal opens for new session
  useEffect(() => {
    if (isOpen && !session) {
      setSessionFormData({
        title: "",
        description: "",
        session_date: "",
        session_time: "",
        category: selectedCategory,
        season_id: selectedSeason,
        location: ""
      });
    }
  }, [isOpen, session, selectedCategory, selectedSeason]);

  const handleSubmit = () => {
    onSubmit(sessionFormData);
  };

  const handleClose = () => {
    // Reset form when closing
    setSessionFormData({
      title: "",
      description: "",
      session_date: "",
      session_time: "",
      category: selectedCategory,
      season_id: selectedSeason,
      location: ""
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader>
          {session ? "Upravit trénink" : "Nový trénink"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Název tréninku"
              placeholder="Zadejte název tréninku"
              value={sessionFormData.title}
              onChange={(e) =>
                setSessionFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              isRequired
            />

            <Textarea
              label="Popis"
              placeholder="Zadejte popis tréninku"
              value={sessionFormData.description}
              onChange={(e) =>
                setSessionFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Datum"
                type="date"
                value={sessionFormData.session_date}
                onChange={(e) =>
                  setSessionFormData((prev) => ({
                    ...prev,
                    session_date: e.target.value,
                  }))
                }
                isRequired
              />

              <Input
                label="Čas"
                type="time"
                value={sessionFormData.session_time}
                onChange={(e) =>
                  setSessionFormData((prev) => ({
                    ...prev,
                    session_time: e.target.value,
                  }))
                }
              />
            </div>

            <Input
              label="Místo"
              placeholder="Zadejte místo konání"
              value={sessionFormData.location}
              onChange={(e) =>
                setSessionFormData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Zrušit
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!sessionFormData.title || !sessionFormData.session_date}
          >
            {session ? "Uložit změny" : "Vytvořit trénink"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
