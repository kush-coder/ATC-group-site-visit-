/**
 * Renders an image stored on the local filesystem by resolving its path to a
 * displayable source. Shows a skeleton while resolving and a fallback on error.
 */
import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { imageOutline } from 'ionicons/icons';
import { fileService } from '@/services/filesystem/fileService';

interface Props {
  path: string;
  alt?: string;
  radius?: number;
  height?: number | string;
  width?: number | string;
  objectFit?: 'cover' | 'contain';
}

const StoredImage: React.FC<Props> = ({ path, alt = '', radius = 12, height = 120, width = '100%', objectFit = 'cover' }) => {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSrc(''); setFailed(false);
    fileService.displaySrc(path).then((s) => {
      if (!active) return;
      if (s) setSrc(s); else setFailed(true);
    }).catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [path]);

  if (failed || !path) {
    return (
      <div style={{ width, height, borderRadius: radius, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--atc-primary)' }}>
        <IonIcon icon={imageOutline} style={{ fontSize: 26 }} />
      </div>
    );
  }
  if (!src) {
    return <div className="atc-skeleton" style={{ width, height, borderRadius: radius }} />;
  }
  return <img src={src} alt={alt} style={{ width, height, objectFit, borderRadius: radius, display: 'block' }} />;
};

export default StoredImage;
