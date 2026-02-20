'use client';

import {Button, Select, SelectItem} from '@heroui/react';

import {
  ArrowLeftStartOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {LoginLog, PaginationInfo} from '@/hooks/entities/user/data/useFetchUsers';
import {useModal} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {LoadingSpinner, UnifiedModal, UnifiedTable} from '@/components';
import {formatDateString, formatTimeString} from '@/helpers';
import {SupabaseUser} from '@/types';

interface LoginLogsTabProps {
  loginLogs: LoginLog[];
  loading: boolean;
  users: SupabaseUser[];
  pagination: PaginationInfo;
  selectedUser?: string;
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
  const totalPages =
    pagination?.total && pagination.total > 0
      ? Math.ceil(pagination.total / 25) // Using default page size of 25
      : 1;

  if (loading) {
    return <LoadingSpinner label={translations.admin.loginLogs.loading} />;
  }

  const columns = [
    {key: 'user', label: translations.admin.loginLogs.table.columns.user},
    {key: 'action', label: translations.admin.loginLogs.table.columns.action},
    {key: 'time', label: translations.admin.loginLogs.table.columns.loginTime},
    {key: 'userAgent', label: translations.admin.loginLogs.table.columns.userAgent},
    {key: 'status', label: translations.admin.loginLogs.table.columns.status},
  ];

  const renderCells = (log: LoginLog, columnKey: string) => {
    switch (columnKey) {
      case 'user':
        return <span className="font-medium text-gray-900">{log.email}</span>;
      case 'action':
        return (
          <div className="flex items-center gap-2">
            {getActionIcon(log.action || 'login')}
            <span className="text-sm font-medium text-gray-700">
              {getActionText(log.action || 'login')}
            </span>
          </div>
        );
      case 'time':
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{formatDateString(log.login_time)}</span>
            <span className="text-xs text-gray-500">{formatTimeString(log.login_time)}</span>
          </div>
        );
      case 'userAgent':
        return (
          <div className="truncate" title={log.user_agent}>
            {truncateUserAgent(log.user_agent)}
          </div>
        );
      case 'status':
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(log.status)}
            <span className="text-sm font-medium text-gray-700">{getStatusText(log.status)}</span>
          </div>
        );
    }
  };

  return (
    <>
      <UnifiedTable
        columns={columns}
        data={loginLogs}
        ariaLabel={translations.admin.loginLogs.table.ariaLabel}
        renderCell={renderCells}
        isStriped
        emptyContent={translations.admin.loginLogs.table.noRecords}
        enablePagination={!!pagination}
        page={pagination?.page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
      return <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-blue-600" />;
    case 'logout':
      return <ArrowLeftStartOnRectangleIcon className="w-4 h-4 text-gray-600" />;
    default:
      return <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-gray-400" />;
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
