import { describe, it, expect } from 'vitest';
import { isEmail, isPhone, isRequired, trimAll, validateVisitForSubmit } from './validation';

describe('validation utils', () => {
  it('isEmail accepts valid and empty, rejects malformed', () => {
    expect(isEmail('')).toBe(true);
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('nope')).toBe(false);
  });

  it('isPhone accepts valid lengths, rejects short/garbage', () => {
    expect(isPhone('')).toBe(true);
    expect(isPhone('9876543210')).toBe(true);
    expect(isPhone('12')).toBe(false);
    expect(isPhone('abcd')).toBe(false);
  });

  it('isRequired checks non-empty trimmed', () => {
    expect(isRequired('  ')).toBe(false);
    expect(isRequired('x')).toBe(true);
    expect(isRequired(null)).toBe(false);
  });

  it('trimAll trims string fields', () => {
    expect(trimAll({ a: '  hi  ', b: 3 })).toEqual({ a: 'hi', b: 3 });
  });

  const validBase = {
    visit_date: '2026-07-24', visit_time: '10:00', client_name: 'C', business_name: 'B',
    full_address: 'Addr', inquiry_description: 'Desc', lead_rating: 'Hot', meeting_summary: 'Sum',
    email_address: '', mobile_number: '', whatsapp_number: '', follow_up_required: 0,
    follow_up_date: '', budget_amount: null, estimated_business_value: null,
    hasImage: true, hasInquiryCategory: true,
  };

  it('passes when all mandatory fields present', () => {
    expect(validateVisitForSubmit(validBase)).toHaveLength(0);
  });

  it('flags missing mandatory fields', () => {
    const errs = validateVisitForSubmit({ ...validBase, client_name: '', meeting_summary: '' });
    const fields = errs.map((e) => e.field);
    expect(fields).toContain('client_name');
    expect(fields).toContain('meeting_summary');
  });

  it('requires a mandatory image and inquiry category', () => {
    const errs = validateVisitForSubmit({ ...validBase, hasImage: false, hasInquiryCategory: false });
    const fields = errs.map((e) => e.field);
    expect(fields).toContain('image');
    expect(fields).toContain('inquiry_category');
  });

  it('rejects invalid email / phone and negative amounts', () => {
    const errs = validateVisitForSubmit({ ...validBase, email_address: 'bad', mobile_number: '1', budget_amount: -5, estimated_business_value: -1 });
    const fields = errs.map((e) => e.field);
    expect(fields).toContain('email_address');
    expect(fields).toContain('mobile_number');
    expect(fields).toContain('budget_amount');
    expect(fields).toContain('estimated_business_value');
  });

  it('rejects a follow-up date before the visit date', () => {
    const errs = validateVisitForSubmit({ ...validBase, follow_up_required: 1, follow_up_date: '2026-07-20' });
    expect(errs.map((e) => e.field)).toContain('follow_up_date');
  });
});
