import Image from 'next/image';

import {useClubConfig} from '@/hooks/entities/club/useClubConfig';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackSrc?: string;
  alt?: string;
}

export default function Logo({
  size = 'md',
  className = '',
  fallbackSrc = '/logo.png',
  alt = 'Club Logo',
}: LogoProps) {
  const {clubConfig} = useClubConfig();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const logoUrl = clubConfig?.club_logo_url || fallbackSrc;

  return (
    <Image
      src={logoUrl}
      alt={alt}
      width={sizePixels[size]}
      height={sizePixels[size]}
      className={`${sizeClasses[size]} ${className}`}
      // TODO: still getting image warning about priority
      priority={true} // Always prioritize logo loading since it's above the fold
    />
  );
}
