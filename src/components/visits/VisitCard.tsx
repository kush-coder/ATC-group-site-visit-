/**
 * Visit list card with primary image, key details, badges and swipe actions.
 */
import React from 'react';
import {
  IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonIcon,
} from '@ionic/react';
import {
  createOutline, trashOutline, timeOutline, locationOutline, callOutline,
} from 'ionicons/icons';
import type { ClientVisit, VisitImage } from '@/types/models';
import StoredImage from '@/components/images/StoredImage';
import { leadColorClass } from '@/utils/format';

interface Props {
  visit: ClientVisit;
  primaryImage?: VisitImage | null;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const VisitCard: React.FC<Props> = ({ visit, primaryImage, onOpen, onEdit, onDelete }) => (
  <IonItemSliding className="atc-fade-in">
    <IonItemOptions side="start">
      <IonItemOption color="primary" onClick={onEdit}><IonIcon slot="icon-only" icon={createOutline} /></IonItemOption>
    </IonItemOptions>

    <IonItem lines="none" style={{ '--background': 'transparent', '--padding-start': '0', '--inner-padding-end': '0' }}>
      <div className="atc-card atc-card-press" style={{ width: '100%', margin: '0 0 12px', padding: 12 }} onClick={onOpen}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 74, height: 74, flexShrink: 0 }}>
            {primaryImage
              ? <StoredImage path={primaryImage.image_path} height={74} width={74} radius={14} />
              : <div style={{ width: 74, height: 74, borderRadius: 14, background: 'var(--atc-mint)' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="atc-spread">
              <strong style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{visit.client_name}</strong>
              <span className={`atc-chip ${visit.status}`} style={{ padding: '2px 8px' }}>{visit.status}</span>
            </div>
            <div className="atc-muted" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{visit.business_name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {visit.lead_rating && <span className={`atc-chip ${leadColorClass(visit.lead_rating)}`} style={{ padding: '2px 8px' }}>{visit.lead_rating}</span>}
              {visit.follow_up_required === 1 && <span className="atc-chip warn" style={{ padding: '2px 8px' }}>Follow-up</span>}
            </div>
            <div className="atc-row atc-muted" style={{ marginTop: 8, gap: 12, fontSize: 12 }}>
              <span><IonIcon icon={timeOutline} style={{ verticalAlign: -2 }} /> {visit.visit_time}</span>
              {visit.city && <span><IonIcon icon={locationOutline} style={{ verticalAlign: -2 }} /> {visit.city}</span>}
              {visit.mobile_number && <span><IonIcon icon={callOutline} style={{ verticalAlign: -2 }} /> {visit.mobile_number}</span>}
            </div>
            <div className="atc-muted" style={{ marginTop: 6, fontSize: 11 }}>{visit.visit_number}</div>
          </div>
        </div>
      </div>
    </IonItem>

    <IonItemOptions side="end">
      <IonItemOption color="danger" onClick={onDelete}><IonIcon slot="icon-only" icon={trashOutline} /></IonItemOption>
    </IonItemOptions>
  </IonItemSliding>
);

export default VisitCard;
