'use client';

import {useQueryContext} from '@/shared/hooks/useQueryContext';
import {createFeatureCrud} from '@/shared/lib';

import {recordingsConfig} from '../config';
import type {RecordingInsert, RecordingSchema} from '../types';

export function useRecordingsCrud() {
  const ctx = useQueryContext();

  const factory = createFeatureCrud<RecordingSchema, RecordingInsert>(recordingsConfig, 'db');

  return factory(ctx);
}
