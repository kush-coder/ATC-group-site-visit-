import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { cameraOutline, personCircleOutline } from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import { TextInput, Select } from '@/components/forms/fields';
import { StatTile } from '@/components/common/ui';
import { DEPARTMENTS } from '@/constants/options';
import { employeeRepo } from '@/services/database/repository';
import { cameraService } from '@/services/camera/cameraService';
import { CameraSource } from '@capacitor/camera';
import { securityService } from '@/services/security/securityService';
import { useApp } from '@/hooks/AppContext';
import { isEmail, isPhone } from '@/utils/validation';
import StoredImage from '@/components/images/StoredImage';

const EmployeeSetup: React.FC = () => {
  const history = useHistory();
  const { refreshProfile, toast, haptic } = useApp();
  const [form, setForm] = useState({
    employee_name: '', employee_id: '', mobile_number: '', email: '',
    department: '', designation: '', branch: '', manager_name: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const capturePhoto = async () => {
    try {
      const img = await cameraService.capture(CameraSource.Photos, 0.7, 600);
      setPhoto(img.path);
      haptic('light');
    } catch {
      toast('Could not add photo', 'error');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.employee_name.trim()) e.employee_name = 'Employee name is required';
    if (!form.employee_id.trim()) e.employee_id = 'Employee ID is required';
    if (form.mobile_number && !isPhone(form.mobile_number)) e.mobile_number = 'Enter a valid mobile number';
    if (form.email && !isEmail(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) { haptic('error'); return; }
    setSaving(true);
    try {
      await employeeRepo.upsert({ ...form, profile_image_path: photo, pin_enabled: 0, biometric_enabled: 0 });
      await securityService.markActive();
      await refreshProfile();
      haptic('success');
      toast('Welcome to ATC FieldConnect', 'success');
      history.replace('/dashboard');
    } catch {
      toast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="atc-gradient" style={{ padding: '40px 20px 28px', textAlign: 'center' }}>
          <AtcLogo size={64} variant="white" />
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginTop: 16, marginBottom: 4 }}>Let's set you up</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: 0 }}>Your details stay securely on this device</p>
        </div>

        <div className="atc-page-pad" style={{ marginTop: -14 }}>
          <div className="atc-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <div onClick={capturePhoto} style={{ position: 'relative', cursor: 'pointer' }}>
                {photo
                  ? <StoredImage path={photo} width={92} height={92} radius={46} />
                  : <div style={{ width: 92, height: 92, borderRadius: 46, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={personCircleOutline} style={{ fontSize: 54, color: 'var(--atc-primary)' }} />
                    </div>}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, background: 'var(--atc-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                  <IonIcon icon={cameraOutline} style={{ color: '#fff', fontSize: 15 }} />
                </div>
              </div>
            </div>
            <p className="atc-muted" style={{ textAlign: 'center', marginBottom: 16 }}>Optional employee photo</p>

            <TextInput label="Employee name" required value={form.employee_name} onChange={set('employee_name')} error={errors.employee_name} placeholder="e.g. Rahul Sharma" />
            <TextInput label="Employee ID" required value={form.employee_id} onChange={set('employee_id')} error={errors.employee_id} placeholder="e.g. ATC-EMP-001" />
            <TextInput label="Mobile number" value={form.mobile_number} onChange={set('mobile_number')} error={errors.mobile_number} type="tel" inputMode="tel" />
            <TextInput label="Email address" value={form.email} onChange={set('email')} error={errors.email} type="email" inputMode="email" />
            <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} />
            <TextInput label="Designation" value={form.designation} onChange={set('designation')} placeholder="e.g. Field Sales Executive" />
            <TextInput label="Branch or location" value={form.branch} onChange={set('branch')} placeholder="e.g. Ahmedabad" />
            <TextInput label="Reporting manager" value={form.manager_name} onChange={set('manager_name')} placeholder="Optional" />
          </div>

          <IonButton expand="block" onClick={save} disabled={saving} style={{ '--border-radius': '14px', height: 52, fontWeight: 700, marginTop: 4 }}>
            {saving ? 'Saving…' : 'Get Started'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EmployeeSetup;
