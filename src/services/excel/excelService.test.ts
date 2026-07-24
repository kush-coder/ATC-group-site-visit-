import { describe, it, expect } from 'vitest';
import { generateDayEndReport } from './excelService';
import { fixtures } from '@/test/setup';

describe('excelService.generateDayEndReport', () => {
  it('produces a base64 workbook and a correctly named file (lightweight)', async () => {
    const progress: number[] = [];
    const { base64, fileName } = await generateDayEndReport(
      [fixtures.sampleBundle as any],
      fixtures.sampleProfile as any,
      '2026-07-24',
      { includeImages: false, onProgress: (p) => progress.push(p) }
    );
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(100);
    expect(fileName).toBe('ATC_FieldConnect_Day_End_Report_TestEmployee_2026-07-24.xlsx');
    // .xlsx (zip) files start with "PK" -> base64 begins with "UEs"
    expect(base64.startsWith('UEs')).toBe(true);
    // progress should have advanced to completion
    expect(Math.max(...progress)).toBe(100);
  });

  it('handles the with-images path gracefully when images cannot be read', async () => {
    const { base64, fileName } = await generateDayEndReport(
      [fixtures.sampleBundle as any],
      fixtures.sampleProfile as any,
      '2026-07-24',
      { includeImages: true }
    );
    expect(base64.startsWith('UEs')).toBe(true);
    expect(fileName).toContain('ATC_FieldConnect_Day_End_Report');
  });

  it('works with an empty visit list', async () => {
    const { base64 } = await generateDayEndReport([], fixtures.sampleProfile as any, '2026-07-24', { includeImages: false });
    expect(base64.startsWith('UEs')).toBe(true);
  });
});
