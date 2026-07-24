import { describe, it, expect } from 'vitest';
import Settings from './Settings';
import { renderPage, screen } from '@/test/utils';

describe('Settings page', () => {
  it('renders settings sections and offline indicator', async () => {
    renderPage(Settings, { route: '/settings' });
    expect(await screen.findByText('Offline-ready')).toBeInTheDocument();
    expect(screen.getByText('Employee profile')).toBeInTheDocument();
    expect(screen.getByText('Backup & restore')).toBeInTheDocument();
    expect(screen.getByText('About ATC FieldConnect')).toBeInTheDocument();
  });
});
