import {LoadingSpinner} from '@/components';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner label={'Načítání stránky..'} />
    </div>
  );
}
