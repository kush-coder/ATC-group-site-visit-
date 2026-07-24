import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { backspaceOutline, fingerPrintOutline, lockClosedOutline } from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import { useApp } from '@/hooks/AppContext';
import { securityService } from '@/services/security/securityService';
import { biometricService } from '@/services/security/biometricService';

const PinLogin: React.FC = () => {
  const history = useHistory();
  const { profile, toast, haptic } = useApp();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const promptedRef = useRef(false);

  const unlock = useCallback(async () => {
    await securityService.markActive();
    haptic('success');
    history.replace('/dashboard');
  }, [haptic, history]);

  const runBiometric = useCallback(async (auto: boolean) => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const result = await biometricService.authenticate('Unlock ATC FieldConnect');
      if (result.ok) {
        await unlock();
      } else if (!auto || !result.cancelled) {
        // A silently cancelled auto-prompt shouldn't nag; everything else does.
        haptic('error');
        toast(result.message, result.lockedOut ? 'warning' : 'info');
      }
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, unlock, haptic, toast]);

  // Offer biometrics automatically when the employee has enabled them.
  useEffect(() => {
    if (!profile?.biometric_enabled || promptedRef.current) return;
    promptedRef.current = true;
    (async () => {
      const info = await biometricService.availability();
      setBioAvailable(info.available);
      if (info.available) await runBiometric(true);
    })();
  }, [profile?.biometric_enabled, runBiometric]);

  useEffect(() => {
    if (pin.length === 4) verify(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const verify = async (value: string) => {
    const ok = await securityService.verifyPin(value, profile?.pin_hash ?? null);
    if (ok) {
      await unlock();
    } else {
      haptic('error');
      setShake(true);
      toast('Incorrect PIN', 'error');
      setTimeout(() => { setShake(false); setPin(''); }, 500);
    }
  };

  const press = (d: string) => { if (pin.length < 4) { setPin(pin + d); haptic('light'); } };
  const del = () => setPin(pin.slice(0, -1));

  return (
    <IonPage>
      <IonContent scrollY={false}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--atc-gradient-deep)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <AtcLogo size={64} variant="white" />
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 18 }}>Enter your PIN</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>Welcome back, {profile?.employee_name?.split(' ')[0]}</div>

          <div className={shake ? 'atc-shake' : ''} style={{ display: 'flex', gap: 16, margin: '30px 0' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < pin.length ? '#fff' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.2s ease', transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
              }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 74px)', gap: 16 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} onClick={() => press(d)} style={keyStyle}>{d}</button>
            ))}
            <button
              aria-label="Unlock with biometrics"
              disabled={!profile?.biometric_enabled || bioBusy}
              onClick={() => runBiometric(false)}
              className={bioBusy ? 'atc-pulse' : ''}
              style={{
                ...keyStyle,
                background: 'transparent',
                fontSize: 22,
                opacity: profile?.biometric_enabled ? 1 : 0.25,
                cursor: profile?.biometric_enabled ? 'pointer' : 'default',
              }}
            >
              <IonIcon icon={fingerPrintOutline} />
            </button>
            <button onClick={() => press('0')} style={keyStyle}>0</button>
            <button onClick={del} style={{ ...keyStyle, background: 'transparent', fontSize: 22 }}>
              <IonIcon icon={backspaceOutline} />
            </button>
          </div>

          {profile?.biometric_enabled && bioAvailable && (
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 20 }}>
              {bioBusy ? 'Waiting for biometrics…' : 'Tap the fingerprint icon to unlock with biometrics'}
            </div>
          )}

          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IonIcon icon={lockClosedOutline} /> Your data is stored only on this device
          </div>
        </div>
      </IonContent>
      <style>{`
        .atc-shake { animation: atc-shake 0.4s; }
        @keyframes atc-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      `}</style>
    </IonPage>
  );
};

const keyStyle: React.CSSProperties = {
  width: 74, height: 74, borderRadius: '50%', border: 'none',
  background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 26, fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export default PinLogin;
