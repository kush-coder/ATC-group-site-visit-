import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// This suite exercises the real shareService, so undo the global mock.
vi.unmock('@/services/share/shareService');

const { shareService } = await vi.importActual<typeof import('./shareService')>('./shareService');

const B64 = 'UEsDBBQA'; // arbitrary valid base64
const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const originalShare = (navigator as any).share;
const originalCanShare = (navigator as any).canShare;

function setNavigator(share: any, canShare: any) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true, writable: true });
}

describe('shareService on web', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // jsdom lacks these; provide deterministic stubs.
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as any).revokeObjectURL = vi.fn();
  });
  afterEach(() => setNavigator(originalShare, originalCanShare));

  it('reports no file sharing when the Web Share API is absent', () => {
    setNavigator(undefined, undefined);
    expect(shareService.canWebShareFile('r.xlsx', MIME)).toBe(false);
  });

  it('reports file sharing when the browser can share files', () => {
    setNavigator(vi.fn(), vi.fn(() => true));
    expect(shareService.canWebShareFile('r.xlsx', MIME)).toBe(true);
  });

  it('reports no file sharing when canShare rejects files', () => {
    setNavigator(vi.fn(), vi.fn(() => false));
    expect(shareService.canWebShareFile('r.xlsx', MIME)).toBe(false);
  });

  it('uses the Web Share sheet with an actual File when supported', async () => {
    const share = vi.fn(async () => {});
    setNavigator(share, vi.fn(() => true));

    const result = await shareService.deliverFile({
      base64: B64, fileName: 'report.xlsx', mime: MIME, title: 'T', text: 'X',
    });

    expect(result).toEqual({ method: 'web-share', cancelled: false });
    const arg = share.mock.calls[0][0] as any;
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].name).toBe('report.xlsx');
    expect(arg.files[0].type).toBe(MIME);
  });

  it('treats a dismissed share sheet as cancelled, not an error', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    setNavigator(vi.fn(async () => { throw abort; }), vi.fn(() => true));

    const result = await shareService.deliverFile({
      base64: B64, fileName: 'report.xlsx', mime: MIME, title: 'T', text: 'X',
    });
    expect(result).toEqual({ method: 'web-share', cancelled: true });
  });

  it('falls back to a download when the browser cannot share files', async () => {
    setNavigator(undefined, undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const result = await shareService.deliverFile({
      base64: B64, fileName: 'report.xlsx', mime: MIME, title: 'T', text: 'X',
    });

    expect(result).toEqual({ method: 'download', cancelled: false });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('still delivers the file when navigator.share fails for a non-abort reason', async () => {
    setNavigator(vi.fn(async () => { throw new Error('no target'); }), vi.fn(() => true));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const result = await shareService.deliverFile({
      base64: B64, fileName: 'report.xlsx', mime: MIME, title: 'T', text: 'X',
    });

    expect(result.method).toBe('download');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('downloadBase64 revokes the object URL it creates', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.useFakeTimers();
    shareService.downloadBase64(B64, 'x.zip', 'application/zip');
    expect(URL.createObjectURL).toHaveBeenCalled();
    vi.advanceTimersByTime(11_000);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
