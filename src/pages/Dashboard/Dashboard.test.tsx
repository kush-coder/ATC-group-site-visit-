import { describe, it, expect } from 'vitest';
import Dashboard from './Dashboard';
import { renderPage, screen } from '@/test/utils';

describe('Dashboard page', () => {
  it('renders greeting, overview stats and quick actions', async () => {
    renderPage(Dashboard, { route: '/dashboard' });
    expect(await screen.findByText("Today's Overview")).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('New Client Visit')).toBeInTheDocument();
    expect(screen.getByText('Day-End Report')).toBeInTheDocument();
  });
});
