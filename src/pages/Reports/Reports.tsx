import React, { useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, useIonViewWillEnter,
} from '@ionic/react';
import {
  documentTextOutline, downloadOutline, shareSocialOutline, imagesOutline,
  flashOutline, checkmarkCircle, calendarOutline, warningOutline,
} from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import { StatTile, ProgressOverlay, EmptyState } from '@/components/common/ui';
import { TextInput } from '@/components/forms/fields';
import { visitRepo, getVisitBundle } from '@/services/database/repository';
import { generateDayEndReport } from '@/services/excel/excelService';
import { fileService } from '@/services/filesystem/fileService';
import { shareService } from '@/services/share/shareService';
import { useApp } from '@/hooks/AppContext';
import { todayIso, formatCurrency, formatDate } from '@/utils/format';
import type { VisitBundle } from '@/types/models';
import { Capacitor } from '@capacitor/core';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const Reports: React.FC = () => {
  const { profile, toast, haptic } = useApp();
  const [date, setDate] = useState(todayIso());
  const [bundles, setBundles] = useState<VisitBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ visible: false, pct: 0, label: '' });
  const [lastFile, setLastFile] = useState<{ base64: string; fileName: string; uri?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Native always has a share sheet; on web it depends on Web Share API support.
  const canShareFiles = Capacitor.getPlatform() !== 'web' || shareService.canWebShareFile('r.xlsx', XLSX_MIME);

  const load = useCallback(async () => {
    setLoading(true);
    const visits = await visitRepo.byDate(date);
    const bs: VisitBundle[] = [];
    for (const v of visits) { const b = await getVisitBundle(v.id!); if (b) bs.push(b); }
    setBundles(bs);
    setLastFile(null);
    setLoading(false);
  }, [date]);
  useIonViewWillEnter(() => { load(); });
  React.useEffect(() => { load(); }, [load]);

  const totals = React.useMemo(() => {
    let inquiries = 0, consumable = 0, printer = 0, software = 0, mobile = 0, followUps = 0, highPriority = 0, estValue = 0, images = 0;
    for (const b of bundles) {
      inquiries += b.inquiryCategories.length || (b.visit.inquiry_description ? 1 : 0);
      if (b.consumables.some((c) => ['Yes', 'Maybe'].includes(c.opportunity_status))) consumable++;
      if (b.printerOpportunities.some((p) => ['Yes', 'Maybe'].includes(p.opportunity_status))) printer++;
      if (b.softwareOpportunities.some((s) => ['Yes', 'Maybe', 'Need requirement discussion'].includes(s.opportunity_status))) software++;
      if (b.mobileAppOpportunities.some((m) => ['Yes', 'Maybe', 'Need requirement discussion'].includes(m.opportunity_status))) mobile++;
      if (b.visit.follow_up_required) followUps++;
      if (['Hot', 'Immediate'].includes(b.visit.lead_rating) || ['High', 'Very high'].includes(b.visit.business_potential)) highPriority++;
      estValue += b.visit.estimated_business_value ?? 0;
      images += b.images.length;
    }
    return { inquiries, consumable, printer, software, mobile, followUps, highPriority, estValue, images };
  }, [bundles]);

  const generate = async (includeImages: boolean) => {
    if (busy || bundles.length === 0 || !profile) return;
    setBusy(true);
    setProgress({ visible: true, pct: 0, label: 'Starting' });
    try {
      const { base64, fileName } = await generateDayEndReport(bundles, profile, date, {
        includeImages,
        onProgress: (pct, label) => setProgress({ visible: true, pct, label }),
      });
      let uri: string | undefined;
      if (Capacitor.getPlatform() === 'web') {
        toast('Report ready — tap Share to save or send it', 'success');
      } else {
        const saved = await fileService.saveReport(base64, fileName);
        uri = saved.uri;
        toast('Report saved to device', 'success');
      }
      setLastFile({ base64, fileName, uri });
      haptic('success');
      fireConfetti();
    } catch (e) {
      console.error(e);
      toast('Excel generation failed. Please retry.', 'error');
    } finally {
      setProgress({ visible: false, pct: 0, label: '' });
      setBusy(false);
    }
  };

  const shareReport = async () => {
    if (!lastFile) return;
    try {
      const result = await shareService.deliverFile({
        base64: lastFile.base64,
        fileName: lastFile.fileName,
        mime: XLSX_MIME,
        title: 'ATC FieldConnect Day-End Report',
        text: `Day-end report for ${formatDate(date)}`,
        uri: lastFile.uri,
        target: 'report',
      });
      if (result.cancelled) return;
      if (result.method === 'download') toast('Report downloaded', 'success');
    } catch {
      toast('Sharing failed', 'error');
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Day-End Report</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-gradient" style={{ padding: '20px 18px', borderRadius: '0 0 22px 22px' }}>
          <div className="atc-row" style={{ justifyContent: 'space-between' }}>
            <AtcLogo size={38} variant="white" />
            <div style={{ textAlign: 'right', color: '#fff' }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Employee</div>
              <strong>{profile?.employee_name}</strong>
            </div>
          </div>
        </div>

        <div className="atc-page-pad">
          <div className="atc-card">
            <label className="atc-field-label"><IonIcon icon={calendarOutline} style={{ verticalAlign: -2 }} /> Report date</label>
            <TextInput value={date} onChange={setDate} type="date" />
            <div className="atc-muted">{formatDate(date)}</div>
          </div>

          {loading ? (
            <div className="atc-skeleton" style={{ height: 160, borderRadius: 16 }} />
          ) : bundles.length === 0 ? (
            <EmptyState icon={documentTextOutline} title="No visits for this date"
              message="Your generated Excel reports need visit records. Add visits for this date first." />
          ) : (
            <>
              <div className="atc-section-title">Report Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StatTile value={bundles.length} label="Total visits" />
                <StatTile value={totals.inquiries} label="Total inquiries" accent="#08783F" />
                <StatTile value={totals.consumable} label="Consumable opps" />
                <StatTile value={totals.printer} label="Printer opps" accent="#08783F" />
                <StatTile value={totals.software} label="Software opps" />
                <StatTile value={totals.mobile} label="Mobile app opps" accent="#08783F" />
                <StatTile value={totals.followUps} label="Follow-ups" accent="#F59E0B" />
                <StatTile value={totals.highPriority} label="High-priority" accent="#DC2626" />
              </div>

              <div className="atc-card atc-gradient-deep" style={{ marginTop: 14 }}>
                <div className="atc-spread">
                  <span>Estimated business value</span>
                  <strong style={{ fontSize: 20 }}>{formatCurrency(totals.estValue)}</strong>
                </div>
                <div className="atc-spread" style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                  <span>Records to export</span><span>{bundles.length} visits · {totals.images} images</span>
                </div>
              </div>

              {totals.images > 15 && (
                <div className="atc-card" style={{ background: '#FFFBEB', borderColor: 'var(--atc-warning)', display: 'flex', gap: 10 }}>
                  <IonIcon icon={warningOutline} style={{ color: 'var(--atc-warning)', fontSize: 22 }} />
                  <div className="atc-muted">This report contains {totals.images} images. The full report may take longer and produce a larger file. Consider the lightweight report for a quick share.</div>
                </div>
              )}

              {lastFile && (
                <div className="atc-card atc-slide-up" style={{ borderColor: 'var(--atc-success)', background: 'var(--atc-mint)' }}>
                  <div className="atc-row"><IonIcon icon={checkmarkCircle} style={{ color: 'var(--atc-success)', fontSize: 24 }} /><strong>Report ready</strong></div>
                  <div className="atc-muted" style={{ marginTop: 6, wordBreak: 'break-all' }}>{lastFile.fileName}</div>
                  <IonButton expand="block" onClick={shareReport} style={{ '--border-radius': '12px', marginTop: 10 }}>
                    <IonIcon slot="start" icon={canShareFiles ? shareSocialOutline : downloadOutline} />
                    {canShareFiles ? 'Share Excel' : 'Download Excel'}
                  </IonButton>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <IonButton expand="block" onClick={() => generate(true)} disabled={busy} style={{ '--border-radius': '14px', height: 52, fontWeight: 700 }}>
                  <IonIcon slot="start" icon={imagesOutline} /> Generate Full Report with Images
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={() => generate(false)} disabled={busy} style={{ '--border-radius': '14px', marginTop: 10, height: 48 }}>
                  <IonIcon slot="start" icon={flashOutline} /> Generate Lightweight Report
                </IonButton>
              </div>
            </>
          )}
          <div style={{ height: 40 }} />
        </div>
      </IonContent>

      <ProgressOverlay visible={progress.visible} pct={progress.pct} label={progress.label} />
    </IonPage>
  );
};

/** Minimal celebration burst after a report is generated. */
function fireConfetti() {
  const colors = ['#0F9D58', '#08783F', '#16A34A', '#F59E0B'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2000;overflow:hidden';
  document.body.appendChild(container);
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 6;
    p.style.cssText = `position:absolute;top:-10px;left:${Math.random() * 100}%;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:2px;opacity:0.9`;
    p.animate([
      { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 0.6 },
    ], { duration: 1400 + Math.random() * 800, easing: 'cubic-bezier(0.2,0.6,0.4,1)' });
    container.appendChild(p);
  }
  setTimeout(() => container.remove(), 2400);
}

export default Reports;
