import React from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonIcon,
} from '@ionic/react';
import { cloudOfflineOutline, shieldCheckmarkOutline, phonePortraitOutline } from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import { APP_NAME, COMPANY_NAME, TAGLINE, DEVELOPED_BY, APP_VERSION } from '@/constants/options';

const About: React.FC = () => (
  <IonPage>
    <IonHeader className="ion-no-border">
      <IonToolbar>
        <IonButtons slot="start"><IonBackButton defaultHref="/settings" /></IonButtons>
        <IonTitle style={{ fontWeight: 700 }}>About</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div style={{ textAlign: 'center', padding: '40px 24px 20px' }}>
        <AtcLogo size={96} />
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '18px 0 4px' }}>{APP_NAME}</h1>
        <p className="atc-muted" style={{ maxWidth: 300, margin: '0 auto' }}>{TAGLINE}</p>
        <div className="atc-chip" style={{ marginTop: 14 }}>Version {APP_VERSION}</div>
      </div>

      <div className="atc-page-pad">
        {[
          { icon: cloudOfflineOutline, title: 'Fully offline', text: 'All records and images are stored locally. No backend, no cloud, no internet required.' },
          { icon: shieldCheckmarkOutline, title: 'Private & secure', text: 'Your data never leaves this device. Optional PIN and biometric lock protect access.' },
          { icon: phonePortraitOutline, title: 'Built for the field', text: 'Capture visits, photos, GPS and opportunities, then generate a day-end Excel report on the spot.' },
        ].map((f) => (
          <div key={f.title} className="atc-card" style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IonIcon icon={f.icon} style={{ fontSize: 22, color: 'var(--atc-primary)' }} />
            </div>
            <div>
              <strong>{f.title}</strong>
              <div className="atc-muted" style={{ marginTop: 2 }}>{f.text}</div>
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--atc-text-secondary)' }}>
          <strong>{DEVELOPED_BY}</strong>
          <div className="atc-muted" style={{ marginTop: 4 }}>© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</div>
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export default About;
