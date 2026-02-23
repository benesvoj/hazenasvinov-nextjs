import {Button} from '@heroui/react';

import {DocumentDuplicateIcon} from '@heroicons/react/24/outline';

import {Heading} from '@/components';
import {Nullish} from '@/types';
import {copyToClipboard} from '@/utils';

export const CardAttribute = ({
  label,
  value,
  isPossibleToCopy = false,
  multiline = false,
}: {
  label: string;
  value: string | Nullish;
  isPossibleToCopy?: boolean;
  multiline?: boolean;
}) => (
  <div>
    <Heading size={6}>{label}</Heading>

    {isPossibleToCopy && value ? (
      <div className={'flex gap-4 items-center'}>
        <p className={'text-gray-500'}>{value}</p>
        <Button isIconOnly size={'sm'} onPress={() => copyToClipboard(value)}>
          <DocumentDuplicateIcon height={16} width={16} />
        </Button>
      </div>
    ) : (
      <p className={multiline ? 'text-gray-500 whitespace-pre-wrap' : 'text-gray-500'}>{value}</p>
    )}
  </div>
);
