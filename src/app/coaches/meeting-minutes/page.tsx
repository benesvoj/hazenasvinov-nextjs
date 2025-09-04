"use client";

import React from "react";
import { useMeetingMinutes } from "@/hooks/useMeetingMinutes";
import { useSeasons } from "@/hooks/useSeasons";
import { MeetingMinutes, MeetingMinutesFilters } from "@/types";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Chip,
  Badge,
  Skeleton,
} from "@heroui/react";
import { translations } from "@/lib/translations";
import { MeetingMinutesContainer } from "@/components";

export default function CoachMeetingMinutesPage() {
  const t = translations.components.meetingMinutes;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.description}</p>
      </div>

      <MeetingMinutesContainer />
    </div>
  );
}

