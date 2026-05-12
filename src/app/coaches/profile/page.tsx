'use client';

import {CoachCardEditor} from '@/features/coach/profile';
import {AppPageLayout} from '@/shared/components';

export default function CoachesProfilePage() {
  return (
    <AppPageLayout>
      <CoachCardEditor />
    </AppPageLayout>
  );
}
