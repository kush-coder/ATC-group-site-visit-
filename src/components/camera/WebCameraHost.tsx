/**
 * In-browser camera capture. Mounted once at app root; registers itself with
 * the webCamera bridge so cameraService can open it on demand.
 *
 * Gives the browser preview a real camera (live stream + shutter) instead of
 * the OS file picker the Capacitor plugin falls back to on web.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, cameraReverseOutline, radioButtonOnOutline, alertCircleOutline } from 'ionicons/icons';
import { webCamera } from '@/services/camera/webCamera';

type Resolver = (value: string | null) => void;

const WebCameraHost: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveRef = useRef<Resolver | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  /** Settle the pending capture promise exactly once. */
  const settle = useCallback((value: string | null) => {
    stopStream();
    setOpen(false);
    setError('');
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(value);
  }, [stopStream]);

  // Register the opener with the bridge for the lifetime of this component.
  useEffect(() => {
    webCamera.register(
      () =>
        new Promise<string | null>((resolve) => {
          resolveRef.current = resolve;
          setError('');
          setReady(false);
          setOpen(true);
        })
    );
    return () => {
      webCamera.unregister();
      stopStream();
    };
  }, [stopStream]);

  // Start / restart the stream whenever the modal opens or the camera flips.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1600 }, height: { ideal: 1200 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException)?.name;
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser, or choose a photo from the gallery instead.'
            : name === 'NotFoundError'
              ? 'No camera was found on this device. Choose a photo from the gallery instead.'
              : 'The camera could not be started. Choose a photo from the gallery instead.'
        );
      }
    })();

    return () => { cancelled = true; };
  }, [open, facing, stopStream]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return settle(null);
    // Mirror the selfie camera so the capture matches the preview.
    if (facing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    settle(canvas.toDataURL('image/jpeg', 0.9));
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Camera"
      style={{
        position: 'fixed', inset: 0, zIndex: 40000, background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: facing === 'user' ? 'scaleX(-1)' : 'none',
          }}
        />
        {!ready && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span className="atc-pulse">Starting camera…</span>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', color: '#fff' }}>
            <IonIcon icon={alertCircleOutline} style={{ fontSize: 48, color: 'var(--atc-warning)', marginBottom: 14 }} />
            <p style={{ maxWidth: 320, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `18px 28px calc(24px + var(--ion-safe-area-bottom, 0px))`, background: '#000',
        }}
      >
        <button aria-label="Cancel" onClick={() => settle(null)} style={iconBtn}>
          <IonIcon icon={closeOutline} />
        </button>

        <button
          aria-label="Capture photo"
          disabled={!ready}
          onClick={shoot}
          style={{
            width: 74, height: 74, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.85)',
            background: ready ? '#fff' : 'rgba(255,255,255,0.35)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: ready ? 'pointer' : 'default',
          }}
        >
          <IonIcon icon={radioButtonOnOutline} style={{ fontSize: 34, color: 'var(--atc-primary)' }} />
        </button>

        <button
          aria-label="Switch camera"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          style={iconBtn}
        >
          <IonIcon icon={cameraReverseOutline} />
        </button>
      </div>
    </div>
  );
};

const iconBtn: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 24, border: 'none',
  background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export default WebCameraHost;
