"use client";

import React from "react";
import { MeetingMinutes } from "@/types";
import {
  CalendarIcon,
  UserIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Chip, User } from "@heroui/react";
import { translations } from "@/lib/translations";

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("cs-CZ");
  };

  const getStatusColor = (status: string) => {
    return status === "present" ? "success" : "warning";
  };

  const getStatusText = (status: string) => {
    return status === "present" ? t.present : t.excused;
  };

  return (
    <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t.meetingNumber} #{meeting.meeting_number}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(meeting.meeting_date)}
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
            <h4 className="font-medium text-gray-900 mb-2">
              {t.meetingDetails}
            </h4>
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
                  <a
                    href={meeting.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {meeting.attachment_filename || t.attachment}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t.attendanceList}
            </h4>
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
