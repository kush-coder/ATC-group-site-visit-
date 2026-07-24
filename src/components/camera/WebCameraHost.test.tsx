import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import WebCameraHost from './WebCameraHost';
import { webCamera } from '@/services/camera/webCamera';

/** Minimal fake MediaStream whose tracks record being stopped. */
function fakeStream() {
  const stop = vi.fn();
  return { stream: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop };
}

function setUserMedia(impl: any) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: impl },
    configurable: true,
    writable: true,
  });
}

describe('WebCameraHost', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // jsdom cannot play video.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async () => {});
  });
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true, writable: true });
  });

  it('registers an opener while mounted and unregisters on unmount', () => {
    setUserMedia(vi.fn());
    const { unmount } = render(<WebCameraHost />);
    expect(webCamera.isAvailable()).toBe(true);
    unmount();
    expect(webCamera.isAvailable()).toBe(false);
  });

  it('renders nothing until a capture is requested', () => {
    setUserMedia(vi.fn());
    render(<WebCameraHost />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a live camera and resolves a JPEG data URL on capture', async () => {
    const { stream, stop } = fakeStream();
    setUserMedia(vi.fn(async () => stream));
    // Canvas is not implemented in jsdom.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(), translate: vi.fn(), scale: vi.fn(),
    } as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,ZZZ');

    render(<WebCameraHost />);
    let pending!: Promise<string | null>;
    act(() => { pending = webCamera.capture(); });

    const shutter = await screen.findByLabelText('Capture photo');
    await waitFor(() => expect(shutter).not.toBeDisabled());
    act(() => { shutter.click(); });

    await expect(pending).resolves.toBe('data:image/jpeg;base64,ZZZ');
    expect(stop).toHaveBeenCalled();            // stream released
    expect(screen.queryByRole('dialog')).toBeNull(); // modal closed
  });

  it('resolves null when the user cancels, and stops the stream', async () => {
    const { stream, stop } = fakeStream();
    setUserMedia(vi.fn(async () => stream));

    render(<WebCameraHost />);
    let pending!: Promise<string | null>;
    act(() => { pending = webCamera.capture(); });

    const cancel = await screen.findByLabelText('Cancel');
    act(() => { cancel.click(); });

    await expect(pending).resolves.toBeNull();
    expect(stop).toHaveBeenCalled();
  });

  it('explains a denied camera permission instead of crashing', async () => {
    setUserMedia(vi.fn(async () => { throw new DOMException('denied', 'NotAllowedError'); }));

    render(<WebCameraHost />);
    act(() => { void webCamera.capture(); });

    expect(await screen.findByText(/permission was denied/i)).toBeInTheDocument();
    // Shutter stays disabled so nothing can be captured from a dead stream.
    expect(screen.getByLabelText('Capture photo')).toBeDisabled();
  });

  it('explains when no camera exists on the machine', async () => {
    setUserMedia(vi.fn(async () => { throw new DOMException('none', 'NotFoundError'); }));

    render(<WebCameraHost />);
    act(() => { void webCamera.capture(); });

    expect(await screen.findByText(/No camera was found/i)).toBeInTheDocument();
  });
});
