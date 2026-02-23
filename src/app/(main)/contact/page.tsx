'use client';

import {Skeleton} from '@heroui/react';

import {BillingInfoCard, ContactHero, VenueCard} from '@/app/(main)/contact/components';

import {Heading} from '@/components';
import {useFetchClubConfig} from '@/hooks';

export default function ContactPage() {
  const {data, loading, error} = useFetchClubConfig();

  if (loading) return <Skeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Heading size={1}>Kontakt</Heading>
      </div>
      <div className={'grid grid-cols-2 gap-8'}>
        <VenueCard data={data} />
        <BillingInfoCard data={data} />
      </div>
      <ContactHero />
    </div>
  );
}
