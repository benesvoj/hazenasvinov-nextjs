'use client';

import CoachCardEditor from '@/app/coaches/profile/components/CoachCardEditor';

import {AppPageLayout} from '@/shared/components';

export default function CoachesProfilePage() {
  return (
    <AppPageLayout>
      <CoachCardEditor />
    </AppPageLayout>
  );
}
