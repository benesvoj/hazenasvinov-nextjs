'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react';

import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {LoginLog, PaginationInfo} from '@/hooks/entities/user/useFetchUsers';
import {useModal} from '@/hooks/shared/useModals';

import {isEmpty} from '@/utils/arrayHelper';

import {translations} from '@/lib';
import {SupabaseUser} from '@/types';

interface LoginLogsTabProps {
  loginLogs: LoginLog[];
  loading: boolean;
  users: SupabaseUser[];
  pagination: PaginationInfo;
  selectedUser: string;
  onPageChange: (page: number) => void;
  onUserFilterChange: (userEmail: string) => void;
  onClearFilters: () => void;
}

export const LoginLogsTab: React.FC<LoginLogsTabProps> = ({
  loginLogs,
  loading,
  users,
  pagination,
  selectedUser,
  onPageChange,
  onUserFilterChange,
  onClearFilters,
}) => {
  const modal = useModal();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <ArrowRightOnRectangleIcon className="w-4 h-4 text-blue-600" />;
      case 'logout':
        return <ArrowLeftOnRectangleIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'Přihlášení';
      case 'logout':
        return 'Odhlášení';
      default:
        return action;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'Úspěšné';
      case 'failed':
        return 'Neúspěšné';
      case 'pending':
        return 'Čekající';
      default:
        return status;
    }
  };

  const truncateUserAgent = (userAgent: string) => {
    if (userAgent.length > 50) {
      return userAgent.substring(0, 50) + '...';
    }
    return userAgent;
  };

  const handleClearFilters = () => {
    onClearFilters();
    modal.onClose();
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání historie přihlášení...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-xl font-semibold">{translations.users.loginLogs.title}</h3>
              <p className="text-sm text-gray-600">{translations.users.loginLogs.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Results Summary and Filter Button */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Zobrazeno {loginLogs.length} z {pagination.total} záznamů
              {selectedUser && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Filtrováno podle: {selectedUser}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Filter Button */}
              <Button
                color="primary"
                variant="light"
                size="sm"
                startContent={<FunnelIcon className="w-4 h-4" />}
                onPress={modal.onOpen}
              >
                Filtry
                {selectedUser && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    1 aktivní
                  </span>
                )}
              </Button>

              {/* Pagination Info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Stránka {pagination.page} z {pagination.totalPages}
              </div>
            </div>
          </div>

          {isEmpty(loginLogs) ? (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-2">Žádné záznamy o přihlášení</div>
              <div className="text-sm text-gray-400">
                {selectedUser
                  ? 'Pro vybraného uživatele nebyly nalezeny žádné záznamy.'
                  : 'Historie přihlášení se zobrazí po prvním přihlášení uživatelů'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Login logs table">
                <TableHeader>
                  <TableColumn>Uživatel</TableColumn>
                  <TableColumn>Akce</TableColumn>
                  <TableColumn>Čas</TableColumn>
                  <TableColumn>Prohlížeč</TableColumn>
                  <TableColumn>Stav</TableColumn>
                </TableHeader>
                <TableBody>
                  {loginLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {log.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{log.email}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.login_time).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action || 'login')}
                          <span className="text-sm font-medium text-gray-700">
                            {getActionText(log.action || 'login')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {formatDate(log.login_time)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.login_time).toLocaleTimeString('cs-CZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={log.user_agent}>
                          {truncateUserAgent(log.user_agent)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-sm font-medium text-gray-700">
                            {getStatusText(log.status)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                color="primary"
                variant="bordered"
                size="sm"
                isDisabled={pagination.page <= 1}
                onPress={() => onPageChange(pagination.page - 1)}
                startContent={<ChevronLeftIcon className="w-4 h-4" />}
              >
                Předchozí
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      color={pageNum === pagination.page ? 'primary' : 'default'}
                      variant={pageNum === pagination.page ? 'solid' : 'bordered'}
                      size="sm"
                      onPress={() => onPageChange(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                color="primary"
                variant="bordered"
                size="sm"
                isDisabled={pagination.page >= pagination.totalPages}
                onPress={() => onPageChange(pagination.page + 1)}
                endContent={<ChevronRightIcon className="w-4 h-4" />}
              >
                Další
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Filter Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              Filtry pro historii přihlášení
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrovat podle uživatele
                </label>
                <Select
                  selectedKeys={selectedUser ? [selectedUser] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    onUserFilterChange(selected || '');
                    // Close dialog automatically when filter is applied
                    if (selected !== selectedUser) {
                      modal.onClose();
                    }
                  }}
                  placeholder="Vyberte uživatele"
                  className="w-full"
                  selectionMode="single"
                >
                  <SelectItem key="">Všichni uživatelé</SelectItem>
                  <>
                    {users.map((user) => (
                      <SelectItem key={user.email || ''}>
                        {user.email || 'Neznámý uživatel'}
                      </SelectItem>
                    ))}
                  </>
                </Select>
              </div>

              {selectedUser && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Aktivní filtr: <strong>{selectedUser}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              variant="bordered"
              onPress={handleClearFilters}
              startContent={<XMarkIcon className="w-4 h-4" />}
            >
              Vymazat filtry
            </Button>
            <Button
              color="danger"
              variant="light"
              onPress={() => {
                onClearFilters();
                modal.onClose();
              }}
            >
              Reset
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
