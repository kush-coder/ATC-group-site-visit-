import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonAlert, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  locationOutline, checkmarkCircle, saveOutline, arrowForwardOutline, arrowBackOutline,
  navigateOutline,
} from 'ionicons/icons';
import { TextInput, TextArea, Select, PillSelect, PillMultiSelect, ToggleRow } from '@/components/forms/fields';
import { LeadScoreMeter } from '@/components/common/ui';
import ImageStep from './ImageStep';
import {
  SystemsEditor, PrintersEditor, ConsumablesEditor, PrinterOppEditor,
  SoftwareOppEditor, MobileAppOppEditor, FollowUpEditor,
} from './subEditors';
import { emptyForm, formFromBundle, VisitFormState } from './formState';
import {
  VISIT_TYPES, CLIENT_CATEGORIES, INQUIRY_CATEGORIES, URGENCY_LEVELS, YES_NO_CONFIRM,
  OPPORTUNITY_STATUS, SOFTWARE_OPPORTUNITY_STATUS, LEAD_RATINGS, BUSINESS_POTENTIALS,
  PRIORITIES, FOLLOW_UP_MODES,
} from '@/constants/options';
import { useApp } from '@/hooks/AppContext';
import {
  visitRepo, childRepo, imageRepo, generateVisitNumber, getVisitBundle,
} from '@/services/database/repository';
import { draftService } from '@/services/draft/draftService';
import { geoService } from '@/services/geolocation/geoService';
import { notificationService } from '@/services/notifications/notificationService';
import { validateVisitForSubmit } from '@/utils/validation';
import { formatCurrency } from '@/utils/format';
import type { ClientVisit } from '@/types/models';

const STEPS = [
  'Visit', 'Photos', 'Client', 'Location', 'Systems', 'Printers',
  'Inquiry', 'Opportunities', 'Lead', 'Follow-up', 'Review',
];

