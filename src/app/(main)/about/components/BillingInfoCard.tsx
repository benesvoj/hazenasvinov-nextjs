import {translations} from '@/lib/translations/index';

import {CardAttribute} from '@/app/(main)/about/components/CardAttribute';

import {UnifiedCard} from '@/components';
import {ClubConfig} from '@/types';

interface BillingInfoCardProps {
  data: ClubConfig | null;
}

export const BillingInfoCard = ({data}: BillingInfoCardProps) => {
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
