import React, { useRef, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, IonAlert,
} from '@ionic/react';
import {
  cloudDownloadOutline, cloudUploadOutline, warningOutline, checkmarkCircle, archiveOutline,
} from 'ionicons/icons';
import { ProgressOverlay } from '@/components/common/ui';
import { backupService, BackupMeta } from '@/services/backup/backupService';
import { fileService } from '@/services/filesystem/fileService';
import { shareService } from '@/services/share/shareService';
import { useApp } from '@/hooks/AppContext';
import { Capacitor } from '@capacitor/core';

const BackupRestore: React.FC = () => {
  const { toast, haptic, refreshProfile } = useApp();
  const [progress, setProgress] = useState({ visible: false, pct: 0, label: '' });
  const [pendingRestore, setPendingRestore] = useState<{ base64: string; meta: BackupMeta } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = async () => {
    setProgress({ visible: true, pct: 0, label: 'Preparing backup' });
    try {
      const { base64, fileName } = await backupService.exportZip((pct, label) => setProgress({ visible: true, pct, label }));
      const result = await shareService.deliverFile({
        base64,
        fileName,
        mime: 'application/zip',
        title: 'ATC FieldConnect backup',
        text: 'Local backup of ATC FieldConnect visits, images and settings',
        target: 'backup',
      });
      toast(result.method === 'download' ? 'Backup downloaded' : 'Backup created', 'success');
      setLastBackup(fileName);
      haptic('success');
    } catch (e) {
      toast('Backup failed', 'error');
    } finally {
      setProgress({ visible: false, pct: 0, label: '' });
    }
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const meta = await backupService.validate(base64);
      setPendingRestore({ base64, meta });
    } catch (err: any) {
      toast(err?.message ?? 'Invalid backup file', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doRestore = async () => {
    if (!pendingRestore) return;
    setProgress({ visible: true, pct: 0, label: 'Restoring' });
    try {
      await backupService.restoreZip(pendingRestore.base64, (pct, label) => setProgress({ visible: true, pct, label }));
      await refreshProfile();
      haptic('success'); toast('Restore complete', 'success');
    } catch (e) {
      toast('Restore failed', 'error');
    } finally {
      setPendingRestore(null);
      setProgress({ visible: false, pct: 0, label: '' });
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/settings" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Backup & Restore</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          <div className="atc-card" style={{ background: '#FFFBEB', borderColor: 'var(--atc-warning)', display: 'flex', gap: 10 }}>
            <IonIcon icon={warningOutline} style={{ color: 'var(--atc-warning)', fontSize: 22, flexShrink: 0 }} />
            <div className="atc-muted">Uninstalling the app removes all local data. Create a backup regularly to keep your visits and images safe.</div>
          </div>

          <div className="atc-card">
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <IonIcon icon={archiveOutline} style={{ fontSize: 26, color: 'var(--atc-primary)' }} />
            </div>
            <strong style={{ fontSize: 16 }}>Export backup</strong>
            <div className="atc-muted" style={{ margin: '4px 0 14px' }}>Creates a ZIP containing the database, all client images, your profile and settings.</div>
            <IonButton expand="block" onClick={exportBackup} style={{ '--border-radius': '12px' }}>
              <IonIcon slot="start" icon={cloudDownloadOutline} /> Create Backup ZIP
            </IonButton>
            {lastBackup && (
              <div className="atc-row" style={{ marginTop: 10, color: 'var(--atc-success)', fontSize: 13 }}>
                <IonIcon icon={checkmarkCircle} /> <span style={{ wordBreak: 'break-all' }}>{lastBackup}</span>
              </div>
            )}
          </div>

          <div className="atc-card">
            <div style={{ width: 52, height: 52, borderRadius: 15, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <IonIcon icon={cloudUploadOutline} style={{ fontSize: 26, color: '#92400E' }} />
            </div>
            <strong style={{ fontSize: 16 }}>Restore from backup</strong>
            <div className="atc-muted" style={{ margin: '4px 0 14px' }}>Restoring replaces all current data with the backup contents. This cannot be undone.</div>
            <IonButton expand="block" fill="outline" color="warning" onClick={() => fileRef.current?.click()} style={{ '--border-radius': '12px' }}>
              <IonIcon slot="start" icon={cloudUploadOutline} /> Choose Backup File
            </IonButton>
            <input ref={fileRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={onFilePicked} />
          </div>
        </div>
      </IonContent>

      <IonAlert isOpen={!!pendingRestore} onDidDismiss={() => setPendingRestore(null)}
        header="Restore this backup?"
        message={pendingRestore ? `Backup from ${new Date(pendingRestore.meta.createdAt).toLocaleString()}. This will REPLACE all current data.` : ''}
        buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Restore', role: 'destructive', handler: doRestore }]} />

      <ProgressOverlay visible={progress.visible} pct={progress.pct} label={progress.label} />
    </IonPage>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default BackupRestore;
