import { describe, it, expect } from 'vitest';
import FollowUps from './FollowUps';
import { renderPage, screen } from '@/test/utils';

describe('FollowUps page', () => {
  it('lists pending follow-ups', async () => {
    renderPage(FollowUps, { route: '/followups' });
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups')).toBeInTheDocument();
  });
});
