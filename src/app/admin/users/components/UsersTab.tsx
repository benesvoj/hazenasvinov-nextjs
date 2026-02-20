'use client';

import React from 'react';

import {Avatar, Card, CardBody, Chip} from '@heroui/react';

import {EnvelopeIcon, UserIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {LoadingSpinner, UnifiedTable} from '@/components';
import {ActionTypes} from '@/enums';
import {formatDateString, formatTimeString} from '@/helpers';
import {SupabaseUser} from '@/types';

interface UsersTabProps {
  users: SupabaseUser[];
  loading: boolean;
  onEdit: (user: SupabaseUser) => void;
  onResetPassword: (user: SupabaseUser) => void;
  onToggleBlock: (user: SupabaseUser) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  onEdit,
  onResetPassword,
  onToggleBlock,
}) => {
  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <LoadingSpinner />
        </CardBody>
      </Card>
    );
  }

  const columns = [
    {key: 'user', label: translations.admin.users.table.columns.user},
    {key: 'contact', label: translations.admin.users.table.columns.contact},
    {key: 'status', label: translations.admin.users.table.columns.status},
    {key: 'createdAt', label: translations.admin.users.table.columns.createdAt},
    {
      key: 'actions',
      label: translations.common.table.columns.actions,
      isActionColumn: true,
      actions: (user: SupabaseUser) => [
        {
          type: ActionTypes.UPDATE,
          onPress: onEdit,
          title: translations.common.table.actions.update,
        },
        {
          type: ActionTypes.PASSWORD_RESET,
          onPress: onResetPassword,
          title: translations.admin.users.table.actions.passwordReset,
        },
        {
          type: user.user_metadata?.is_blocked ? ActionTypes.UNBLOCK : ActionTypes.BLOCKED,
          onPress: onToggleBlock,
          title: user.user_metadata?.is_blocked
            ? translations.admin.users.table.actions.unblock
            : translations.admin.users.table.actions.blocked,
        },
      ],
    },
  ];

  const renderCells = (user: SupabaseUser, columnKey: string) => {
    switch (columnKey) {
      case 'user':
        return (
          <div className="flex items-center gap-3">
            <Avatar
              name={user.user_metadata?.full_name || user.email}
              className="w-10 h-10 text-sm"
              color={user.user_metadata?.is_blocked ? 'danger' : 'primary'}
            />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {user.user_metadata?.full_name || 'Bez jména'}
              </span>
              <span className="text-xs text-foreground-500">
                {user.user_metadata?.position || 'Bez pozice'}
              </span>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-foreground-400" />
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
            {user.user_metadata?.phone && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-foreground-400" />
                <span className="text-sm text-foreground-600">{user.user_metadata.phone}</span>
              </div>
            )}
          </div>
        );
      case 'status':
        return getUserStatusBadge(user);
      case 'createdAt':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {formatDateString(user.created_at)}
            </span>
            <span className="text-xs text-foreground-500">{formatTimeString(user.created_at)}</span>
          </div>
        );
    }
  };

  return (
    <>
      <UnifiedTable
        columns={columns}
        data={users}
        ariaLabel={translations.admin.users.table.ariaLabel}
        renderCell={renderCells}
        getKey={(user: SupabaseUser) => user.id}
        isStriped
      />
      {/*	<Table aria-label="Users table" selectionMode="none">*/}
      {/*		<TableHeader>*/}
      {/*			<TableColumn>UŽIVATEL</TableColumn>*/}
      {/*			<TableColumn>KONTAKT</TableColumn>*/}
      {/*			<TableColumn>STAV</TableColumn>*/}
      {/*			<TableColumn>VYTVOŘENO</TableColumn>*/}
      {/*			<TableColumn>AKCE</TableColumn>*/}
      {/*		</TableHeader>*/}
      {/*		<TableBody emptyContent={'Žádní uživatelé k zobrazení.'}>*/}
      {/*			{users.map((user) => (*/}
      {/*				<TableRow key={user.id}>*/}
      {/*					<TableCell>*/}
      {/*						<div className="flex items-center gap-3">*/}
      {/*							<Avatar*/}
      {/*								name={user.user_metadata?.full_name || user.email}*/}
      {/*								className="w-10 h-10 text-sm"*/}
      {/*								color={user.user_metadata?.is_blocked ? 'danger' : 'primary'}*/}
      {/*							/>*/}
      {/*							<div className="flex flex-col">*/}
      {/*  <span className="font-medium text-foreground">*/}
      {/*    {user.user_metadata?.full_name || 'Bez jména'}*/}
      {/*  </span>*/}
      {/*								<span className="text-xs text-foreground-500">*/}
      {/*    {user.user_metadata?.position || 'Bez pozice'}*/}
      {/*  </span>*/}
      {/*							</div>*/}
      {/*						</div>*/}
      {/*					</TableCell>*/}
      {/*					<TableCell>*/}
      {/*						<div className="flex flex-col gap-1">*/}
      {/*							<div className="flex items-center gap-2">*/}
      {/*								<EnvelopeIcon className="w-4 h-4 text-foreground-400"/>*/}
      {/*								<span className="text-sm text-foreground">{user.email}</span>*/}
      {/*							</div>*/}
      {/*							{user.user_metadata?.phone && (*/}
      {/*								<div className="flex items-center gap-2">*/}
      {/*									<UserIcon className="w-4 h-4 text-foreground-400"/>*/}
      {/*									<span className="text-sm text-foreground-600">*/}
      {/*      {user.user_metadata.phone}*/}
      {/*    </span>*/}
      {/*								</div>*/}
      {/*							)}*/}
      {/*						</div>*/}
      {/*					</TableCell>*/}
      {/*					<TableCell>{getUserStatusBadge(user)}</TableCell>*/}
      {/*					<TableCell>*/}
      {/*						<div className="flex flex-col">*/}
      {/*<span className="text-sm font-medium text-foreground">*/}
      {/*  {new Date(user.created_at).toLocaleDateString('cs-CZ')}*/}
      {/*</span>*/}
      {/*							<span className="text-xs text-foreground-500">*/}
      {/*  {new Date(user.created_at).toLocaleTimeString('cs-CZ', {*/}
      {/*	  hour: '2-digit',*/}
      {/*	  minute: '2-digit',*/}
      {/*  })}*/}
      {/*</span>*/}
      {/*						</div>*/}
      {/*					</TableCell>*/}
      {/*					<TableCell>*/}
      {/*						<Dropdown>*/}
      {/*							<DropdownTrigger>*/}
      {/*								<Button isIconOnly size="sm" variant="light">*/}
      {/*									<EllipsisVerticalIcon className="w-4 h-4"/>*/}
      {/*								</Button>*/}
      {/*							</DropdownTrigger>*/}
      {/*							<DropdownMenu aria-label="User actions">*/}
      {/*								<DropdownItem*/}
      {/*									key="edit"*/}
      {/*									startContent={<PencilIcon className="w-4 h-4"/>}*/}
      {/*									onPress={() => handleEditUser(user)}*/}
      {/*								>*/}
      {/*									Upravit*/}
      {/*								</DropdownItem>*/}
      {/*								<DropdownItem*/}
      {/*									key="password"*/}
      {/*									startContent={<KeyIcon className="w-4 h-4"/>}*/}
      {/*									onPress={() => {*/}
      {/*										setPasswordResetEmail(user.email || '');*/}
      {/*										modal.passwordReset.onOpen();*/}
      {/*									}}*/}
      {/*								>*/}
      {/*									Obnovit heslo*/}
      {/*								</DropdownItem>*/}
      {/*								<DropdownItem*/}
      {/*									key="toggle"*/}
      {/*									startContent={*/}
      {/*										user.user_metadata?.is_blocked ? (*/}
      {/*											<LockOpenIcon className="w-4 h-4"/>*/}
      {/*										) : (*/}
      {/*											<LockClosedIcon className="w-4 h-4"/>*/}
      {/*										)*/}
      {/*									}*/}
      {/*									color={user.user_metadata?.is_blocked ? 'success' : 'danger'}*/}
      {/*									onPress={() => handleToggleUserStatus(user)}*/}
      {/*								>*/}
      {/*									{user.user_metadata?.is_blocked ? 'Odblokovat' : 'Blokovat'}*/}
      {/*								</DropdownItem>*/}
      {/*							</DropdownMenu>*/}
      {/*						</Dropdown>*/}
      {/*					</TableCell>*/}
      {/*				</TableRow>*/}
      {/*			))}*/}
      {/*		</TableBody>*/}
      {/*	</Table>*/}
    </>
  );
};

// Get user status badge
const getUserStatusBadge = (user: SupabaseUser) => {
  const isBlocked = user.user_metadata?.is_blocked;
  const isConfirmed = user.email_confirmed_at;

  if (isBlocked) {
    return (
      <Chip color="danger" variant="flat" size="sm">
        {translations.admin.users.chips.blocked}
      </Chip>
    );
  }

  if (!isConfirmed) {
    return (
      <Chip color="warning" variant="flat" size="sm">
        {translations.admin.users.chips.unconfirmed}
      </Chip>
    );
  }

  return (
    <Chip color="success" variant="flat" size="sm">
      {translations.admin.users.chips.active}
    </Chip>
  );
};
