import { describe, it, expect } from 'vitest';
import { todayIso, formatDate, formatCurrency, formatBytes, greeting, leadColorClass, initials } from './format';

describe('format utils', () => {
  it('todayIso returns YYYY-MM-DD', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formatDate renders a readable date and handles empty', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('2026-07-24')).toContain('2026');
  });

  it('formatCurrency formats with the rupee symbol', () => {
    expect(formatCurrency(250000)).toBe('₹2,50,000');
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(NaN)).toBe('₹0');
  });

  it('formatBytes scales units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('greeting returns a time-of-day salutation', () => {
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting());
  });

  it('leadColorClass maps ratings', () => {
    expect(leadColorClass('Hot')).toBe('hot');
    expect(leadColorClass('Warm')).toBe('warm');
    expect(leadColorClass('Cold')).toBe('cold');
    expect(leadColorClass('Immediate')).toBe('immediate');
    expect(leadColorClass('unknown')).toBe('');
  });

  it('initials derives up to two uppercase letters', () => {
    expect(initials('Rahul Sharma')).toBe('RS');
    expect(initials('Anita')).toBe('A');
    expect(initials('')).toBe('A');
  });
});
