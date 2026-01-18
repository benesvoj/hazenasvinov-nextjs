'use client';

import {Button} from '@heroui/react';

import {ArrowLeftIcon} from '@heroicons/react/24/outline';

import {Link} from '@/components/ui';

interface BackButtonProps {
  label: string;
}

export function BackButton({label}: BackButtonProps) {
  return (
    <Button
      as={Link}
      href="/blog"
      variant="bordered"
      startContent={<ArrowLeftIcon className="w-4 h-4" />}
    >
      {label}
    </Button>
  );
}