const NewVisit: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const { profile, toast, haptic } = useApp();
  const [form, setForm] = useState<VisitFormState>(emptyForm());
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cancelAlert, setCancelAlert] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const loadedRef = useRef(false);

  const editMode = !!id;

  useIonViewWillEnter(() => { init(); });

  const init = async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (id) {
      const bundle = await getVisitBundle(Number(id));
      if (bundle) {
        setForm(formFromBundle(bundle));
        return;
      }
    }
    // Attempt draft restore for new visits
    const draft = await draftService.load<VisitFormState>();
    if (draft?.state) {
      const f = emptyForm();
      setForm({ ...f, ...draft.state, visit: { ...f.visit, ...draft.state.visit } });
      toast('Draft restored', 'info');
    } else {
      const f = emptyForm();
      f.visit.employee_id = profile?.employee_id ?? '';
      f.visit.employee_name = profile?.employee_name ?? '';
      setForm(f);
    }
  };

  useEffect(() => {
    if (!profile) return;
    setForm((f) => (f.visit.employee_id ? f : { ...f, visit: { ...f.visit, employee_id: profile.employee_id, employee_name: profile.employee_name } }));
  }, [profile]);

  const setVisit = (patch: Partial<ClientVisit>) => setForm((f) => ({ ...f, visit: { ...f.visit, ...patch } }));
  const vf = form.visit;

  // Auto-save draft after each step change (new visits only)
  const autosave = async (next: VisitFormState) => {
    if (editMode) return;
    await draftService.save(next);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1500);
  };

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      await autosave(form);
      document.querySelector('ion-content')?.scrollToTop(250);
      haptic('light');
    }
  };
  const goPrev = () => { if (step > 0) { setStep(step - 1); document.querySelector('ion-content')?.scrollToTop(250); } };

  const captureGps = async () => {
    setGpsBusy(true);
    try {
      const r = await geoService.current();
      setVisit({ latitude: r.latitude, longitude: r.longitude, location_accuracy: r.accuracy, location_time: r.time });
      haptic('success');
      toast('Location captured', 'success');
    } catch {
      toast('GPS unavailable or permission denied', 'warning');
    } finally {
      setGpsBusy(false);
    }
  };

  const persist = async (status: 'draft' | 'submitted'): Promise<number | null> => {
    setSaving(true);
    try {
      let visitId = form.editingId;
      const visitData: Partial<ClientVisit> = {
        ...vf,
        status,
        employee_id: profile?.employee_id ?? vf.employee_id,
        employee_name: profile?.employee_name ?? vf.employee_name,
        follow_up_required: form.followUps.length > 0 || vf.follow_up_required ? 1 : 0,
      };
      // Mirror first follow-up onto the visit row for quick access
      if (form.followUps[0]) {
        visitData.follow_up_date = form.followUps[0].follow_up_date ?? '';
        visitData.follow_up_time = form.followUps[0].follow_up_time ?? '';
        visitData.follow_up_mode = form.followUps[0].follow_up_mode ?? '';
      }

      if (visitId) {
        await visitRepo.update(visitId, visitData);
      } else {
        visitData.visit_number = await generateVisitNumber(new Date(vf.visit_date || new Date().toISOString()));
        visitId = await visitRepo.create(visitData);
      }

      // Images: rewrite the set for this visit
      const existing = await imageRepo.forVisit(visitId);
      for (const ex of existing) if (ex.id) await imageRepo.delete(ex.id);
      for (const img of form.images) {
        await imageRepo.add({
          visit_id: visitId, image_path: img.image_path, image_type: img.image_type,
          is_primary: img.is_primary ? 1 : 0, caption: img.caption, created_at: new Date().toISOString(),
        });
      }

      await childRepo.replaceInquiries(visitId, form.inquiryCategories.map((c) => ({ visit_id: visitId!, category_name: c })));
      await childRepo.replaceSystems(visitId, form.systems.map((s) => ({ ...s, visit_id: visitId! } as any)));
      await childRepo.replacePrinters(visitId, form.printers.map((p) => ({ ...p, visit_id: visitId! } as any)));
      await childRepo.replaceConsumables(visitId, form.consumables.map((c) => ({ ...c, visit_id: visitId! } as any)));
      await childRepo.replacePrinterOpps(visitId, form.printerOpportunities.map((p) => ({ ...p, visit_id: visitId! } as any)));
      await childRepo.replaceSoftware(visitId, form.softwareOpportunities.map((s) => ({ ...s, visit_id: visitId! } as any)));
      await childRepo.replaceMobileApps(visitId, form.mobileAppOpportunities.map((m) => ({ ...m, visit_id: visitId! } as any)));
      await childRepo.replaceFollowUps(visitId, form.followUps.map((f) => ({ ...f, visit_id: visitId! } as any)));

      // Schedule the first follow-up reminder
      if (form.followUps[0]?.follow_up_date) {
        await notificationService.scheduleFollowUp({
          id: visitId, title: `Follow-up: ${vf.client_name}`,
          body: form.followUps[0].follow_up_purpose || 'Client follow-up due',
          date: form.followUps[0].follow_up_date!, time: form.followUps[0].follow_up_time || '09:00',
        });
      }
      return visitId;
    } catch (e) {
      console.error(e);
      toast('Could not save visit', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    const vid = await persist('draft');
    if (vid) { haptic('success'); toast('Saved as draft', 'success'); if (!editMode) await draftService.clear(); history.replace('/dashboard'); }
  };

  const submit = async () => {
    const errs = validateVisitForSubmit({
      visit_date: vf.visit_date ?? '', visit_time: vf.visit_time ?? '', client_name: vf.client_name ?? '',
      business_name: vf.business_name ?? '', full_address: vf.full_address ?? '', inquiry_description: vf.inquiry_description ?? '',
      lead_rating: vf.lead_rating ?? '', meeting_summary: vf.meeting_summary ?? '', email_address: vf.email_address ?? '',
      mobile_number: vf.mobile_number ?? '', whatsapp_number: vf.whatsapp_number ?? '',
      follow_up_required: vf.follow_up_required ?? 0, follow_up_date: vf.follow_up_date ?? '',
      budget_amount: vf.budget_amount ?? null, estimated_business_value: vf.estimated_business_value ?? null,
      hasImage: form.images.length > 0, hasInquiryCategory: form.inquiryCategories.length > 0,
    });
    if (errs.length) {
      const map: Record<string, string> = {};
      errs.forEach((e) => (map[e.field] = e.message));
      setErrors(map);
      haptic('error');
      toast(errs[0].message, 'error');
      // jump to earliest relevant step
      const stepForField: Record<string, number> = { visit_date: 0, visit_time: 0, image: 1, inquiry_category: 6, client_name: 2, business_name: 2, full_address: 2, email_address: 2, mobile_number: 2, whatsapp_number: 2, inquiry_description: 6, lead_rating: 8, meeting_summary: 10, follow_up_date: 9, budget_amount: 6, estimated_business_value: 8 };
      const target = Math.min(...errs.map((e) => stepForField[e.field] ?? 10));
      setStep(target);
      return;
    }
    const vid = await persist('submitted');
    if (vid) {
      haptic('success');
      if (!editMode) await draftService.clear();
      toast('Visit submitted successfully', 'success');
      history.replace(`/visit/${vid}`);
    }
  };

  const toggleInquiry = (c: string) =>
    setForm((f) => ({ ...f, inquiryCategories: f.inquiryCategories.includes(c) ? f.inquiryCategories.filter((x) => x !== c) : [...f.inquiryCategories, c] }));

  const summary = useMemo(() => ({
    images: form.images.length, systems: form.systems.length, printers: form.printers.length,
    inquiries: form.inquiryCategories.length,
    opps: form.consumables.length + form.printerOpportunities.length + form.softwareOpportunities.length + form.mobileAppOpportunities.length,
    followUps: form.followUps.length,
  }), [form]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>{editMode ? 'Edit Visit' : 'New Visit'}</IonTitle>
          <IonButtons slot="end">
            {savedTick && <span className="atc-chip" style={{ marginRight: 8 }}><IonIcon icon={checkmarkCircle} /> Saved</span>}
          </IonButtons>
        </IonToolbar>
        {/* Step indicator */}
        <div style={{ padding: '8px 12px 12px', background: '#fff' }}>
          <div className="atc-spread" style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
            <span className="atc-muted">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="atc-meter"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        </div>
      </IonHeader>

      <IonContent>
        <div className="atc-page-pad atc-fade-in" key={step}>
          {step === 0 && (<>
            <TextInput label="Visit date" required value={vf.visit_date ?? ''} onChange={(v) => setVisit({ visit_date: v })} type="date" error={errors.visit_date} />
            <TextInput label="Visit time" required value={vf.visit_time ?? ''} onChange={(v) => setVisit({ visit_time: v })} type="time" error={errors.visit_time} />
            <TextInput label="Employee name" value={vf.employee_name ?? ''} onChange={(v) => setVisit({ employee_name: v })} />
            <TextInput label="Employee ID" value={vf.employee_id ?? ''} onChange={(v) => setVisit({ employee_id: v })} />
            <PillSelect label="Visit type" value={vf.visit_type ?? ''} onChange={(v) => setVisit({ visit_type: v })} options={VISIT_TYPES} />
          </>)}

          {step === 1 && (
            <div data-field="image">
              <ImageStep images={form.images} onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))} />
              {errors.image && <div className="atc-field-error">{errors.image}</div>}
            </div>
          )}

          {step === 2 && (<>
            <TextInput label="Client name" required value={vf.client_name ?? ''} onChange={(v) => setVisit({ client_name: v })} error={errors.client_name} />
            <TextInput label="Business / shop name" required value={vf.business_name ?? ''} onChange={(v) => setVisit({ business_name: v })} error={errors.business_name} />
            <TextInput label="Contact person" value={vf.contact_person ?? ''} onChange={(v) => setVisit({ contact_person: v })} />
            <TextInput label="Designation" value={vf.designation ?? ''} onChange={(v) => setVisit({ designation: v })} />
            <TextInput label="Primary mobile number" value={vf.mobile_number ?? ''} onChange={(v) => setVisit({ mobile_number: v })} type="tel" inputMode="tel" error={errors.mobile_number} />
            <TextInput label="WhatsApp number" value={vf.whatsapp_number ?? ''} onChange={(v) => setVisit({ whatsapp_number: v })} type="tel" inputMode="tel" error={errors.whatsapp_number} />
            <TextInput label="Email address" value={vf.email_address ?? ''} onChange={(v) => setVisit({ email_address: v })} type="email" inputMode="email" error={errors.email_address} />
            <TextInput label="Alternate phone number" value={vf.alternate_number ?? ''} onChange={(v) => setVisit({ alternate_number: v })} type="tel" inputMode="tel" />
            <TextArea label="Full address" required value={vf.full_address ?? ''} onChange={(v) => setVisit({ full_address: v })} error={errors.full_address} />
            <TextInput label="Area / locality" value={vf.area ?? ''} onChange={(v) => setVisit({ area: v })} />
            <TextInput label="City" value={vf.city ?? ''} onChange={(v) => setVisit({ city: v })} />
            <TextInput label="State" value={vf.state ?? ''} onChange={(v) => setVisit({ state: v })} />
            <TextInput label="PIN code" value={vf.pin_code ?? ''} onChange={(v) => setVisit({ pin_code: v })} inputMode="numeric" />
            <TextInput label="Landmark" value={vf.landmark ?? ''} onChange={(v) => setVisit({ landmark: v })} />
            <TextInput label="Website" value={vf.website ?? ''} onChange={(v) => setVisit({ website: v })} />
            <Select label="Client category" value={vf.client_category ?? ''} onChange={(v) => setVisit({ client_category: v })} options={CLIENT_CATEGORIES} />
          </>)}

          {step === 3 && (<>
            <div className="atc-card" style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={locationOutline} style={{ fontSize: 28, color: 'var(--atc-primary)' }} />
              </div>
              <div style={{ fontWeight: 700 }}>Capture GPS location</div>
              <div className="atc-muted" style={{ margin: '4px 0 14px' }}>Optional · coordinates saved offline, no map needed</div>
              <IonButton onClick={captureGps} disabled={gpsBusy} style={{ '--border-radius': '12px' }}>
                <IonIcon slot="start" icon={navigateOutline} /> {gpsBusy ? 'Locating…' : 'Capture Current Location'}
              </IonButton>
            </div>
            {vf.latitude != null && (
              <div className="atc-card atc-slide-up" style={{ borderColor: 'var(--atc-primary)' }}>
                <div className="atc-spread"><span className="atc-muted">Latitude</span><strong>{vf.latitude?.toFixed(6)}</strong></div>
                <div className="atc-spread" style={{ marginTop: 8 }}><span className="atc-muted">Longitude</span><strong>{vf.longitude?.toFixed(6)}</strong></div>
                <div className="atc-spread" style={{ marginTop: 8 }}><span className="atc-muted">Accuracy</span><strong>{vf.location_accuracy?.toFixed(0)} m</strong></div>
              </div>
            )}
          </>)}

          {step === 4 && (<>
            <PillSelect label="Is the client using any software or system?" value={vf.existing_system_status ?? ''} onChange={(v) => setVisit({ existing_system_status: v as any })} options={YES_NO_CONFIRM} />
            {vf.existing_system_status === 'Yes' && (
              <SystemsEditor items={form.systems} onChange={(v) => setForm((f) => ({ ...f, systems: v }))} />
            )}
          </>)}

          {step === 5 && (<>
            <PillSelect label="Does the client use any printer or hardware?" value={vf.printer_status ?? ''} onChange={(v) => setVisit({ printer_status: v as any })} options={YES_NO_CONFIRM} />
            {vf.printer_status === 'Yes' && (
              <PrintersEditor items={form.printers} onChange={(v) => setForm((f) => ({ ...f, printers: v }))} />
            )}
          </>)}

          {step === 6 && (<>
            <div data-field="inquiry_category">
              <PillMultiSelect label="Inquiry category" required values={form.inquiryCategories} onToggle={toggleInquiry} options={INQUIRY_CATEGORIES} error={errors.inquiry_category} />
            </div>
            <TextInput label="Inquiry title" value={vf.inquiry_title ?? ''} onChange={(v) => setVisit({ inquiry_title: v })} />
            <TextArea label="Detailed inquiry description" required value={vf.inquiry_description ?? ''} onChange={(v) => setVisit({ inquiry_description: v })} error={errors.inquiry_description} />
            <TextInput label="Client requirement" value={vf.client_requirement ?? ''} onChange={(v) => setVisit({ client_requirement: v })} />
            <TextInput label="Expected quantity" value={vf.expected_quantity ?? ''} onChange={(v) => setVisit({ expected_quantity: v })} inputMode="numeric" />
            <TextInput label="Expected timeline" value={vf.expected_timeline ?? ''} onChange={(v) => setVisit({ expected_timeline: v })} />
            <PillSelect label="Urgency" value={vf.urgency ?? ''} onChange={(v) => setVisit({ urgency: v as any })} options={URGENCY_LEVELS} />
            <ToggleRow label="Budget available" checked={!!vf.budget_available} onChange={(v) => setVisit({ budget_available: v ? 1 : 0 })} />
            {!!vf.budget_available && (
              <TextInput label="Budget amount" value={vf.budget_amount != null ? String(vf.budget_amount) : ''} onChange={(v) => setVisit({ budget_amount: v ? Math.max(0, Number(v)) : null })} type="number" inputMode="numeric" error={errors.budget_amount} />
            )}
            <TextInput label="Decision-maker name" value={vf.decision_maker ?? ''} onChange={(v) => setVisit({ decision_maker: v })} />
            <TextInput label="Competitor information" value={vf.competitor_info ?? ''} onChange={(v) => setVisit({ competitor_info: v })} />
            <ToggleRow label="Quotation required" checked={!!vf.quotation_required} onChange={(v) => setVisit({ quotation_required: v ? 1 : 0 })} />
            <ToggleRow label="Demo required" checked={!!vf.demo_required} onChange={(v) => setVisit({ demo_required: v ? 1 : 0 })} />
            <ToggleRow label="Technical visit required" checked={!!vf.technical_visit_required} onChange={(v) => setVisit({ technical_visit_required: v ? 1 : 0 })} />
          </>)}

          {step === 7 && (<>
            <div className="atc-section-title" style={{ marginTop: 0 }}>Consumable scope</div>
            <PillSelect label="Opportunity to sell consumables?" value={vf.consumable_scope ?? ''} onChange={(v) => setVisit({ consumable_scope: v })} options={OPPORTUNITY_STATUS} />
            {(vf.consumable_scope === 'Yes' || vf.consumable_scope === 'Maybe') && (
              <ConsumablesEditor items={form.consumables} onChange={(v) => setForm((f) => ({ ...f, consumables: v }))} />
            )}
            <div className="atc-section-title">Printer scope</div>
            <PillSelect label="Opportunity to sell a printer?" value={vf.printer_scope ?? ''} onChange={(v) => setVisit({ printer_scope: v })} options={OPPORTUNITY_STATUS} />
            {(vf.printer_scope === 'Yes' || vf.printer_scope === 'Maybe') && (
              <PrinterOppEditor items={form.printerOpportunities} onChange={(v) => setForm((f) => ({ ...f, printerOpportunities: v }))} />
            )}
            <div className="atc-section-title">Customized software scope</div>
            <PillSelect label="Needs customized software?" value={vf.software_scope ?? ''} onChange={(v) => setVisit({ software_scope: v })} options={SOFTWARE_OPPORTUNITY_STATUS} />
            {(vf.software_scope === 'Yes' || vf.software_scope === 'Maybe' || vf.software_scope === 'Need requirement discussion') && (
              <SoftwareOppEditor items={form.softwareOpportunities} onChange={(v) => setForm((f) => ({ ...f, softwareOpportunities: v }))} />
            )}
            <div className="atc-section-title">Mobile application scope</div>
            <PillSelect label="Needs a mobile application?" value={vf.mobile_app_scope ?? ''} onChange={(v) => setVisit({ mobile_app_scope: v })} options={SOFTWARE_OPPORTUNITY_STATUS} />
            {(vf.mobile_app_scope === 'Yes' || vf.mobile_app_scope === 'Maybe' || vf.mobile_app_scope === 'Need requirement discussion') && (
              <MobileAppOppEditor items={form.mobileAppOpportunities} onChange={(v) => setForm((f) => ({ ...f, mobileAppOpportunities: v }))} />
            )}
            <div className="atc-section-title">Web application scope</div>
            <PillSelect label="Needs a web application / portal?" value={vf.web_app_scope ?? ''} onChange={(v) => setVisit({ web_app_scope: v })} options={SOFTWARE_OPPORTUNITY_STATUS} />
          </>)}

          {step === 8 && (<>
            <PillSelect label="Opportunity rating" required value={vf.lead_rating ?? ''} onChange={(v) => setVisit({ lead_rating: v as any })} options={LEAD_RATINGS} error={errors.lead_rating} />
            <div className="atc-card">
              <LeadScoreMeter score={vf.lead_score ?? 5} />
              <input type="range" min={1} max={10} value={vf.lead_score ?? 5} onChange={(e) => setVisit({ lead_score: Number(e.target.value) })} style={{ width: '100%', marginTop: 14, accentColor: 'var(--atc-primary)' }} />
            </div>
            <PillSelect label="Business potential" value={vf.business_potential ?? ''} onChange={(v) => setVisit({ business_potential: v as any })} options={BUSINESS_POTENTIALS} />
            <div className="atc-field">
              <label className="atc-field-label">Probability: {vf.probability}%</label>
              <input type="range" min={0} max={100} step={5} value={vf.probability ?? 50} onChange={(e) => setVisit({ probability: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--atc-primary)' }} />
            </div>
            <TextInput label="Estimated business value" value={vf.estimated_business_value != null ? String(vf.estimated_business_value) : ''} onChange={(v) => setVisit({ estimated_business_value: v ? Math.max(0, Number(v)) : null })} type="number" inputMode="numeric" error={errors.estimated_business_value} />
            <PillSelect label="Priority" value={vf.priority ?? ''} onChange={(v) => setVisit({ priority: v as any })} options={PRIORITIES} />
            <TextInput label="Expected closure date" value={vf.expected_closure_date ?? ''} onChange={(v) => setVisit({ expected_closure_date: v })} type="date" />
            <ToggleRow label="Management attention required" checked={!!vf.management_attention} onChange={(v) => setVisit({ management_attention: v ? 1 : 0 })} />
          </>)}

          {step === 9 && (<>
            <ToggleRow label="Follow-up required" checked={!!vf.follow_up_required} onChange={(v) => setVisit({ follow_up_required: v ? 1 : 0 })} />
            {!!vf.follow_up_required && (
              <div style={{ marginTop: 12 }}>
                <FollowUpEditor items={form.followUps} onChange={(v) => setForm((f) => ({ ...f, followUps: v }))} employeeName={profile?.employee_name ?? ''} />
                {errors.follow_up_date && <div className="atc-field-error">{errors.follow_up_date}</div>}
                <div className="atc-muted" style={{ marginTop: 8 }}>A local reminder is scheduled for the first follow-up where supported.</div>
              </div>
            )}
          </>)}

          {step === 10 && (<>
            <TextArea label="Meeting summary" required value={vf.meeting_summary ?? ''} onChange={(v) => setVisit({ meeting_summary: v })} error={errors.meeting_summary} />
            <TextInput label="Client response" value={vf.client_response ?? ''} onChange={(v) => setVisit({ client_response: v })} />
            <TextArea label="Employee observation" value={vf.employee_observation ?? ''} onChange={(v) => setVisit({ employee_observation: v })} />
            <TextInput label="Challenges identified" value={vf.challenges_identified ?? ''} onChange={(v) => setVisit({ challenges_identified: v })} />
            <TextArea label="Recommended solution" value={vf.recommended_solution ?? ''} onChange={(v) => setVisit({ recommended_solution: v })} />
            <TextInput label="Next action" value={vf.next_action ?? ''} onChange={(v) => setVisit({ next_action: v })} />
            <TextArea label="Additional comments" value={vf.additional_comments ?? ''} onChange={(v) => setVisit({ additional_comments: v })} />

            <div className="atc-card" style={{ background: 'var(--atc-soft-bg)' }}>
              <ToggleRow label="Client details verified" checked={form.confirmations.clientVerified} onChange={(v) => setForm((f) => ({ ...f, confirmations: { ...f.confirmations, clientVerified: v } }))} />
              <ToggleRow label="Inquiry details verified" checked={form.confirmations.inquiryVerified} onChange={(v) => setForm((f) => ({ ...f, confirmations: { ...f.confirmations, inquiryVerified: v } }))} />
              <ToggleRow label="Images attached" checked={form.confirmations.imagesAttached} onChange={(v) => setForm((f) => ({ ...f, confirmations: { ...f.confirmations, imagesAttached: v } }))} />
              <ToggleRow label="Follow-up information checked" checked={form.confirmations.followUpChecked} onChange={(v) => setForm((f) => ({ ...f, confirmations: { ...f.confirmations, followUpChecked: v } }))} />
            </div>

            <div className="atc-card atc-gradient">
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Visit Summary</div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Client</span><strong>{vf.client_name || '—'}</strong></div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Photos</span><strong>{summary.images}</strong></div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Inquiry categories</span><strong>{summary.inquiries}</strong></div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Opportunities</span><strong>{summary.opps}</strong></div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Lead rating</span><strong>{vf.lead_rating || '—'}</strong></div>
              <div className="atc-spread" style={{ padding: '4px 0' }}><span>Estimated value</span><strong>{formatCurrency(vf.estimated_business_value ?? 0)}</strong></div>
            </div>
          </>)}
        </div>
      </IonContent>

      {/* Sticky actions */}
      <div className="atc-sticky-actions">
        {step > 0 && (
          <IonButton fill="outline" onClick={goPrev} style={{ '--border-radius': '12px', flex: '0 0 auto' }}>
            <IonIcon slot="icon-only" icon={arrowBackOutline} />
          </IonButton>
        )}
        <IonButton fill="clear" onClick={saveDraft} disabled={saving} style={{ flex: '0 0 auto', fontWeight: 600 }}>
          <IonIcon slot="start" icon={saveOutline} /> Draft
        </IonButton>
        {step < STEPS.length - 1 ? (
          <IonButton onClick={goNext} style={{ '--border-radius': '12px', flex: 1, fontWeight: 700 }}>
            Next <IonIcon slot="end" icon={arrowForwardOutline} />
          </IonButton>
        ) : (
          <IonButton color="success" onClick={submit} disabled={saving} style={{ '--border-radius': '12px', flex: 1, fontWeight: 700 }}>
            <IonIcon slot="start" icon={checkmarkCircle} /> Submit Visit
          </IonButton>
        )}
      </div>

      <IonAlert
        isOpen={cancelAlert}
        onDidDismiss={() => setCancelAlert(false)}
        header="Leave this visit?"
        message="Your progress is auto-saved as a draft."
        buttons={[
          { text: 'Keep editing', role: 'cancel' },
          { text: 'Leave', role: 'destructive', handler: () => history.replace('/dashboard') },
        ]}
      />
    </IonPage>
  );
};

export default NewVisit;
