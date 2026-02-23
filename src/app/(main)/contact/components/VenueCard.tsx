import {translations} from '@/lib/translations/index';

import {CardAttribute} from '@/app/(main)/contact/components';

import {UnifiedCard} from '@/components';
import {ClubConfig} from '@/types';

interface ContactHeroProps {
  data: ClubConfig | null;
}

export const VenueCard = ({data}: ContactHeroProps) => {
  return (
    <UnifiedCard title={translations.common.labels.venueAddressAndContacts}>
      <div className="space-y-4">
        <CardAttribute
          label={translations.common.labels.venueAddress}
          value={data?.venue_address}
          multiline
        />
        <CardAttribute
          label={translations.common.labels.contactPhone}
          value={data?.contact_phone}
          isPossibleToCopy
        />
        <CardAttribute
          label={translations.common.labels.contactEmail}
          value={data?.contact_email}
          isPossibleToCopy
        />
      </div>
    </UnifiedCard>
  );
};
