import { describe, it, expect } from 'vitest';
import StorageManagement from './StorageManagement';
import { renderPage, screen } from '@/test/utils';

describe('StorageManagement page', () => {
  it('renders storage stats and management actions', async () => {
    renderPage(StorageManagement, { route: '/storage' });
    expect(await screen.findByText('Total visits')).toBeInTheDocument();
    expect(screen.getByText('Delete generated reports')).toBeInTheDocument();
    expect(screen.getByText('Export / restore backup')).toBeInTheDocument();
  });
});
