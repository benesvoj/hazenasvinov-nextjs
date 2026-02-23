import {Button} from '@heroui/react';

import {DocumentDuplicateIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {Heading, UnifiedCard} from '@/components';
import {ClubConfig, Nullish} from '@/types';
import {copyToClipboard} from '@/utils';

interface ContactInfoCardProps {
  data: ClubConfig | null;
}

export const ContactInfoCard = ({data}: ContactInfoCardProps) => {
  return (
    <UnifiedCard title={translations.common.labels.billingInformation}>
      <div className="space-y-4">
        <CardAttribute label={translations.common.labels.address} value={data?.address} multiline />
        <CardAttribute
          label={translations.common.labels.identityNumber}
          value={data?.identity_number}
          isPossibleToCopy
        />
        <div className={'grid grid-cols-2 gap-4'}>
          <CardAttribute label={translations.common.labels.bankName} value={data?.bank_name} />
          <CardAttribute
            label={translations.common.labels.bankNumber}
            value={data?.bank_number}
            isPossibleToCopy
          />
        </div>
      </div>
    </UnifiedCard>
  );
};

const CardAttribute = ({
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
        <Button
          isIconOnly
          size={'sm'}
          onPress={() => copyToClipboard(value)}
          startContent={<DocumentDuplicateIcon height={16} width={16} />}
        />
      </div>
    ) : (
      <p className={multiline ? 'text-gray-500 whitespace-pre-wrap' : 'text-gray-500'}>{value}</p>
    )}
  </div>
);
