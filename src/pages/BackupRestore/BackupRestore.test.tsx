import { describe, it, expect } from 'vitest';
import BackupRestore from './BackupRestore';
import { renderPage, screen } from '@/test/utils';

describe('BackupRestore page', () => {
  it('renders backup and restore actions with warning', async () => {
    renderPage(BackupRestore, { route: '/backup' });
    expect(await screen.findByText('Create Backup ZIP')).toBeInTheDocument();
    expect(screen.getByText('Restore from backup')).toBeInTheDocument();
    expect(screen.getByText(/Uninstalling the app removes all local data/i)).toBeInTheDocument();
  });
});
