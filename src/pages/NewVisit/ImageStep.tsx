import React, { useRef, useState } from 'react';
import { IonIcon, IonActionSheet } from '@ionic/react';
import { cameraOutline, imagesOutline, trashOutline, starOutline, star, addOutline } from 'ionicons/icons';
import StoredImage from '@/components/images/StoredImage';
import { Select } from '@/components/forms/fields';
import { IMAGE_TYPES } from '@/constants/options';
import { cameraService } from '@/services/camera/cameraService';
import { CameraSource } from '@capacitor/camera';
import { fileService } from '@/services/filesystem/fileService';
import type { DraftImage } from './formState';
import { useApp } from '@/hooks/AppContext';

const MAX_IMAGES = 5;

interface Props {
  images: DraftImage[];
  onChange: (imgs: DraftImage[]) => void;
}

const ImageStep: React.FC<Props> = ({ images, onChange }) => {
  const { toast, haptic } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingSource = useRef<CameraSource | null>(null);

  const add = async (source: CameraSource) => {
    if (images.length >= MAX_IMAGES) { toast(`Maximum ${MAX_IMAGES} photos`, 'warning'); return; }
    setBusy(true);
    try {
      const img = await cameraService.capture(source, 0.7, 1280);
      const isFirst = images.length === 0;
      onChange([...images, { image_path: img.path, image_type: 'Shop', is_primary: isFirst, caption: '' }]);
      haptic('success');
      toast('Photo added', 'success');
    } catch {
      toast('Could not capture image. Check camera permission.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (idx: number) => {
    const img = images[idx];
    await fileService.deleteFile(img.image_path);
    const next = images.filter((_, i) => i !== idx);
    if (img.is_primary && next.length) next[0].is_primary = true;
    onChange(next);
    haptic('light');
  };

  const setPrimary = (idx: number) => {
    onChange(images.map((im, i) => ({ ...im, is_primary: i === idx })));
    haptic('light');
  };

  const setType = (idx: number, type: string) => {
    onChange(images.map((im, i) => (i === idx ? { ...im, image_type: type } : im)));
  };

  return (
    <div>
      <div className="atc-card" style={{ background: 'var(--atc-mint)', borderStyle: 'dashed', borderColor: 'var(--atc-primary)', textAlign: 'center', cursor: 'pointer' }} onClick={() => !busy && setSheetOpen(true)}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <IonIcon icon={busy ? addOutline : cameraOutline} className={busy ? 'atc-pulse' : ''} style={{ fontSize: 28, color: 'var(--atc-primary)' }} />
        </div>
        <div style={{ fontWeight: 700 }}>{busy ? 'Processing…' : 'Capture client location'}</div>
        <div className="atc-muted" style={{ marginTop: 4 }}>At least one photo is required · up to {MAX_IMAGES}</div>
      </div>

      {images.length === 0 && (
        <div className="atc-empty" style={{ padding: 24 }}>
          <div className="atc-empty-icon"><IonIcon icon={imagesOutline} /></div>
          <p>No photos yet. Capture the shop, office, factory, warehouse or product image.</p>
        </div>
      )}

      {images.map((img, idx) => (
        <div key={idx} className="atc-card atc-fade-in" style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative', width: 96, flexShrink: 0 }}>
            <StoredImage path={img.image_path} width={96} height={96} radius={14} />
            {img.is_primary && (
              <span className="atc-chip" style={{ position: 'absolute', top: 4, left: 4, padding: '2px 7px', fontSize: 10 }}>Primary</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Select value={img.image_type} onChange={(v) => setType(idx, v)} options={IMAGE_TYPES} placeholder="Image type" />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setPrimary(idx)} className="atc-pill" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IonIcon icon={img.is_primary ? star : starOutline} /> {img.is_primary ? 'Primary' : 'Set primary'}
              </button>
              <button onClick={() => remove(idx)} className="atc-pill" style={{ color: 'var(--atc-error)', borderColor: '#FECACA' }}>
                <IonIcon icon={trashOutline} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/*
        Ionic awaits a promise-returning handler before dismissing, which would
        keep this sheet stacked above the capture UI for the whole capture.
        Record the choice, then act once the sheet has actually gone away.
      */}
      <IonActionSheet
        isOpen={sheetOpen}
        onDidDismiss={() => {
          setSheetOpen(false);
          const source = pendingSource.current;
          pendingSource.current = null;
          if (source !== null) void add(source);
        }}
        header="Add photo"
        buttons={[
          { text: 'Take photo', icon: cameraOutline, handler: () => { pendingSource.current = CameraSource.Camera; } },
          { text: 'Choose from gallery', icon: imagesOutline, handler: () => { pendingSource.current = CameraSource.Photos; } },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />
    </div>
  );
};

export default ImageStep;
