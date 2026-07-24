import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon,
} from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import { TextInput, Select } from '@/components/forms/fields';
import StoredImage from '@/components/images/StoredImage';
import { DEPARTMENTS } from '@/constants/options';
import { employeeRepo } from '@/services/database/repository';
import { cameraService } from '@/services/camera/cameraService';
import { CameraSource } from '@capacitor/camera';
import { useApp } from '@/hooks/AppContext';
import { isEmail, isPhone } from '@/utils/validation';
import { initials } from '@/utils/format';

const Profile: React.FC = () => {
  const { profile, refreshProfile, toast, haptic } = useApp();
  const [form, setForm] = useState({
    employee_name: '', employee_id: '', mobile_number: '', email: '',
    department: '', designation: '', branch: '', manager_name: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        employee_name: profile.employee_name, employee_id: profile.employee_id,
        mobile_number: profile.mobile_number, email: profile.email, department: profile.department,
        designation: profile.designation, branch: profile.branch, manager_name: profile.manager_name ?? '',
      });
      setPhoto(profile.profile_image_path);
    }
  }, [profile]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const changePhoto = async () => {
    try {
      const img = await cameraService.capture(CameraSource.Photos, 0.7, 600);
      setPhoto(img.path);
    } catch { toast('Could not update photo', 'error'); }
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.employee_name.trim()) e.employee_name = 'Required';
    if (!form.employee_id.trim()) e.employee_id = 'Required';
    if (form.mobile_number && !isPhone(form.mobile_number)) e.mobile_number = 'Invalid mobile number';
    if (form.email && !isEmail(form.email)) e.email = 'Invalid email';
    setErrors(e);
    if (Object.keys(e).length) { haptic('error'); return; }
    await employeeRepo.upsert({ ...form, profile_image_path: photo });
    await refreshProfile();
    haptic('success'); toast('Profile updated', 'success');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/settings" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-gradient" style={{ padding: '28px 18px 44px', textAlign: 'center' }}>
          <div onClick={changePhoto} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
            {photo
              ? <StoredImage path={photo} width={96} height={96} radius={48} />
              : <div style={{ width: 96, height: 96, borderRadius: 48, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 800 }}>{initials(form.employee_name || 'A')}</div>}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IonIcon icon={cameraOutline} style={{ color: 'var(--atc-primary)', fontSize: 16 }} />
            </div>
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 12 }}>{form.employee_name}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{form.designation || form.department}</div>
        </div>

        <div className="atc-page-pad" style={{ marginTop: -22 }}>
          <div className="atc-card">
            <TextInput label="Employee name" required value={form.employee_name} onChange={set('employee_name')} error={errors.employee_name} />
            <TextInput label="Employee ID" required value={form.employee_id} onChange={set('employee_id')} error={errors.employee_id} />
            <TextInput label="Mobile number" value={form.mobile_number} onChange={set('mobile_number')} error={errors.mobile_number} type="tel" inputMode="tel" />
            <TextInput label="Email address" value={form.email} onChange={set('email')} error={errors.email} type="email" inputMode="email" />
            <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} />
            <TextInput label="Designation" value={form.designation} onChange={set('designation')} />
            <TextInput label="Branch or location" value={form.branch} onChange={set('branch')} />
            <TextInput label="Reporting manager" value={form.manager_name} onChange={set('manager_name')} />
          </div>
          <IonButton expand="block" onClick={save} style={{ '--border-radius': '14px', height: 50, fontWeight: 700 }}>Save Changes</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
