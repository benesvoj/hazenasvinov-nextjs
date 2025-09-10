"use client";

import React from "react";
import { MeetingMinutes } from "@/types";
import {
  CalendarIcon,
  UserIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Chip, User } from "@heroui/react";
import { translations } from "@/lib/translations";
import { Heading } from "@/components";
import { formatDateString } from "@/helpers";
interface MeetingMinutesCardProps {
  meeting: MeetingMinutes;
  onEdit: (meeting: MeetingMinutes) => void;
  onDelete: (meeting: MeetingMinutes) => void;
  onEditAttendees: (meeting: MeetingMinutes) => void;
}

export function MeetingMinutesCard({
  meeting,
  onEdit,
  onDelete,
  onEditAttendees,
}: MeetingMinutesCardProps) {
  const t = translations.components.meetingMinutes;

  const getStatusColor = (status: string) => {
    return status === "present" ? "success" : "warning";
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct link
      window.open(url, '_blank');
    }
  };

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div> 
            <Heading size={3}>
              {t.meetingNumber} #{meeting.meeting_number}
            </Heading>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {formatDateString(meeting.meeting_date)}
              </div>
              {meeting.meeting_place && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  {meeting.meeting_place}
                </div>
              )}
              {meeting.season && (
                <Chip size="sm" variant="flat" color="primary">
                  {meeting.season.name}
                </Chip>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={() => onEdit(meeting)}
              aria-label={t.editMeetingMinutes}
              isIconOnly
            />
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              startContent={<UserIcon className="w-4 h-4" />}
              onPress={() => onEditAttendees(meeting)}
              aria-label={t.manageAttendees}
            />
            <Button
              size="sm"
              color="danger"
              variant="flat"
              isIconOnly
              startContent={<TrashIcon className="w-4 h-4" />}
              onPress={() => onDelete(meeting)}
              aria-label={t.deleteMeetingMinutes}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Heading size={4}>
              {t.meetingDetails}
            </Heading>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span>
                  {t.wroteBy}:{" "}
                  {meeting.wrote_by_user?.user_metadata?.full_name ||
                    meeting.wrote_by_user?.email}
                </span>
              </div>
              {meeting.attachment_url && (
                <div className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {meeting.attachment_filename || t.attachment}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      onPress={() => handleView(meeting.attachment_url!)}
                      aria-label="Zobrazit soubor"
                      className="min-w-6 h-6"
                      startContent={<EyeIcon className="w-3 h-3" />}
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      onPress={() => handleDownload(meeting.attachment_url!, meeting.attachment_filename || 'attachment')}
                      aria-label="Stáhnout soubor"
                      className="min-w-6 h-6"
                      startContent={<ArrowDownTrayIcon className="w-3 h-3" />}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Heading size={4}>
              {t.attendanceList}
            </Heading>
            {meeting.attendees && meeting.attendees.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {meeting.attendees.map((attendee) => (
                      <User
                        key={attendee.id}
                        name={
                          attendee.member
                            ? `${attendee.member.name} ${attendee.member.surname}`
                            : t.unknownMember
                        }
                        description={attendee.member?.registration_number}
                        className={`p-2 border rounded-lg border-${getStatusColor(
                          attendee.status
                        )}`}
                        classNames={{
                          base: "justify-start",
                          wrapper: "justify-start",
                          name: "text-left",
                          description: "text-left"
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t text-xs text-gray-500">
                  {t.totalAttendees}: {meeting.attendees.length} |
                  {t.presentCount}:{" "}
                  {
                    meeting.attendees.filter((a) => a.status === "present")
                      .length
                  }{" "}
                  |{t.excusedCount}:{" "}
                  {
                    meeting.attendees.filter((a) => a.status === "excused")
                      .length
                  }
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t.noAttendees}</p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
