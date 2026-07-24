import React, { useEffect } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, cameraOutline, documentTextOutline } from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import { useApp } from '@/hooks/AppContext';
import { securityService } from '@/services/security/securityService';
import { TAGLINE, DEVELOPED_BY, APP_NAME, COMPANY_NAME } from '@/constants/options';

const Splash: React.FC = () => {
  const history = useHistory();
  const { dbReady, profile } = useApp();

  useEffect(() => {
    if (!dbReady) return;
    const t = setTimeout(async () => {
      if (!profile) {
        history.replace('/setup');
      } else if (profile.pin_enabled) {
        history.replace('/pin');
      } else {
        await securityService.markActive();
        history.replace('/dashboard');
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [dbReady, profile, history]);

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div style={{
          position: 'absolute', inset: 0, background: 'var(--atc-gradient-deep)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: 24, overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -80, right: -80 }} className="atc-pulse" />
          <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -60, left: -60 }} className="atc-pulse" />

          <div className="atc-pop" style={{ marginBottom: 22 }}>
            <AtcLogo size={96} variant="white" />
          </div>
          <h1 className="atc-fade-in" style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: 0 }}>{APP_NAME}</h1>
          <p className="atc-fade-in" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 10, maxWidth: 300 }}>{TAGLINE}</p>

          <div className="atc-fade-in" style={{ display: 'flex', gap: 20, marginTop: 34 }}>
            {[locationOutline, cameraOutline, documentTextOutline].map((ic, i) => (
              <div key={i} className="atc-pulse" style={{
                width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', animationDelay: `${i * 0.2}s`,
              }}>
                <IonIcon icon={ic} style={{ color: '#fff', fontSize: 24 }} />
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 'calc(28px + var(--ion-safe-area-bottom, 0px))', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>
            {DEVELOPED_BY}
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{COMPANY_NAME}</div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
