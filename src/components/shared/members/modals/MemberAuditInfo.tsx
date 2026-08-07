'use client';

import React from 'react';

import {translations} from '@/lib/translations';

import {formatDateTimeFromString} from '@/helpers';
import {MemberAudit} from '@/types';

interface MemberAuditInfoProps {
  audit: MemberAudit | null;
}

/**
 * Read-only footer of the member form: who created the record and who touched
 * it last. Rows predating the audit trail have no author, so the name falls
 * back to "neznámý" rather than hiding the timestamp.
 */
export const MemberAuditInfo = ({audit}: MemberAuditInfoProps) => {
  const t = translations.members.audit;

  if (!audit) return null;

  const line = (label: string, name: string | null, timestamp: string | null) => {
    if (!timestamp && !name) return null;

    return (
      <span>
        {label}: <span className="font-medium">{name || t.unknownUser}</span>
        {timestamp ? ` (${formatDateTimeFromString(timestamp)})` : ''}
      </span>
    );
  };

  const created = line(t.createdBy, audit.created_by_name, audit.created_at);
  const updated = line(t.updatedBy, audit.updated_by_name, audit.updated_at);

  if (!created && !updated) return null;

  return (
    <div className="flex flex-col gap-1 border-t border-default-200 pt-2 text-xs text-default-500">
      {created}
      {updated}
    </div>
  );
};
