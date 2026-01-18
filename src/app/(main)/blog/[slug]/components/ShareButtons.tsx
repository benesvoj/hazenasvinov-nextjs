'use client';

import {Button} from '@heroui/react';

import {BookmarkIcon, ShareIcon} from '@heroicons/react/24/outline';

export function ShareButtons() {
  return (
    <div className="flex items-center gap-4">
      <Button variant="bordered" size="sm" startContent={<ShareIcon className="w-4 h-4" />}>
        Sdílet
      </Button>
      <Button variant="bordered" size="sm" startContent={<BookmarkIcon className="w-4 h-4" />}>
        Uložit
      </Button>
    </div>
  );
}
