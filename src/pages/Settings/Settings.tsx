import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  personCircleOutline, keypadOutline, fingerPrintOutline, imageOutline, cloudDownloadOutline,
  serverOutline, informationCircleOutline, shieldCheckmarkOutline, chevronForwardOutline,
  cloudOfflineOutline, chevronDownOutline, chevronUpOutline,
} from 'ionicons/icons';
import { ToggleRow, TextInput, Select } from '@/components/forms/fields';
import { useApp } from '@/hooks/AppContext';
import { employeeRepo } from '@/services/database/repository';
import { securityService } from '@/services/security/securityService';

const Settings: React.FC = () => {
  const history = useHistory();
  const { profile, refreshProfile, toast, haptic } = useApp();
  const [pinModal, setPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [defaults, setDefaults] = useState({ city: '', state: '', followUpTime: '10:00', imageQuality: 'Standard', includeImages: '1' });
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setDefaults({
        city: (await securityService.getSetting('default_city')) ?? '',
        state: (await securityService.getSetting('default_state')) ?? '',
        followUpTime: (await securityService.getSetting('default_followup_time')) ?? '10:00',
        imageQuality: (await securityService.getSetting('image_quality')) ?? 'Standard',
        includeImages: (await securityService.getSetting('include_images')) ?? '1',
      });
    })();
  }, []);

  const savePref = async (key: string, value: string) => { await securityService.setSetting(key, value); };

  const togglePin = async (enable: boolean) => {
    if (enable) { setPinModal(true); }
    else {
      await employeeRepo.upsert({ pin_enabled: 0, pin_hash: null });
      await refreshProfile();
      toast('PIN disabled', 'info');
    }
  };

  const confirmPin = async (pin: string) => {
    if (!/^\d{4}$/.test(pin)) { toast('Enter a 4-digit PIN', 'error'); return; }
    const hash = await securityService.hashPin(pin);
    await employeeRepo.upsert({ pin_enabled: 1, pin_hash: hash });
    await refreshProfile();
    setPinModal(false); setNewPin('');
    haptic('success'); toast('PIN enabled', 'success');
  };

  const toggleBiometric = async (enable: boolean) => {
    await employeeRepo.upsert({ biometric_enabled: enable ? 1 : 0 });
    await refreshProfile();
    toast(enable ? 'Biometric unlock enabled' : 'Biometric unlock disabled', 'info');
  };

  const MenuItem: React.FC<{ icon: string; label: string; sub?: string; onClick?: () => void; accent?: string }> = ({ icon, label, sub, onClick, accent = 'var(--atc-primary)' }) => (
    <div className="atc-card atc-card-press" style={{ margin: '0 0 10px', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }} onClick={onClick}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IonIcon icon={icon} style={{ fontSize: 20, color: accent }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div className="atc-muted">{sub}</div>}
      </div>
      <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--atc-text-secondary)' }} />
    </div>
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          <div className="atc-card" style={{ background: '#EFFBF4', display: 'flex', alignItems: 'center', gap: 10 }}>
            <IonIcon icon={cloudOfflineOutline} style={{ color: 'var(--atc-success)', fontSize: 22 }} />
            <div>
              <strong style={{ fontSize: 14 }}>Offline-ready</strong>
              <div className="atc-muted">This app works fully without an internet connection.</div>
            </div>
          </div>

          <div className="atc-section-title">Account</div>
          <MenuItem icon={personCircleOutline} label="Employee profile" sub={profile?.employee_name} onClick={() => history.push('/profile')} />

          <div className="atc-section-title">Security</div>
          <div className="atc-card" style={{ padding: 14 }}>
            <ToggleRow label="Application PIN" checked={!!profile?.pin_enabled} onChange={togglePin} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <IonIcon icon={fingerPrintOutline} style={{ color: 'var(--atc-primary)' }} />
              <div style={{ flex: 1 }}><ToggleRow label="Biometric unlock (if supported)" checked={!!profile?.biometric_enabled} onChange={toggleBiometric} /></div>
            </div>
          </div>

          <div className="atc-section-title">Report & defaults</div>
          <div className="atc-card">
            <div className="atc-spread atc-card-press" onClick={() => setPrefsOpen((o) => !o)} style={{ cursor: 'pointer' }}>
              <strong>Report preferences</strong>
              <IonIcon icon={prefsOpen ? chevronUpOutline : chevronDownOutline} />
            </div>
            {prefsOpen && (
              <div className="atc-fade-in" style={{ marginTop: 12 }}>
                <ToggleRow label="Include images in Excel by default" checked={defaults.includeImages === '1'} onChange={(v) => { setDefaults((d) => ({ ...d, includeImages: v ? '1' : '0' })); savePref('include_images', v ? '1' : '0'); }} />
                <Select label="Image quality" value={defaults.imageQuality} onChange={(v) => { setDefaults((d) => ({ ...d, imageQuality: v })); savePref('image_quality', v); }} options={['Low', 'Standard', 'High']} />
                <TextInput label="Default city" value={defaults.city} onChange={(v) => { setDefaults((d) => ({ ...d, city: v })); savePref('default_city', v); }} />
                <TextInput label="Default state" value={defaults.state} onChange={(v) => { setDefaults((d) => ({ ...d, state: v })); savePref('default_state', v); }} />
                <TextInput label="Default follow-up time" value={defaults.followUpTime} onChange={(v) => { setDefaults((d) => ({ ...d, followUpTime: v })); savePref('default_followup_time', v); }} type="time" />
              </div>
            )}
          </div>

          <div className="atc-section-title">Data</div>
          <MenuItem icon={cloudDownloadOutline} label="Backup & restore" sub="Export or restore a ZIP backup" onClick={() => history.push('/backup')} />
          <MenuItem icon={serverOutline} label="Storage management" sub="Manage images, reports & backups" onClick={() => history.push('/storage')} />

          <div className="atc-section-title">About</div>
          <MenuItem icon={informationCircleOutline} label="About ATC FieldConnect" onClick={() => history.push('/about')} />
          <MenuItem icon={shieldCheckmarkOutline} label="Privacy information" accent="#08783F" onClick={() => toast('All data stays on this device. Nothing is uploaded.', 'info')} />
        </div>
      </IonContent>

      <IonAlert isOpen={pinModal} onDidDismiss={() => { setPinModal(false); setNewPin(''); }}
        header="Set a 4-digit PIN"
        inputs={[{ name: 'pin', type: 'tel', attributes: { maxlength: 4, inputmode: 'numeric' }, placeholder: '••••' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Save', handler: (data) => { confirmPin(data.pin); } },
        ]} />
    </IonPage>
  );
};

export default Settings;
