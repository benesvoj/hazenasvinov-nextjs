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
  Chip 
} from "@heroui/react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersLoading: boolean;
  filteredMembers: any[];
  attendanceRecords: any[];
  onRecordAttendance: (memberId: string, status: 'present' | 'absent' | 'late' | 'excused') => void;
  getStatusColor: (status: string) => "success" | "danger" | "warning" | "default";
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
  getStatusText
}: AttendanceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
    >
      <ModalContent>
        <ModalHeader>
          Zaznamenat docházku
        </ModalHeader>
        <ModalBody>
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
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
                  const existingRecord = attendanceRecords.find(r => r.member.id === member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.name} {member.surname}
                          </div>
                          <div className="text-sm text-gray-500">
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
                          {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={existingRecord?.attendance_status === status ? 'solid' : 'light'}
                              color={getStatusColor(status)}
                              onPress={() => onRecordAttendance(member.id, status)}
                            >
                              {getStatusText(status)}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
          >
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}