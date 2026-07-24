import { describe, it, expect } from 'vitest';
import About from './About';
import { renderPage, screen } from '@/test/utils';

describe('About page', () => {
  it('renders product info, offline note and attribution', async () => {
    renderPage(About, { route: '/about' });
    expect(await screen.findByText('Fully offline')).toBeInTheDocument();
    expect(screen.getByText('Private & secure')).toBeInTheDocument();
    expect(screen.getByText(/Version 1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Developed by ATC Group/i)).toBeInTheDocument();
  });
});
