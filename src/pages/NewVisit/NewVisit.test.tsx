import { describe, it, expect } from 'vitest';
import NewVisit from './NewVisit';
import { renderPage, screen } from '@/test/utils';

describe('NewVisit page', () => {
  it('renders the first step of the multi-step form', async () => {
    renderPage(NewVisit, { route: '/visit/new' });
    expect(await screen.findByText(/Step 1 of 11/)).toBeInTheDocument();
    expect(screen.getByText('Visit date')).toBeInTheDocument();
    expect(screen.getByText('Visit time')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders in edit mode for an existing visit id', async () => {
    renderPage(NewVisit, { route: '/visit/edit/5', path: '/visit/edit/:id' });
    expect(await screen.findByText('Edit Visit')).toBeInTheDocument();
  });
});
