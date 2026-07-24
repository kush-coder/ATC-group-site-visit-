import { describe, it, expect } from 'vitest';
import PinLogin from './PinLogin';
import { renderPage, screen } from '@/test/utils';

describe('PinLogin page', () => {
  it('renders the PIN entry keypad', async () => {
    renderPage(PinLogin, { route: '/pin' });
    expect(await screen.findByText('Enter your PIN')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/stored only on this device/i)).toBeInTheDocument();
  });
});
