import React, { useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, IonAlert, IonActionSheet, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  callOutline, logoWhatsapp, mailOutline, mapOutline, createOutline, trashOutline,
  copyOutline, documentTextOutline, ellipsisVertical, shareSocialOutline, locationOutline,
  personOutline, hardwareChipOutline, printOutline, bulbOutline, calendarOutline,
} from 'ionicons/icons';
import StoredImage from '@/components/images/StoredImage';
import { SectionCard, LeadScoreMeter, ProgressOverlay } from '@/components/common/ui';
import { getVisitBundle, visitRepo, imageRepo, generateVisitNumber, childRepo } from '@/services/database/repository';
import { fileService } from '@/services/filesystem/fileService';
import { generateDayEndReport } from '@/services/excel/excelService';
import { shareService } from '@/services/share/shareService';
import { useApp } from '@/hooks/AppContext';
import { formatCurrency, formatDate, leadColorClass } from '@/utils/format';
import type { VisitBundle } from '@/types/models';
import { Capacitor } from '@capacitor/core';

const Row: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) =>
  value !== undefined && value !== null && value !== '' ? (
    <div className="atc-spread" style={{ padding: '7px 0', borderBottom: '1px solid var(--atc-border)' }}>
      <span className="atc-muted" style={{ flex: '0 0 46%' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', flex: 1 }}>{value}</span>
    </div>
  ) : null;

const VisitDetails: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const { profile, toast, haptic } = useApp();
  const [bundle, setBundle] = useState<VisitBundle | null>(null);
  const [gallerySrc, setGallerySrc] = useState<string[]>([]);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [progress, setProgress] = useState({ visible: false, pct: 0, label: '' });

  const load = useCallback(async () => {
    const b = await getVisitBundle(Number(id));
    setBundle(b);
  }, [id]);
  useIonViewWillEnter(() => { load(); });

  if (!bundle) {
    return (
      <IonPage><IonContent><div className="atc-page-pad"><div className="atc-skeleton" style={{ height: 200 }} /></div></IonContent></IonPage>
    );
  }
  const v = bundle.visit;

  const call = () => v.mobile_number && (window.location.href = `tel:${v.mobile_number}`);
  const whatsapp = () => {
    const num = (v.whatsapp_number || v.mobile_number || '').replace(/\D/g, '');
    if (num) window.open(`https://wa.me/${num}`, '_system');
  };
  const email = () => v.email_address && (window.location.href = `mailto:${v.email_address}`);
  const maps = () => v.latitude != null && window.open(`https://www.google.com/maps?q=${v.latitude},${v.longitude}`, '_system');

  const duplicate = async () => {
    const num = await generateVisitNumber();
    const { id: _omit, ...rest } = v;
    const newId = await visitRepo.create({ ...rest, visit_number: num, status: 'draft' });
    for (const im of bundle.images) await imageRepo.add({ ...im, id: undefined, visit_id: newId } as any);
    await childRepo.replaceInquiries(newId, bundle.inquiryCategories.map((c) => ({ visit_id: newId, category_name: c.category_name })));
    haptic('success'); toast('Visit duplicated as draft', 'success');
    history.replace(`/visit/edit/${newId}`);
  };

  const doDelete = async () => {
    for (const im of bundle.images) await fileService.deleteFile(im.image_path);
    await visitRepo.delete(Number(id));
    haptic('success'); toast('Visit deleted', 'success');
    history.replace('/dashboard');
  };

  const generateIndividualReport = async () => {
    setProgress({ visible: true, pct: 0, label: 'Generating report' });
    try {
      const { base64, fileName } = await generateDayEndReport([bundle], profile!, v.visit_date, {
        includeImages: true,
        onProgress: (pct, label) => setProgress({ visible: true, pct, label }),
      });
      if (Capacitor.getPlatform() === 'web') {
        shareService.downloadBase64(base64, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        toast('Report downloaded', 'success');
      } else {
        const { uri } = await fileService.saveReport(base64, fileName);
        await shareService.shareFile(uri, fileName, `ATC FieldConnect report — ${v.client_name}`);
      }
      haptic('success');
    } catch (e) {
      toast('Report generation failed', 'error');
    } finally {
      setProgress({ visible: false, pct: 0, label: '' });
    }
  };

  const shareSummary = async () => {
    const text = `ATC FieldConnect Visit\n${v.visit_number}\nClient: ${v.client_name}\nBusiness: ${v.business_name}\nInquiry: ${v.inquiry_description}\nLead: ${v.lead_rating} (${v.lead_score}/10)\nEst. value: ${formatCurrency(v.estimated_business_value ?? 0)}`;
    await shareService.shareText('Visit summary', text);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Visit Details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setSheet(true)}><IonIcon slot="icon-only" icon={ellipsisVertical} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Photo gallery */}
        <div style={{ padding: 16 }}>
          {bundle.images.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {bundle.images.map((im) => (
                <div key={im.id} style={{ flex: '0 0 auto', width: 180, position: 'relative' }}>
                  <StoredImage path={im.image_path} width={180} height={180} radius={16} />
                  {!!im.is_primary && <span className="atc-chip" style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px' }}>Primary</span>}
                  <div className="atc-muted" style={{ marginTop: 4, fontSize: 11 }}>{im.image_type}{im.caption ? ` · ${im.caption}` : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="atc-card" style={{ textAlign: 'center', color: 'var(--atc-text-secondary)' }}>No images</div>
          )}
        </div>

        <div className="atc-page-pad" style={{ paddingTop: 0 }}>
          {/* Header card */}
          <div className="atc-card atc-gradient">
            <div className="atc-spread">
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{v.client_name}</div>
                <div style={{ opacity: 0.9 }}>{v.business_name}</div>
              </div>
              <span className={`atc-chip ${v.status}`} style={{ background: 'rgba(255,255,255,0.9)' }}>{v.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {v.lead_rating && <span className="atc-chip" style={{ background: 'rgba(255,255,255,0.9)' }}>{v.lead_rating}</span>}
              {v.client_category && <span className="atc-chip" style={{ background: 'rgba(255,255,255,0.9)' }}>{v.client_category}</span>}
              {!!v.follow_up_required && <span className="atc-chip warn">Follow-up</span>}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>{v.visit_number} · {formatDate(v.visit_date)} {v.visit_time}</div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { icon: callOutline, label: 'Call', fn: call, on: !!v.mobile_number },
              { icon: logoWhatsapp, label: 'WhatsApp', fn: whatsapp, on: !!(v.whatsapp_number || v.mobile_number) },
              { icon: mailOutline, label: 'Email', fn: email, on: !!v.email_address },
              { icon: mapOutline, label: 'Maps', fn: maps, on: v.latitude != null },
            ].map((a) => (
              <button key={a.label} onClick={a.fn} disabled={!a.on} className="atc-card atc-card-press" style={{ margin: 0, padding: 12, textAlign: 'center', opacity: a.on ? 1 : 0.4, border: 'none' }}>
                <IonIcon icon={a.icon} style={{ fontSize: 22, color: 'var(--atc-primary)' }} />
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>{a.label}</div>
              </button>
            ))}
          </div>

          <SectionCard title="Client details" icon={personOutline}>
            <Row label="Contact person" value={v.contact_person} />
            <Row label="Designation" value={v.designation} />
            <Row label="Mobile" value={v.mobile_number} />
            <Row label="WhatsApp" value={v.whatsapp_number} />
            <Row label="Email" value={v.email_address} />
            <Row label="Address" value={v.full_address} />
            <Row label="City" value={v.city} />
            <Row label="State" value={v.state} />
            <Row label="PIN code" value={v.pin_code} />
          </SectionCard>

          {v.latitude != null && (
            <SectionCard title="Location" icon={locationOutline}>
              <Row label="Latitude" value={v.latitude?.toFixed(6)} />
              <Row label="Longitude" value={v.longitude?.toFixed(6)} />
              <Row label="Accuracy" value={v.location_accuracy ? `${v.location_accuracy.toFixed(0)} m` : ''} />
            </SectionCard>
          )}

          {bundle.systems.length > 0 && (
            <SectionCard title="Existing systems" icon={hardwareChipOutline}>
              {bundle.systems.map((s, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong>{s.system_name || s.system_type || 'System'}</strong>
                  <Row label="Vendor" value={s.vendor} />
                  <Row label="Type" value={s.system_type} />
                  <Row label="Users" value={s.number_of_users} />
                  <Row label="Issues" value={s.issues} />
                </div>
              ))}
            </SectionCard>
          )}

          {bundle.printers.length > 0 && (
            <SectionCard title="Printers & hardware" icon={printOutline}>
              {bundle.printers.map((p, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong>{p.printer_type} {p.brand} {p.model}</strong>
                  <Row label="Quantity" value={p.quantity} />
                  <Row label="Condition" value={p.condition} />
                  <Row label="Monthly usage" value={p.monthly_usage} />
                </div>
              ))}
            </SectionCard>
          )}

          <SectionCard title="Inquiry" icon={bulbOutline}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {bundle.inquiryCategories.map((c) => <span key={c.id} className="atc-chip">{c.category_name}</span>)}
            </div>
            <Row label="Title" value={v.inquiry_title} />
            <div style={{ padding: '7px 0' }}>{v.inquiry_description}</div>
            <Row label="Urgency" value={v.urgency} />
            <Row label="Budget" value={v.budget_amount ? formatCurrency(v.budget_amount) : ''} />
          </SectionCard>

          {(bundle.consumables.length + bundle.printerOpportunities.length + bundle.softwareOpportunities.length + bundle.mobileAppOpportunities.length) > 0 && (
            <SectionCard title="Opportunities" icon={bulbOutline}>
              {bundle.consumables.map((c, i) => <Row key={'c' + i} label={`Consumable · ${c.opportunity_status}`} value={c.consumable_type} />)}
              {bundle.printerOpportunities.map((p, i) => <Row key={'p' + i} label={`Printer · ${p.opportunity_status}`} value={p.required_printer_type} />)}
              {bundle.softwareOpportunities.map((s, i) => <Row key={'s' + i} label={`Software · ${s.opportunity_status}`} value={s.application_type} />)}
              {bundle.mobileAppOpportunities.map((m, i) => <Row key={'m' + i} label={`Mobile · ${m.opportunity_status}`} value={m.application_type} />)}
            </SectionCard>
          )}

          <SectionCard title="Lead & business" icon={documentTextOutline}>
            <div style={{ marginBottom: 10 }}><LeadScoreMeter score={v.lead_score ?? 0} /></div>
            <Row label="Rating" value={v.lead_rating} />
            <Row label="Business potential" value={v.business_potential} />
            <Row label="Probability" value={`${v.probability}%`} />
            <Row label="Estimated value" value={formatCurrency(v.estimated_business_value ?? 0)} />
            <Row label="Priority" value={v.priority} />
          </SectionCard>

          {!!v.follow_up_required && (
            <SectionCard title="Follow-up" icon={calendarOutline}>
              <Row label="Date" value={formatDate(v.follow_up_date)} />
              <Row label="Time" value={v.follow_up_time} />
              <Row label="Mode" value={v.follow_up_mode} />
            </SectionCard>
          )}

          <SectionCard title="Notes" icon={documentTextOutline}>
            <Row label="Meeting summary" value={v.meeting_summary} />
            <Row label="Client response" value={v.client_response} />
            <Row label="Observation" value={v.employee_observation} />
            <Row label="Recommended solution" value={v.recommended_solution} />
            <Row label="Next action" value={v.next_action} />
          </SectionCard>

          <IonButton expand="block" onClick={generateIndividualReport} style={{ '--border-radius': '14px', height: 50, fontWeight: 700 }}>
            <IonIcon slot="start" icon={documentTextOutline} /> Generate Individual Report
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => history.push(`/visit/edit/${id}`)} style={{ '--border-radius': '14px', marginTop: 10 }}>
            <IonIcon slot="start" icon={createOutline} /> Edit Visit
          </IonButton>
        </div>
      </IonContent>

      <IonActionSheet isOpen={sheet} onDidDismiss={() => setSheet(false)} header="Visit actions"
        buttons={[
          { text: 'Edit', icon: createOutline, handler: () => history.push(`/visit/edit/${id}`) },
          { text: 'Duplicate', icon: copyOutline, handler: duplicate },
          { text: 'Share summary', icon: shareSocialOutline, handler: shareSummary },
          { text: 'Generate report', icon: documentTextOutline, handler: generateIndividualReport },
          { text: 'Delete', icon: trashOutline, role: 'destructive', handler: () => setDeleteAlert(true) },
          { text: 'Cancel', role: 'cancel' },
        ]} />

      <IonAlert isOpen={deleteAlert} onDidDismiss={() => setDeleteAlert(false)}
        header="Delete visit?" message="This permanently removes the visit and its images."
        buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: doDelete }]} />

      <ProgressOverlay visible={progress.visible} pct={progress.pct} label={progress.label} />
    </IonPage>
  );
};

export default VisitDetails;
