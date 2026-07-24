import React, { useEffect, useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useIonViewWillEnter } from '@ionic/react';
import {
  addOutline, todayOutline, listOutline, notificationsOutline, documentTextOutline,
  downloadOutline, settingsOutline, personCircleOutline, calendarOutline, timeOutline,
  trendingUpOutline, cubeOutline, printOutline, codeSlashOutline, phonePortraitOutline,
  cashOutline, flameOutline, playForwardOutline, chevronForwardOutline,
} from 'ionicons/icons';
import AtcLogo from '@/components/common/AtcLogo';
import StoredImage from '@/components/images/StoredImage';
import { StatTile, AnimatedNumber } from '@/components/common/ui';
import { useApp } from '@/hooks/AppContext';
import { getDashboardStats, imageRepo, visitRepo } from '@/services/database/repository';
import { seedService } from '@/services/seed/seedService';
import { draftService } from '@/services/draft/draftService';
import { todayIso, greeting, formatCurrency, initials } from '@/utils/format';
import type { DashboardStats } from '@/types/models';

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { profile } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [clock, setClock] = useState(new Date());

  const load = useCallback(async () => {
    await seedService.seedIfEmpty();
    setStats(await getDashboardStats(todayIso()));
    setHasDraft(await draftService.has());
  }, []);

  useIonViewWillEnter(() => { load(); });
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const actions = [
    { label: 'New Client Visit', icon: addOutline, to: '/visit/new', accent: '#0F9D58' },
    { label: "Today's Visits", icon: todayOutline, to: '/today', accent: '#08783F' },
    { label: 'All Visits', icon: listOutline, to: '/visits', accent: '#0F9D58' },
    { label: 'Follow-ups', icon: notificationsOutline, to: '/followups', accent: '#F59E0B' },
    { label: 'Day-End Report', icon: documentTextOutline, to: '/reports', accent: '#08783F' },
    { label: 'Settings', icon: settingsOutline, to: '/settings', accent: '#66736C' },
  ];

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => load().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Header */}
        <div className="atc-gradient" style={{ padding: '46px 18px 26px', borderRadius: '0 0 26px 26px' }}>
          <div className="atc-spread">
            <div className="atc-row">
              <AtcLogo size={40} variant="white" />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{greeting()},</div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{profile?.employee_name?.split(' ')[0] ?? 'Employee'}</div>
              </div>
            </div>
            <div onClick={() => history.push('/profile')} style={{ cursor: 'pointer' }}>
              {profile?.profile_image_path
                ? <StoredImage path={profile.profile_image_path} width={44} height={44} radius={22} />
                : <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {profile ? initials(profile.employee_name) : <IonIcon icon={personCircleOutline} />}
                  </div>}
            </div>
          </div>

          <div className="atc-row" style={{ marginTop: 18, gap: 18, color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
            <span><IonIcon icon={calendarOutline} style={{ verticalAlign: -2 }} /> {clock.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span><IonIcon icon={timeOutline} style={{ verticalAlign: -2 }} /> {clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Estimated value banner */}
          <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Today's estimated business value</div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>{formatCurrency(stats?.estimatedValue ?? 0)}</div>
            </div>
            <IonIcon icon={cashOutline} style={{ color: '#fff', fontSize: 34, opacity: 0.85 }} />
          </div>
        </div>

        <div className="atc-page-pad">
          {hasDraft && (
            <div className="atc-card atc-card-press atc-slide-up" style={{ display: 'flex', alignItems: 'center', gap: 12, borderColor: 'var(--atc-warning)', background: '#FFFBEB' }} onClick={() => history.push('/visit/new')}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IonIcon icon={playForwardOutline} style={{ color: '#92400E', fontSize: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Continue draft visit</div>
                <div className="atc-muted">You have an unfinished visit saved</div>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--atc-text-secondary)' }} />
            </div>
          )}

          {/* Stat grid */}
          <div className="atc-section-title">Today's Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatTile icon={todayOutline} value={<AnimatedNumber value={stats?.todayVisits ?? 0} />} label="Total visits" onClick={() => history.push('/today')} />
            <StatTile icon={documentTextOutline} value={<AnimatedNumber value={stats?.completedVisits ?? 0} />} label="Completed" accent="#08783F" />
            <StatTile icon={notificationsOutline} value={<AnimatedNumber value={stats?.pendingFollowUps ?? 0} />} label="Pending follow-ups" accent="#F59E0B" onClick={() => history.push('/followups')} />
            <StatTile icon={flameOutline} value={<AnimatedNumber value={stats?.highPotential ?? 0} />} label="High-potential" accent="#DC2626" />
          </div>

          <div className="atc-section-title">Opportunities</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatTile icon={cubeOutline} value={<AnimatedNumber value={stats?.consumableOpps ?? 0} />} label="Consumables" />
            <StatTile icon={printOutline} value={<AnimatedNumber value={stats?.printerOpps ?? 0} />} label="Printers" accent="#08783F" />
            <StatTile icon={codeSlashOutline} value={<AnimatedNumber value={stats?.softwareOpps ?? 0} />} label="Software" />
            <StatTile icon={phonePortraitOutline} value={<AnimatedNumber value={stats?.mobileAppOpps ?? 0} />} label="Mobile apps" accent="#08783F" />
          </div>

          {/* Action cards */}
          <div className="atc-section-title">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {actions.map((a) => (
              <div key={a.label} className="atc-card atc-card-press" style={{ margin: 0, padding: 16, minHeight: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => history.push(a.to)}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--atc-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IonIcon icon={a.icon} style={{ color: a.accent, fontSize: 22 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0 90px', color: 'var(--atc-text-secondary)', fontSize: 12 }}>
            <AtcLogo size={30} />
            <div style={{ marginTop: 8 }}>Developed by ATC Group</div>
          </div>
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="end" style={{ marginBottom: 'var(--ion-safe-area-bottom, 0px)' }}>
          <IonFabButton onClick={() => history.push('/visit/new')} style={{ '--box-shadow': '0 10px 24px rgba(8,120,63,0.4)' }}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
