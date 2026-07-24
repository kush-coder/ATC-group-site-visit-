import { describe, it, expect } from 'vitest';
import Reports from './Reports';
import { renderPage, screen } from '@/test/utils';

describe('Reports page', () => {
  it('renders the day-end report screen with generation actions', async () => {
    renderPage(Reports, { route: '/reports' });
    expect(await screen.findByText('Report Overview')).toBeInTheDocument();
    expect(screen.getByText('Generate Full Report with Images')).toBeInTheDocument();
    expect(screen.getByText('Generate Lightweight Report')).toBeInTheDocument();
  });
});
