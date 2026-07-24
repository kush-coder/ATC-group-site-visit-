/**
 * Small reusable UI primitives shared across pages.
 */
import React from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';

/* ---------- Stat tile with animated counter ---------- */
export const StatTile: React.FC<{
  value: React.ReactNode;
  label: string;
  icon?: string;
  accent?: string;
  onClick?: () => void;
}> = ({ value, label, icon, accent = 'var(--atc-primary)', onClick }) => (
  <div className="atc-stat atc-card-press atc-fade-in" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    {icon && (
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--atc-mint)', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <IonIcon icon={icon} style={{ fontSize: 18 }} />
      </div>
    )}
    <div className="atc-stat-value" style={{ color: accent }}>{value}</div>
    <div className="atc-stat-label">{label}</div>
  </div>
);

/* ---------- Animated number ---------- */
export const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 700 }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
};

/* ---------- Section card ---------- */
export const SectionCard: React.FC<{ title?: string; icon?: string; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
  <div className={`atc-card atc-fade-in ${className ?? ''}`}>
    {title && (
      <div className="atc-row" style={{ marginBottom: 12 }}>
        {icon && <IonIcon icon={icon} style={{ color: 'var(--atc-primary)', fontSize: 20 }} />}
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
      </div>
    )}
    {children}
  </div>
);

/* ---------- Empty state ---------- */
export const EmptyState: React.FC<{ icon: string; title: string; message: string; action?: React.ReactNode }> = ({ icon, title, message, action }) => (
  <div className="atc-empty atc-fade-in">
    <div className="atc-empty-icon"><IonIcon icon={icon} /></div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action}
  </div>
);

/* ---------- Lead score meter ---------- */
export const LeadScoreMeter: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.max(0, Math.min(10, score)) * 10;
  return (
    <div>
      <div className="atc-spread" style={{ marginBottom: 6 }}>
        <span className="atc-muted">Lead score</span>
        <strong style={{ color: 'var(--atc-deep)' }}>{score}/10</strong>
      </div>
      <div className="atc-meter"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

/* ---------- Progress overlay ---------- */
export const ProgressOverlay: React.FC<{ visible: boolean; pct: number; label: string }> = ({ visible, pct, label }) => {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,78,59,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="atc-slide-up" style={{ background: '#fff', borderRadius: 22, padding: 28, width: 280, textAlign: 'center', boxShadow: 'var(--atc-shadow-lg)' }}>
        <div className="atc-pulse" style={{ marginBottom: 16 }}>
          <IonSpinner name="crescent" style={{ width: 44, height: 44, color: 'var(--atc-primary)' }} />
        </div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{label}</div>
        <div className="atc-meter"><span style={{ width: `${pct}%` }} /></div>
        <div className="atc-muted" style={{ marginTop: 8 }}>{pct}%</div>
      </div>
    </div>
  );
};

/* ---------- Skeleton list ---------- */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="atc-card">
        <div className="atc-skeleton" style={{ height: 16, width: '60%', marginBottom: 10 }} />
        <div className="atc-skeleton" style={{ height: 12, width: '85%', marginBottom: 8 }} />
        <div className="atc-skeleton" style={{ height: 12, width: '40%' }} />
      </div>
    ))}
  </div>
);
