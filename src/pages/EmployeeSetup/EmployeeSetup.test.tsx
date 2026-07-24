import { describe, it, expect } from 'vitest';
import EmployeeSetup from './EmployeeSetup';
import { renderPage, screen } from '@/test/utils';

describe('EmployeeSetup page', () => {
  it('renders the setup form with mandatory fields and CTA', async () => {
    renderPage(EmployeeSetup, { route: '/setup' });
    expect(await screen.findByText("Let's set you up")).toBeInTheDocument();
    expect(screen.getByText('Employee name')).toBeInTheDocument();
    expect(screen.getByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
