'use client';

import {Button} from '@heroui/react';

import {ArrowLeftIcon} from '@heroicons/react/24/outline';

import {Link} from '@/components/ui';

import {APP_ROUTES} from '@/lib';

interface BackButtonProps {
  label: string;
}

export function BackButton({label}: BackButtonProps) {
  return (
    <Button
      as={Link}
      href={APP_ROUTES.public.blog}
      variant="bordered"
      startContent={<ArrowLeftIcon className="w-4 h-4" />}
    >
      {label}
    </Button>
  );
}
