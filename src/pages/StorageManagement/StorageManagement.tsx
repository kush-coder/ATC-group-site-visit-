import React, { useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, IonAlert, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  imagesOutline, documentTextOutline, serverOutline, trashOutline, cloudDownloadOutline,
} from 'ionicons/icons';
import { StatTile } from '@/components/common/ui';
import { dbManager } from '@/services/database/db';
import { fileService } from '@/services/filesystem/fileService';
import { useApp } from '@/hooks/AppContext';
import { formatBytes } from '@/utils/format';

const StorageManagement: React.FC = () => {
  const history = useHistory();
  const { toast, haptic } = useApp();
  const [stats, setStats] = useState({ visits: 0, images: 0, imageBytes: 0, reports: 0, reportBytes: 0 });
  const [clearAlert, setClearAlert] = useState<null | 'reports' | 'temp'>(null);

  const load = useCallback(async () => {
    const visitRows = await dbManager.query<{ c: number }>('SELECT COUNT(*) c FROM client_visits');
    const imgRows = await dbManager.query<{ image_path: string }>('SELECT image_path FROM visit_images');
    let imageBytes = 0;
    for (const r of imgRows) imageBytes += await fileService.statSize(r.image_path);
    const reports = await fileService.listReports();
    let reportBytes = 0;
    for (const name of reports) reportBytes += await fileService.statSize(`${fileService.REPORT_DIR}/${name}`);
    setStats({ visits: visitRows[0]?.c ?? 0, images: imgRows.length, imageBytes, reports: reports.length, reportBytes });
  }, []);
  useIonViewWillEnter(() => { load(); });

  const clearReports = async () => {
    const reports = await fileService.listReports();
    for (const name of reports) await fileService.deleteFile(`${fileService.REPORT_DIR}/${name}`);
    setClearAlert(null); haptic('success'); toast('Old reports cleared', 'success'); load();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/settings" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Storage</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatTile icon={documentTextOutline} value={stats.visits} label="Total visits" />
            <StatTile icon={imagesOutline} value={stats.images} label="Stored images" accent="#08783F" />
            <StatTile icon={serverOutline} value={formatBytes(stats.imageBytes)} label="Image storage" />
            <StatTile icon={documentTextOutline} value={formatBytes(stats.reportBytes)} label="Report storage" accent="#08783F" />
          </div>

          <div className="atc-section-title">Manage</div>
          <div className="atc-card atc-card-press" style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => setClearAlert('reports')}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IonIcon icon={trashOutline} style={{ color: 'var(--atc-error)', fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <strong>Delete generated reports</strong>
              <div className="atc-muted">{stats.reports} report{stats.reports !== 1 ? 's' : ''} · {formatBytes(stats.reportBytes)}</div>
            </div>
          </div>

          <div className="atc-card atc-card-press" style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => history.push('/backup')}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IonIcon icon={cloudDownloadOutline} style={{ color: 'var(--atc-primary)', fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <strong>Export / restore backup</strong>
              <div className="atc-muted">Keep your data safe before clearing storage</div>
            </div>
          </div>

          <div className="atc-muted" style={{ textAlign: 'center', marginTop: 20 }}>Client records and images are never deleted without confirmation.</div>
        </div>
      </IonContent>

      <IonAlert isOpen={clearAlert === 'reports'} onDidDismiss={() => setClearAlert(null)}
        header="Delete all reports?" message="Generated Excel reports will be removed from device storage. Your visit data is not affected."
        buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: clearReports }]} />
    </IonPage>
  );
};

export default StorageManagement;
