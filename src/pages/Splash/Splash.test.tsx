import { describe, it, expect } from 'vitest';
import Splash from './Splash';
import { renderPage, screen } from '@/test/utils';

describe('Splash page', () => {
  it('renders branding and tagline', async () => {
    renderPage(Splash, { route: '/splash' });
    expect(await screen.findByText('ATC FieldConnect')).toBeInTheDocument();
    expect(screen.getByText(/Capture Visits/i)).toBeInTheDocument();
    expect(screen.getByText(/Developed by ATC Group/i)).toBeInTheDocument();
  });
});
