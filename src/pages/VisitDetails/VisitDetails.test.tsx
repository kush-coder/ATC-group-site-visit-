import { describe, it, expect } from 'vitest';
import VisitDetails from './VisitDetails';
import { renderPage, screen } from '@/test/utils';

describe('VisitDetails page', () => {
  it('renders the full visit for a given id', async () => {
    renderPage(VisitDetails, { route: '/visit/5', path: '/visit/:id' });
    expect(await screen.findAllByText('Test Client')).not.toHaveLength(0);
    expect(screen.getByText('Client details')).toBeInTheDocument();
    expect(screen.getByText('Inquiry')).toBeInTheDocument();
    expect(screen.getByText('Generate Individual Report')).toBeInTheDocument();
  });
});
