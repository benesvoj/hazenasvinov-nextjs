'use client';

import React from 'react';

import {Avatar, Card, CardBody, Link} from '@heroui/react';

import {EnvelopeIcon, PhoneIcon} from '@heroicons/react/24/outline';

import {PublicCoachCard} from '@/types';

interface CoachCardDisplayProps {
  coach: PublicCoachCard;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display component for a public coach card
 * Used on category public pages
 */
export default function CoachCardDisplay({coach, size = 'md'}: CoachCardDisplayProps) {
  const avatarSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'lg';
  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-base';

  const fullName = `${coach.name} ${coach.surname}`;

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col items-center text-center p-6">
        {/* Avatar */}
        <Avatar
          src={coach.photo_url ?? undefined}
          name={fullName}
          size={avatarSize}
          className={size === 'lg' ? 'w-24 h-24' : undefined}
          isBordered
          color="primary"
        />

        {/* Name */}
        <h4 className={`font-semibold mt-4 ${textSizeClass}`}>{fullName}</h4>

        {/* Note/Bio */}
        {coach.note && (
          <p className={`text-gray-600 mt-2 line-clamp-3 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {coach.note}
          </p>
        )}

        {/* Contact Info */}
        <div className="mt-4 space-y-2 w-full">
          {coach.email && (
            <Link
              href={`mailto:${coach.email}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{coach.email}</span>
            </Link>
          )}
          {coach.phone && (
            <Link
              href={`tel:${coach.phone}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{coach.phone}</span>
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
