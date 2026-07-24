import { describe, it, expect } from 'vitest';
import AllVisits from './AllVisits';
import { renderPage, screen } from '@/test/utils';

describe('AllVisits page', () => {
  it('renders the searchable visit history', async () => {
    renderPage(AllVisits, { route: '/visits' });
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('All Visits')).toBeInTheDocument();
    expect(screen.getByText(/1 result/i)).toBeInTheDocument();
  });
});
