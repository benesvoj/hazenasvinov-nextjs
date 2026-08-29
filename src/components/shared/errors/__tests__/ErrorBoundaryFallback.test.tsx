import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import {ErrorBoundaryFallback} from '@/components/shared/errors/ErrorBoundaryFallback';

const boom = (digest?: string) => Object.assign(new Error('boom'), {digest});

describe('ErrorBoundaryFallback', () => {
  it('offers a retry that calls reset', async () => {
    // The errors this catches are mostly transient — a failed chunk load, a DOM
    // some extension moved out from under React — so re-rendering the segment
    // is the action worth putting in front of the user.
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorBoundaryFallback error={boom()} reset={reset} />);

    await user.click(screen.getByRole('button', {name: 'Zkusit znovu'}));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('shows the digest so a coach can quote it when reporting', () => {
    render(<ErrorBoundaryFallback error={boom('abc123')} reset={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('says nothing about a digest when there is none', () => {
    render(<ErrorBoundaryFallback error={boom()} reset={vi.fn()} />);

    expect(screen.queryByText(/Kód chyby/)).not.toBeInTheDocument();
  });

  it('never puts the raw error message on screen', () => {
    // "boom", a stack, or a Postgres error is noise to a coach and can leak
    // schema detail. The digest is the handle into the server logs instead.
    render(<ErrorBoundaryFallback error={boom('abc123')} reset={vi.fn()} />);

    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });
});
