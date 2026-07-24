import { describe, it, expect } from 'vitest';
import Profile from './Profile';
import { renderPage, screen } from '@/test/utils';

describe('Profile page', () => {
  it('renders the employee profile form prefilled', async () => {
    renderPage(Profile, { route: '/profile' });
    expect(await screen.findAllByText('Test Employee')).not.toHaveLength(0);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Reporting manager')).toBeInTheDocument();
  });
});
