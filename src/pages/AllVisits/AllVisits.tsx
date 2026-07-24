import React, { useState, useCallback, useMemo } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, IonSearchbar, IonAlert, IonModal, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addOutline, listOutline, funnelOutline, closeOutline } from 'ionicons/icons';
import VisitCard from '@/components/visits/VisitCard';
import { EmptyState, SkeletonList } from '@/components/common/ui';
import { Select, PillSelect } from '@/components/forms/fields';
import { visitRepo, imageRepo } from '@/services/database/repository';
import { fileService } from '@/services/filesystem/fileService';
import { CLIENT_CATEGORIES, INQUIRY_CATEGORIES, LEAD_RATINGS } from '@/constants/options';
import { useApp } from '@/hooks/AppContext';
import type { ClientVisit, VisitImage } from '@/types/models';

type SortKey = 'Latest' | 'Oldest' | 'Client name' | 'Lead score' | 'Estimated value';

const AllVisits: React.FC = () => {
  const history = useHistory();
  const { toast, haptic } = useApp();
  const [visits, setVisits] = useState<ClientVisit[]>([]);
  const [images, setImages] = useState<Record<number, VisitImage | null>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: '', rating: '', status: '', city: '', followUp: '', highPotential: false });
  const [sort, setSort] = useState<SortKey>('Latest');

  const load = useCallback(async () => {
    setLoading(true);
    const list = await visitRepo.all();
    setVisits(list);
    const imgs: Record<number, VisitImage | null> = {};
    for (const v of list) if (v.id) imgs[v.id] = await imageRepo.primaryFor(v.id);
    setImages(imgs);
    setLoading(false);
  }, []);

  useIonViewWillEnter(() => { load(); });

  const doDelete = async () => {
    if (deleteId == null) return;
    const imgs = await imageRepo.forVisit(deleteId);
    for (const im of imgs) await fileService.deleteFile(im.image_path);
    await visitRepo.delete(deleteId);
    setDeleteId(null); haptic('success'); toast('Visit deleted', 'success'); load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = visits.filter((v) => {
      if (q) {
        const hay = [v.client_name, v.business_name, v.mobile_number, v.visit_number, v.city, v.inquiry_description, v.employee_name].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.category && v.client_category !== filters.category) return false;
      if (filters.rating && v.lead_rating !== filters.rating) return false;
      if (filters.status && v.status !== filters.status) return false;
      if (filters.city && !v.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.followUp === 'Yes' && v.follow_up_required !== 1) return false;
      if (filters.followUp === 'No' && v.follow_up_required === 1) return false;
      if (filters.highPotential && !(['Hot', 'Immediate'].includes(v.lead_rating) || ['High', 'Very high'].includes(v.business_potential))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'Oldest': return (a.id ?? 0) - (b.id ?? 0);
        case 'Client name': return a.client_name.localeCompare(b.client_name);
        case 'Lead score': return (b.lead_score ?? 0) - (a.lead_score ?? 0);
        case 'Estimated value': return (b.estimated_business_value ?? 0) - (a.estimated_business_value ?? 0);
        default: return (b.id ?? 0) - (a.id ?? 0);
      }
    });
    return list;
  }, [visits, search, filters, sort]);

  const activeFilterCount = Object.values(filters).filter((v) => !!v).length;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>All Visits</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowFilters(true)}>
              <IonIcon slot="icon-only" icon={funnelOutline} />
              {activeFilterCount > 0 && <span style={{ position: 'absolute', top: 4, right: 2, background: 'var(--atc-error)', color: '#fff', borderRadius: 8, fontSize: 10, padding: '0 5px' }}>{activeFilterCount}</span>}
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={search} onIonInput={(e) => setSearch(e.detail.value ?? '')} placeholder="Search client, business, mobile, city…" style={{ '--border-radius': '12px' }} />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          {loading ? <SkeletonList /> : filtered.length === 0 ? (
            <EmptyState icon={listOutline} title={search || activeFilterCount ? 'No matching visits' : 'No visits yet'}
              message={search || activeFilterCount ? 'No matching client visits were found. Try changing the search or filters.' : 'Create your first client visit to get started.'}
              action={!search && !activeFilterCount ? <IonButton onClick={() => history.push('/visit/new')} style={{ '--border-radius': '12px' }}><IonIcon slot="start" icon={addOutline} /> New Visit</IonButton> : undefined}
            />
          ) : (
            <>
              <div className="atc-spread" style={{ margin: '4px 4px 12px' }}>
                <span className="atc-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={['Latest', 'Oldest', 'Client name', 'Lead score', 'Estimated value']} />
              </div>
              {filtered.map((v) => (
                <VisitCard key={v.id} visit={v} primaryImage={v.id ? images[v.id] : null}
                  onOpen={() => history.push(`/visit/${v.id}`)}
                  onEdit={() => history.push(`/visit/edit/${v.id}`)}
                  onDelete={() => setDeleteId(v.id!)} />
              ))}
            </>
          )}
        </div>
      </IonContent>

      <IonModal isOpen={showFilters} onDidDismiss={() => setShowFilters(false)} breakpoints={[0, 0.9]} initialBreakpoint={0.9}>
        <div className="atc-page-pad" style={{ overflowY: 'auto' }}>
          <div className="atc-spread" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Filters</h2>
            <IonButton fill="clear" onClick={() => setShowFilters(false)}><IonIcon icon={closeOutline} /></IonButton>
          </div>
          <Select label="Client category" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} options={CLIENT_CATEGORIES} />
          <PillSelect label="Lead rating" value={filters.rating} onChange={(v) => setFilters((f) => ({ ...f, rating: f.rating === v ? '' : v }))} options={LEAD_RATINGS} />
          <PillSelect label="Status" value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: f.status === v ? '' : v }))} options={['draft', 'submitted']} />
          <PillSelect label="Follow-up required" value={filters.followUp} onChange={(v) => setFilters((f) => ({ ...f, followUp: f.followUp === v ? '' : v }))} options={['Yes', 'No']} />
          <div className="atc-card" style={{ padding: 12 }}>
            <div className="atc-spread" onClick={() => setFilters((f) => ({ ...f, highPotential: !f.highPotential }))} style={{ cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>High-potential leads only</span>
              <span className={`atc-chip ${filters.highPotential ? '' : 'draft'}`}>{filters.highPotential ? 'On' : 'Off'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <IonButton fill="outline" style={{ flex: 1 }} onClick={() => setFilters({ category: '', rating: '', status: '', city: '', followUp: '', highPotential: false })}>Clear</IonButton>
            <IonButton style={{ flex: 1 }} onClick={() => setShowFilters(false)}>Apply</IonButton>
          </div>
        </div>
      </IonModal>

      <IonAlert isOpen={deleteId != null} onDidDismiss={() => setDeleteId(null)}
        header="Delete visit?" message="This will permanently remove the visit and its images."
        buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: doDelete }]} />
    </IonPage>
  );
};

export default AllVisits;
