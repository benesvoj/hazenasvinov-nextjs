'use client';

import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Button, Checkbox, Input, Progress, Tooltip} from '@heroui/react';

import {
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {ContentCard, HStack} from '@/components';
import {AttendanceStatuses} from '@/enums';
import {BaseTrainingSession, MemberAttendanceWithMember, MemberSchema} from '@/types';

import {getStatusColor} from '../helpers';

const t = translations.attendance;

type FilterType = 'all' | AttendanceStatuses;

export interface MemberHistoryEntry {
  memberId: string;
  sessions: Array<{
    sessionId: string;
    sessionDate: string;
    status: 'present' | 'absent' | 'late' | 'excused' | null;
  }>;
}

/** Narrows the MemberAttendanceWithMember type to have a guaranteed member. */
interface AttendanceWithMember extends MemberAttendanceWithMember {
  member: MemberSchema;
}

interface StatusButtonConfig {
  status: AttendanceStatuses;
  label: string;
  icon: ReactNode;
  activeClass: string;
  filterActiveClass: string;
}

const STATUS_BUTTONS: StatusButtonConfig[] = [
  {
    status: AttendanceStatuses.PRESENT,
    label: translations.attendance.enums.statuses.present,
    icon: <CheckIcon className="w-3.5 h-3.5" />,
    activeClass:
      'bg-success-100 text-success-700 border-success-400 dark:bg-success-900/30 dark:text-success-400',
    filterActiveClass: 'bg-success text-white',
  },
  {
    status: AttendanceStatuses.ABSENT,
    label: translations.attendance.enums.statuses.absent,
    icon: <XMarkIcon className="w-3.5 h-3.5" />,
    activeClass:
      'bg-danger-100 text-danger-700 border-danger-400 dark:bg-danger-900/30 dark:text-danger-400',
    filterActiveClass: 'bg-danger text-white',
  },
  {
    status: AttendanceStatuses.EXCUSED,
    label: translations.attendance.enums.statuses.excused,
    icon: <EnvelopeIcon className="w-3.5 h-3.5" />,
    activeClass:
      'bg-primary-100 text-primary-700 border-primary-400 dark:bg-primary-900/30 dark:text-primary-400',
    filterActiveClass: 'bg-primary text-white',
  },
  {
    status: AttendanceStatuses.LATE,
    label: translations.attendance.enums.statuses.late,
    icon: <ClockIcon className="w-3.5 h-3.5" />,
    activeClass:
      'bg-warning-100 text-warning-700 border-warning-400 dark:bg-warning-900/30 dark:text-warning-400',
    filterActiveClass: 'bg-warning text-white',
  },
];

const STATUS_DOT_CLASS: Record<AttendanceStatuses, string> = {
  [AttendanceStatuses.PRESENT]: 'bg-success-500',
  [AttendanceStatuses.ABSENT]: 'bg-danger-500',
  [AttendanceStatuses.EXCUSED]: 'bg-primary-500',
  [AttendanceStatuses.LATE]: 'bg-warning-500',
};

const AVATAR_BG_CLASS: Record<AttendanceStatuses, string> = {
  [AttendanceStatuses.PRESENT]:
    'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400',
  [AttendanceStatuses.ABSENT]:
    'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-400',
  [AttendanceStatuses.EXCUSED]:
    'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400',
  [AttendanceStatuses.LATE]:
    'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-400',
};

function getInitials(name: string, surname: string): string {
  return `${(name?.[0] ?? '').toUpperCase()}${(surname?.[0] ?? '').toUpperCase()}`;
}

function statusCount(records: AttendanceWithMember[], status: AttendanceStatuses): number {
  return records.filter((r) => r.attendance_status === status).length;
}

interface AttendanceRecordingPanelProps {
  attendanceRecords: MemberAttendanceWithMember[];
  selectedSession: string | null;
  selectedSessionData: BaseTrainingSession | null;
  loading: boolean;
  memberHistory: MemberHistoryEntry[];
  onRecordAttendance: (
    memberId: string,
    status: AttendanceStatuses,
    notes?: string
  ) => Promise<void>;
  onBulkUpdate: (memberIds: string[], status: AttendanceStatuses) => Promise<void>;
}

export function AttendanceRecordingPanel({
  attendanceRecords,
  selectedSession,
  selectedSessionData,
  loading,
  memberHistory,
  onRecordAttendance,
  onBulkUpdate,
}: AttendanceRecordingPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, AttendanceStatuses>>({});
  const noteDebounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setSelectedMembers(new Set());
    setActiveFilter('all');
    setSearchTerm('');

    return () => {
      Object.values(noteDebounceTimers.current).forEach(clearTimeout);
      noteDebounceTimers.current = {};
    };
  }, [selectedSession]);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const r of attendanceRecords) {
      if (r.member?.id) initial[r.member.id] = r.notes ?? '';
    }
    setNotes(initial);
  }, [attendanceRecords]);

  const historyByMember = useMemo(() => {
    const map = new Map<string, MemberHistoryEntry['sessions']>();
    for (const entry of Array.isArray(memberHistory) ? memberHistory : []) {
      map.set(entry.memberId, entry.sessions);
    }
    return map;
  }, [memberHistory]);

  const validRecords = useMemo<AttendanceWithMember[]>(() => {
    return (attendanceRecords.filter((r) => r.member != null) as AttendanceWithMember[]).sort(
      (a, b) => {
        const sc = (a.member.surname ?? '').localeCompare(b.member.surname ?? '', 'cs');
        return sc !== 0 ? sc : (a.member.name ?? '').localeCompare(b.member.name ?? '', 'cs');
      }
    );
  }, [attendanceRecords]);

  const filteredRecords = useMemo<AttendanceWithMember[]>(() => {
    let list = validRecords;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const fullName = `${r.member.name} ${r.member.surname}`.toLowerCase();
        return fullName.includes(q);
      });
    }
    if (activeFilter !== 'all') {
      list = list.filter((r) => r.attendance_status === activeFilter);
    }
    return list;
  }, [validRecords, searchTerm, activeFilter]);

  const allVisibleIds = useMemo(() => filteredRecords.map((r) => r.member.id), [filteredRecords]);

  const allSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedMembers.has(id));
  const someSelected = selectedMembers.size > 0;

  const toggleSelectAll = useCallback(() => {
    setSelectedMembers((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...allVisibleIds]);
    });
  }, [allSelected, allVisibleIds]);

  const toggleSelectMember = useCallback((memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (memberId: string, status: AttendanceStatuses) => {
      setPendingStatus((p) => ({...p, [memberId]: status}));
      try {
        await onRecordAttendance(memberId, status, notes[memberId]);
      } finally {
        setPendingStatus((p) => {
          const next = {...p};
          delete next[memberId];
          return next;
        });
      }
    },
    [onRecordAttendance, notes]
  );

  const handleNoteChange = useCallback(
    (memberId: string, value: string) => {
      setNotes((prev) => ({...prev, [memberId]: value}));
      if (noteDebounceTimers.current[memberId]) {
        clearTimeout(noteDebounceTimers.current[memberId]);
      }
      const record = validRecords.find((r) => r.member.id === memberId);
      if (record) {
        noteDebounceTimers.current[memberId] = setTimeout(() => {
          void onRecordAttendance(memberId, record.attendance_status as AttendanceStatuses, value);
        }, 800);
      }
    },
    [validRecords, onRecordAttendance]
  );

  const handleBulkStatusChange = useCallback(
    async (status: AttendanceStatuses) => {
      const ids = Array.from(selectedMembers);
      await onBulkUpdate(ids, status);
      setSelectedMembers(new Set());
    },
    [selectedMembers, onBulkUpdate]
  );

  const handleMarkAllPresent = useCallback(async () => {
    if (!window.confirm(t.labels.markAllPresentConfirm)) return;
    const ids = validRecords.map((r) => r.member.id);
    await onBulkUpdate(ids, AttendanceStatuses.PRESENT);
  }, [validRecords, onBulkUpdate]);

  if (!selectedSession || !selectedSessionData) {
    return (
      <ContentCard isLoading={loading}>
        <div className="flex items-center justify-center h-64 text-foreground-400">
          <div className="text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">{t.labels.selectSessionPrompt}</p>
          </div>
        </div>
      </ContentCard>
    );
  }

  const memberCount = validRecords.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar + Table */}
      <ContentCard padding="none" isLoading={loading}>
        <div className="p-3 flex flex-col gap-3">
          {/* Search + Mark all */}
          <div className="flex items-center gap-2">
            <Input
              placeholder={t.labels.searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-foreground-400" />}
              size="sm"
              className="flex-1"
              isClearable
              onClear={() => setSearchTerm('')}
            />
            <Button
              size="sm"
              variant="flat"
              color="success"
              onPress={handleMarkAllPresent}
              isDisabled={validRecords.length === 0}
            >
              {t.labels.markAllPresent}
            </Button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeFilter === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-default-100 text-foreground-600 border-transparent hover:border-foreground-300'
              }`}
            >
              {t.labels.filterAll} ({validRecords.length})
            </button>
            {STATUS_BUTTONS.map(({status, label, filterActiveClass}) => {
              const count = statusCount(validRecords, status);
              const isActive = activeFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveFilter(isActive ? 'all' : status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    isActive
                      ? `${filterActiveClass} border-transparent`
                      : 'bg-default-100 text-foreground-600 border-transparent hover:border-foreground-300'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-2 flex-wrap">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300 mr-1">
                {t.labels.selectedCount(selectedMembers.size)}
              </span>
              {STATUS_BUTTONS.map(({status, label, icon}) => (
                <Button
                  key={status}
                  size="sm"
                  variant="flat"
                  color={getStatusColor(status)}
                  startContent={icon}
                  onPress={() => handleBulkStatusChange(status)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Members table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    isSelected={allSelected}
                    isIndeterminate={someSelected && !allSelected}
                    onValueChange={toggleSelectAll}
                    aria-label="Vybrat vše"
                    size="sm"
                  />
                </th>
                <th className="text-left px-3 py-2 font-medium text-foreground-600">
                  {t.table.columns.memberName}
                </th>
                <th className="text-left px-3 py-2 font-medium text-foreground-600 hidden lg:table-cell">
                  {t.labels.historyLabel}
                </th>
                <th className="text-left px-3 py-2 font-medium text-foreground-600">
                  {t.table.columns.status}
                </th>
                <th className="text-left px-3 py-2 font-medium text-foreground-600 hidden xl:table-cell w-36">
                  Poznámka
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-foreground-400 text-sm">
                    {searchTerm || activeFilter !== 'all'
                      ? 'Žádní členové nevyhovují filtru'
                      : t.responseMessages.selectSessionToShowAttendance}
                  </td>
                </tr>
              )}
              {filteredRecords.map((record) => {
                const memberId = record.member.id;
                const currentStatus = (pendingStatus[memberId] ??
                  record.attendance_status) as AttendanceStatuses;
                const isSelected = selectedMembers.has(memberId);
                const history = historyByMember.get(memberId) ?? [];
                const presentCount = history.filter((h) => h.status === 'present').length;
                const historyPct =
                  history.length > 0 ? Math.round((presentCount / history.length) * 100) : 0;
                const avatarClass =
                  AVATAR_BG_CLASS[currentStatus] ?? 'bg-default-100 text-foreground-600';

                return (
                  <tr
                    key={record.id}
                    className={`border-b border-divider transition-colors ${
                      isSelected
                        ? 'bg-primary-50/50 dark:bg-primary-900/10'
                        : 'hover:bg-default-50 dark:hover:bg-default-100/5'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <Checkbox
                        isSelected={isSelected}
                        onValueChange={() => toggleSelectMember(memberId)}
                        aria-label={`Vybrat ${record.member.name} ${record.member.surname}`}
                        size="sm"
                      />
                    </td>

                    {/* Avatar + Name */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarClass}`}
                        >
                          {getInitials(record.member.name ?? '', record.member.surname ?? '')}
                        </div>
                        <span className="font-medium">
                          {record.member.surname} {record.member.name}
                        </span>
                      </div>
                    </td>

                    {/* History dots */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {history.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-0.5">
                            {history.map((h, idx) => (
                              <Tooltip
                                key={idx}
                                content={
                                  h.status
                                    ? (t.enums.statuses[
                                        h.status as keyof typeof t.enums.statuses
                                      ] ?? h.status)
                                    : 'Bez záznamu'
                                }
                              >
                                <div
                                  className={`w-3 h-3 rounded-full cursor-default ${
                                    h.status && h.status in STATUS_DOT_CLASS
                                      ? STATUS_DOT_CLASS[h.status as AttendanceStatuses]
                                      : 'bg-default-200'
                                  }`}
                                />
                              </Tooltip>
                            ))}
                          </div>
                          <Progress
                            value={historyPct}
                            size="sm"
                            color="success"
                            className="max-w-[60px]"
                            aria-label={`${historyPct}% přítomen`}
                          />
                        </div>
                      ) : (
                        <span className="text-foreground-300 text-xs">–</span>
                      )}
                    </td>

                    {/* Status buttons */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {STATUS_BUTTONS.map(({status, label, icon, activeClass}) => {
                          const isActive = currentStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(memberId, status)}
                              title={label}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                                isActive
                                  ? activeClass
                                  : 'bg-default-50 text-foreground-500 border-default-200 hover:border-default-400'
                              }`}
                            >
                              {icon}
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Note */}
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      <Input
                        value={notes[memberId] ?? ''}
                        onValueChange={(v) => handleNoteChange(memberId, v)}
                        placeholder={t.labels.notePlaceholder}
                        size="sm"
                        className="w-36"
                        variant="flat"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-content1 rounded-xl border border-divider flex-wrap">
        {STATUS_BUTTONS.map(({status, label}) => {
          const count = statusCount(validRecords, status);
          return (
            <HStack key={status} spacing={1}>
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT_CLASS[status]}`}
              />
              <span className="text-xs text-foreground-600">
                {label}: <strong>{count}</strong>
              </span>
            </HStack>
          );
        })}
        <div className="ml-auto text-xs text-foreground-500 font-medium">
          {t.labels.summaryTotal(memberCount)}
        </div>
      </div>
    </div>
  );
}
