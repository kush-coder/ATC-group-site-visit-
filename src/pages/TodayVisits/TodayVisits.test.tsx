import { describe, it, expect } from 'vitest';
import TodayVisits from './TodayVisits';
import { renderPage, screen } from '@/test/utils';

describe('TodayVisits page', () => {
  it("renders today's visit cards", async () => {
    renderPage(TodayVisits, { route: '/today' });
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Test Business')).toBeInTheDocument();
    expect(screen.getByText(/1 visit today/i)).toBeInTheDocument();
  });
});
