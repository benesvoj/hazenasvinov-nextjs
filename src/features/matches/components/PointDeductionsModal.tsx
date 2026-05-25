'use client';

import React, {useCallback, useEffect, useState} from 'react';

import {Button, Input, Select, SelectItem} from '@heroui/react';

import {TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {supabaseBrowserClient} from '@/utils/supabase/client';

import {UnifiedModal} from '@/components';
import {PointDeduction} from '@/types';

const t = translations.pointDeductions;

interface FilteredTeam {
  id: string;
  name: string;
  display_name?: string;
}

interface PointDeductionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  seasonId: string;
  teams: FilteredTeam[];
  onDeductionsChanged: () => void;
}

interface NewDeductionForm {
  team_id: string;
  points: string;
  reason: string;
}

const EMPTY_FORM: NewDeductionForm = {team_id: '', points: '', reason: ''};

export default function PointDeductionsModal({
  isOpen,
  onClose,
  categoryId,
  seasonId,
  teams,
  onDeductionsChanged,
}: PointDeductionsModalProps) {
  const [deductions, setDeductions] = useState<PointDeduction[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewDeductionForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const fetchDeductions = useCallback(async () => {
    if (!categoryId || !seasonId) return;
    setLoadingList(true);
    try {
      const supabase = supabaseBrowserClient();
      const {data, error} = await supabase
        .from('point_deductions')
        .select(
          `
          *,
          team:club_category_teams(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name)
            )
          )
        `
        )
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .order('created_at', {ascending: false});

      if (error) throw error;
      setDeductions((data as PointDeduction[]) || []);
    } catch {
      // silently ignore fetch errors — list stays empty
    } finally {
      setLoadingList(false);
    }
  }, [categoryId, seasonId]);

  useEffect(() => {
    if (isOpen) {
      fetchDeductions();
      setForm(EMPTY_FORM);
      setFormError('');
    }
  }, [isOpen, fetchDeductions]);

  const handleAdd = async () => {
    setFormError('');
    if (!form.team_id) {
      setFormError(t.validation.teamRequired);
      return;
    }
    const pointsNum = parseInt(form.points, 10);
    if (!form.points || isNaN(pointsNum)) {
      setFormError(t.validation.pointsRequired);
      return;
    }
    if (pointsNum >= 0) {
      setFormError(t.validation.pointsMustBeNegative);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/point-deductions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          team_id: form.team_id,
          category_id: categoryId,
          season_id: seasonId,
          points: pointsNum,
          reason: form.reason || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setForm(EMPTY_FORM);
      await fetchDeductions();
      onDeductionsChanged();
    } catch {
      setFormError(t.toasts.createError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/point-deductions/${id}`, {method: 'DELETE'});
      if (!res.ok) throw new Error('Failed');
      setDeductions((prev) => prev.filter((d) => d.id !== id));
      onDeductionsChanged();
    } catch {
      // silently ignore — item stays in list
    }
  };

  const getTeamLabel = (deduction: PointDeduction) => {
    const club = (deduction.team as any)?.club_category?.club;
    const suffix = (deduction.team as any)?.team_suffix;
    if (club) return suffix && suffix !== 'A' ? `${club.name} ${suffix}` : club.name;
    return deduction.team_id;
  };

  return (
    <UnifiedModal isOpen={isOpen} onClose={onClose} title={t.title} size="lg" isOnlyCloseButton>
      <div className="space-y-6">
        {/* Existing deductions */}
        <div>
          {loadingList ? (
            <p className="text-sm text-gray-500">{translations.common.loading}</p>
          ) : deductions.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noDeductions}</p>
          ) : (
            <div className="space-y-2">
              {deductions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{getTeamLabel(d)}</span>
                    <span className="text-xs text-red-600 font-semibold">{d.points} b.</span>
                    {d.reason && <span className="text-xs text-gray-500">{d.reason}</span>}
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => handleDelete(d.id)}
                    aria-label="Smazat odečet"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new deduction form */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold">{t.addDeduction}</p>

          <Select
            label={t.fields.team}
            selectedKeys={form.team_id ? [form.team_id] : []}
            onSelectionChange={(keys) =>
              setForm((f) => ({...f, team_id: String(Array.from(keys)[0] ?? '')}))
            }
            size="sm"
          >
            {teams.map((team) => (
              <SelectItem key={team.id} textValue={team.display_name || team.name}>
                {team.display_name || team.name}
              </SelectItem>
            ))}
          </Select>

          <Input
            label={t.fields.points}
            placeholder={t.placeholders.points}
            type="number"
            value={form.points}
            onValueChange={(v) => setForm((f) => ({...f, points: v}))}
            size="sm"
          />

          <Input
            label={t.fields.reason}
            placeholder={t.placeholders.reason}
            value={form.reason}
            onValueChange={(v) => setForm((f) => ({...f, reason: v}))}
            size="sm"
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button
            color="primary"
            size="sm"
            onPress={handleAdd}
            isLoading={saving}
            isDisabled={saving}
          >
            {t.addDeduction}
          </Button>
        </div>
      </div>
    </UnifiedModal>
  );
}
