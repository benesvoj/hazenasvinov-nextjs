import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {mockUseFetchMembersInternal} = vi.hoisted(() => ({
  mockUseFetchMembersInternal: vi.fn(),
}));

vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useFetchMembersInternal: mockUseFetchMembersInternal,
  useModal: () => ({isOpen: false, onOpen: vi.fn(), onClose: vi.fn(), onOpenChange: vi.fn()}),
}));

// The create-member modal pulls in the whole member form; not what is under test.
vi.mock('@/components/shared/members/modals/MemberFormModal', () => ({
  MemberFormModal: () => null,
}));

import LineupMemberAssignDialog from '@/features/coach/lineups/components/LineupMemberAssignDialog';

const member = (id: string, name: string, surname: string, registration_number: string) => ({
  id,
  name,
  surname,
  registration_number,
  category_id: 'category-1',
  category_name: 'Dorostenky',
  is_active: true,
});

const renderDialog = () =>
  render(
    <LineupMemberAssignDialog
      isOpen
      onClose={vi.fn()}
      onAddMember={vi.fn().mockResolvedValue(undefined)}
      selectedCategoryId="category-1"
      existingMembers={[]}
      existingJerseyNumbers={[]}
      categories={[]}
    />
  );

describe('LineupMemberAssignDialog', () => {
  beforeEach(() => {
    mockUseFetchMembersInternal.mockReturnValue({
      data: [
        member('m1', 'Michaela', 'Gebauerová', '9415'),
        member('m2', 'Klára', 'Hudečková', '9417'),
      ],
      loading: false,
    });
  });

  it('lists the members it was given', async () => {
    renderDialog();

    expect(await screen.findByText('Michaela Gebauerová')).toBeInTheDocument();
    expect(screen.getByText('Klára Hudečková')).toBeInTheDocument();
  });

  it('selects a member when their row is clicked', async () => {
    // The bug this covers: selection was drawn by a hand-rolled Checkbox inside
    // a react-stately collection, which memoises rows on `items`. The click
    // registered and the tick never appeared, so nobody could be picked.
    // Reaching the setup card is the observable proof a member is selected —
    // it only renders once one is.
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByText('Nastavení člena')).not.toBeInTheDocument();

    await user.click(await screen.findByText('Michaela Gebauerová'));

    expect(await screen.findByText('Nastavení člena')).toBeInTheDocument();
  });

  it('drops the selection when the member leaves the filtered list', async () => {
    const user = userEvent.setup();
    const {rerender} = renderDialog();

    await user.click(await screen.findByText('Michaela Gebauerová'));
    expect(await screen.findByText('Nastavení člena')).toBeInTheDocument();

    mockUseFetchMembersInternal.mockReturnValue({
      data: [member('m2', 'Klára', 'Hudečková', '9417')],
      loading: false,
    });
    rerender(
      <LineupMemberAssignDialog
        isOpen
        onClose={vi.fn()}
        onAddMember={vi.fn().mockResolvedValue(undefined)}
        selectedCategoryId="category-1"
        existingMembers={[]}
        existingJerseyNumbers={[]}
        categories={[]}
      />
    );

    expect(screen.queryByText('Nastavení člena')).not.toBeInTheDocument();
  });
});
