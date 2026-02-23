'use client';

import {Avatar, Card, CardBody, Link} from '@heroui/react';

import {EnvelopeIcon, PhoneIcon} from '@heroicons/react/24/outline';

import {PublicProfileCard} from '@/types';

interface ProfileCardProps {
  profile: PublicProfileCard;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders a profile card component with an avatar, full name, optional note, email, and phone.
 *
 * @param {object} props - The props for the ProfileCard component.
 * @param {ProfileCardProps} props.profile - The profile data to be displayed in the card, including name, surname, photo_url, note, email, and phone.
 * @param {string} [props.size='md'] - The size of the card. Can be `'sm'` for small size or `'md'`/`'lg'` for medium and large sizes respectively.
 * @return {JSX.Element} The rendered profile card component.
 */
export default function ProfileCard({profile, size = 'md'}: ProfileCardProps) {
  const avatarSize = size === 'sm' ? 'md' : 'lg';
  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-base';
  const fullName = `${profile.name} ${profile.surname}`;

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col items-center text-center p-6">
        <Avatar
          src={profile.photo_url ?? undefined}
          name={fullName}
          size={avatarSize}
          className={size === 'lg' ? 'w-24 h-24' : undefined}
          isBordered
          color="primary"
        />

        <div>
          <h4 className={`font-semibold mt-4 ${textSizeClass}`}>{fullName}</h4>
          {profile.role && (
            <p className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {profile.role}
            </p>
          )}
        </div>

        {profile.note && (
          <p className={`text-gray-600 mt-2 line-clamp-3 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {profile.note}
          </p>
        )}

        <div className="mt-4 space-y-2 w-full">
          {profile.email && (
            <Link
              href={`mailto:${profile.email}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <EnvelopeIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </Link>
          )}
          {profile.phone && (
            <Link
              href={`tel:${profile.phone}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <PhoneIcon className="w-4 h-4 shrink-0" />
              <span>{profile.phone}</span>
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
