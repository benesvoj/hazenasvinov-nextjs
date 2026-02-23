import {UnifiedCard} from '@/components';
import {ClubConfig} from '@/types';

interface ContactHeroProps {
  data: ClubConfig | null;
}

export const ContactHero = ({data}: ContactHeroProps) => {
  return (
    <UnifiedCard>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Kontakt</h1>
        </div>
        <div className={'grid grid-cols-2'}>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Adresa</h2>
              <p>{data?.address}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Telefon</h2>
              <p>{data?.contact_phone}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email</h2>
            </div>
          </div>
        </div>
      </div>
    </UnifiedCard>
  );
};
