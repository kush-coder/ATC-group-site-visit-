import React, { useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline, callOutline, chevronForwardOutline, calendarOutline } from 'ionicons/icons';
import { EmptyState, SkeletonList } from '@/components/common/ui';
import { visitRepo } from '@/services/database/repository';
import { formatDate, leadColorClass } from '@/utils/format';
import type { ClientVisit } from '@/types/models';

const FollowUps: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<ClientVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await visitRepo.all();
    const fu = all.filter((v) => v.follow_up_required === 1)
      .sort((a, b) => (a.follow_up_date || '9999').localeCompare(b.follow_up_date || '9999'));
    setItems(fu);
    setLoading(false);
  }, []);
  useIonViewWillEnter(() => { load(); });

  const isOverdue = (d: string) => d && d < new Date().toISOString().slice(0, 10);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Follow-ups</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          {loading ? <SkeletonList /> : items.length === 0 ? (
            <EmptyState icon={notificationsOutline} title="No follow-ups pending"
              message="No follow-ups are pending. Your upcoming client actions will appear here." />
          ) : items.map((v) => (
            <div key={v.id} className="atc-card atc-card-press" onClick={() => history.push(`/visit/${v.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: isOverdue(v.follow_up_date) ? '#FEE2E2' : 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IonIcon icon={calendarOutline} style={{ fontSize: 22, color: isOverdue(v.follow_up_date) ? 'var(--atc-error)' : 'var(--atc-primary)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="atc-spread">
                  <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.client_name}</strong>
                  {v.lead_rating && <span className={`atc-chip ${leadColorClass(v.lead_rating)}`} style={{ padding: '2px 8px' }}>{v.lead_rating}</span>}
                </div>
                <div className="atc-muted" style={{ marginTop: 2 }}>{v.business_name}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: isOverdue(v.follow_up_date) ? 'var(--atc-error)' : 'var(--atc-text-secondary)', fontWeight: 600 }}>
                  <span>{v.follow_up_date ? formatDate(v.follow_up_date) : 'No date'} {v.follow_up_time}</span>
                  <span>· {v.follow_up_mode || 'Follow-up'}</span>
                  {isOverdue(v.follow_up_date) && <span>· Overdue</span>}
                </div>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--atc-text-secondary)' }} />
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FollowUps;
