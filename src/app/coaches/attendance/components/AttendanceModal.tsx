import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersLoading: boolean;
  filteredMembers: any[];
  attendanceRecords: any[];
  onRecordAttendance: (
    memberId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => Promise<void>;
  getStatusColor: (status: string) => 'success' | 'danger' | 'warning' | 'default';
  getStatusText: (status: string) => string;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  membersLoading,
  filteredMembers,
  attendanceRecords,
  onRecordAttendance,
  getStatusColor,
  getStatusText,
}: AttendanceModalProps) {
  const [isUpdating, setIsUpdating] = React.useState<{[key: string]: boolean}>({});
  const modalBodyRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionRef = React.useRef<number>(0);

  // Preserve scroll position during updates
  React.useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const handleScroll = () => {
    if (modalBodyRef.current) {
      scrollPositionRef.current = modalBodyRef.current.scrollTop;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        body: 'max-h-[80vh] overflow-y-auto',
      }}
    >
      <ModalContent>
        <ModalHeader>Zaznamenat docházku {filteredMembers.length} členů</ModalHeader>
        <ModalBody>
          <div ref={modalBodyRef} onScroll={handleScroll} className="h-full overflow-y-auto">
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Žádní členové nejsou k dispozici pro vybranou kategorii
                </p>
              </div>
            ) : (
              <Table aria-label="Members attendance">
                <TableHeader>
                  <TableColumn>ČLEN</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>AKCE</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const existingRecord = attendanceRecords.find((r) => r.member.id === member.id);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {member.surname} {member.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.registration_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {existingRecord && (
                            <Chip
                              color={getStatusColor(existingRecord.attendance_status)}
                              size="sm"
                            >
                              {getStatusText(existingRecord.attendance_status)}
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(['present', 'absent', 'late', 'excused'] as const).map((status) => {
                              const isCurrentStatus = existingRecord?.attendance_status === status;
                              return (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={isCurrentStatus ? 'solid' : 'light'}
                                  color={getStatusColor(status)}
                                  onPress={async () => {
                                    const updateKey = `${member.id}-${status}`;
                                    if (isUpdating[updateKey]) return;

                                    setIsUpdating((prev) => ({...prev, [updateKey]: true}));
                                    try {
                                      await onRecordAttendance(member.id, status);
                                    } finally {
                                      setIsUpdating((prev) => ({...prev, [updateKey]: false}));
                                    }
                                  }}
                                  className={isCurrentStatus ? 'font-bold' : ''}
                                  type="button"
                                  isLoading={isUpdating[`${member.id}-${status}`]}
                                  isDisabled={isUpdating[`${member.id}-${status}`]}
                                >
                                  {getStatusText(status)}
                                </Button>
                              );
                            })}
                          </div>
                          {existingRecord && (
                            <div className="text-xs text-gray-500 mt-1">
                              Aktuální: {getStatusText(existingRecord.attendance_status)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
