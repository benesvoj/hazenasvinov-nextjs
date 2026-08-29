import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {AttendanceStatuses, TrainingSessionStatusEnum} from '@/enums';
import {AttendanceRecordingPanel} from '@/features/coach/attendance/components/AttendanceRecordingPanel';
import {BaseTrainingSession, MemberAttendanceWithMember} from '@/types';

const SESSION_ID = 'session-1';

const session = {
  id: SESSION_ID,
  title: 'Trénink',
  session_date: '2026-08-20',
  category_id: 'category-1',
  season_id: 'season-1',
  status: TrainingSessionStatusEnum.DONE,
} as unknown as BaseTrainingSession;

const record = (
  memberId: string,
  name: string,
  surname: string,
  isActive: boolean
): MemberAttendanceWithMember =>
  ({
    id: `attendance-${memberId}`,
    member_id: memberId,
    training_session_id: SESSION_ID,
    attendance_status: AttendanceStatuses.PRESENT,
    notes: null,
    member: {id: memberId, name, surname, category_id: 'category-1', is_active: isActive},
  }) as unknown as MemberAttendanceWithMember;

function renderPanel(records: MemberAttendanceWithMember[]) {
  return render(
    <AttendanceRecordingPanel
      attendanceRecords={records}
      selectedSession={SESSION_ID}
      selectedSessionData={session}
      loading={false}
      memberHistory={[]}
      onRecordAttendance={vi.fn().mockResolvedValue(undefined)}
      onBulkUpdate={vi.fn().mockResolvedValue(undefined)}
    />
  );
}

describe('AttendanceRecordingPanel', () => {
  it('shows a deactivated member whose attendance record already exists', () => {
    renderPanel([
      record('active-member', 'Jan', 'Novák', true),
      record('deactivated-member', 'Petr', 'Svoboda', false),
    ]);

    expect(screen.getByText('Novák Jan')).toBeInTheDocument();
    // The premise: the record exists, so it stays visible and editable.
    expect(screen.getByText('Svoboda Petr')).toBeInTheDocument();
  });

  it('counts a deactivated member with a record into the session summary', () => {
    renderPanel([
      record('active-member', 'Jan', 'Novák', true),
      record('deactivated-member', 'Petr', 'Svoboda', false),
    ]);

    expect(screen.getByText('Vše (2)')).toBeInTheDocument();
  });

  it('renders only what the records carry — it never adds members of its own', () => {
    renderPanel([record('active-member', 'Jan', 'Novák', true)]);

    expect(screen.getByText('Novák Jan')).toBeInTheDocument();
    expect(screen.queryByText('Svoboda Petr')).not.toBeInTheDocument();
  });
});
