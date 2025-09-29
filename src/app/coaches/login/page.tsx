'use client';

import {useEffect} from 'react';

import {useRouter} from 'next/navigation';

export default function CoachesLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified login page with coach tab selected
    router.replace('/login?tab=coach');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Přesměrování na přihlašovací stránku...</p>
      </div>
    </div>
  );
}
